import React, { useMemo, useState } from "react";
import { makeSortedPostColumns, ProbabilityComponents, SortedPost } from "@/app/sortedPosts/sortedPostsColumns";
import { DataTable } from "@/app/sortedPosts/data-table";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sum } from "d3-array";

function generateBinaryWeights(rate: number, size: number) {
  const weights: number[] = [];
  if (size > 0) {
    weights.push(rate / 2);
    for (let i = 1; i < size; i++) {
      weights.push(weights[i - 1] / 2);
    }
    weights[size - 1] *= 2;
  }
  return weights;
}

class EfficientWeightedSampler {
  private readonly random: () => number;
  private readonly weights: number[];
  private readonly size: number;
  private readonly fenwickTree: number[];

  constructor(weights: number[]) {
    this.random = Math.random;
    this.weights = weights;
    this.size = weights.length;
    this.fenwickTree = new Array(this.size + 1).fill(0);
    this.buildFenwickTree();
  }

  buildFenwickTree() {
    for (let i = 0; i < this.size; i++) {
      this.updateFenwickTree(i, this.weights[i]);
    }
  }

  updateFenwickTree(i: number, delta: number) {
    i++; // Fenwick Tree is 1-based index
    while (i <= this.size) {
      this.fenwickTree[i] += delta;
      i += i & (-i);
    }
  }

  getFenwickTreeSum(i: number) {
    let sum = 0.0;
    while (i > 0) {
      sum += this.fenwickTree[i];
      i -= i & (-i);
    }
    return sum;
  }

  binarySearch(prefixSum: number) {
    let low = 1, high = this.size, mid;
    while (low < high) {
      mid = low + Math.floor((high - low) / 2);
      if (prefixSum < this.getFenwickTreeSum(mid)) {
        high = mid;
      } else {
        low = mid + 1;
      }
    }
    return low - 1; // Adjusting to 0-based index
  }

  pickIndex() {
    const target = this.random() * this.getFenwickTreeSum(this.size);
    const index = this.binarySearch(target);
    this.updateFenwickTree(index, -this.weights[index]);
    return index;
  }
}

function sampleIndicesWithoutReplacement(weights: number[], numIndices: number) {
  numIndices = Math.min(numIndices, weights.length);
  const selectedIndices = [];
  const sampler = new EfficientWeightedSampler(weights);

  for (let i = 0; i < numIndices; i++) {
    const selectedIndex = sampler.pickIndex();
    if (weights[selectedIndex] === 0) {
      // If an index with zero weight is selected,
      // it indicates that no index with a non-zero weight is available.
      break;
    }
    selectedIndices.push(selectedIndex);
  }
  return selectedIndices;
}

export default function SortedPosts({data, scoreFn}: {
  data: Post[],
  scoreFn: (post: Post) => { score: number, probabilityComponents: ProbabilityComponents }
}) {
  const [computing, setComputing] = useState(false);
  const [recompute, setRecompute] = useState(0);
  const [newPostsRate, setNewPostsRate] = useState(0.2);

  const handleNewPostsRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPostsRate(parseFloat(e.target.value));
  };

  const sortedPosts: SortedPost[] = useMemo(() => {
    setComputing(true);
    console.log("Recompute", recompute);

    // Compute the score for each post and sorted in hot
    const hotPosts: SortedPost[] = data.map((post) => {
      const {score, probabilityComponents} = scoreFn(post);
      return {post, score, probability: 0.0, probabilityComponents};
    }).sort((a, b) => b.score - a.score);

    // Compute the probability for each post
    const totalScore = hotPosts.reduce((acc, post) => acc + post.score, 0);
    for (let i = 0; i < hotPosts.length; i++) {
      hotPosts[i].probability = hotPosts[i].score / totalScore;
      hotPosts[i].probabilityComponents = {
        likes: hotPosts[i].probabilityComponents.likes / totalScore,
        comments: hotPosts[i].probabilityComponents.comments / totalScore,
        hoursSinceCreation: hotPosts[i].probabilityComponents.hoursSinceCreation / totalScore,
        daysSinceLastRecommendation: hotPosts[i].probabilityComponents.daysSinceLastRecommendation,
      }
    }

    const newPosts: SortedPost[] = [];
    for (const post of hotPosts) {
      if (post.post.hoursSinceCreation <= 24) {
        newPosts.push(post);
      }
    }
    newPosts.sort((a, b) => a.post.hoursSinceCreation - b.post.hoursSinceCreation);

    const pageSize = 6;
    const recommended: SortedPost[] = [];

    const seenPosts: Set<SortedPost> = new Set();
    while (recommended.length < data.length) {
      const hotPool: SortedPost[] = [];
      for (const post of hotPosts) {
        if (!seenPosts.has(post)) {
          hotPool.push(post);
        }
        if (hotPool.length >= pageSize * 2) {
          break;
        }
      }

      const newPool: SortedPost[] = [];
      for (const post of newPosts) {
        if (!seenPosts.has(post) && !hotPool.includes(post)) {
          newPool.push(post);
        }
        if (newPool.length >= pageSize) {
          break;
        }
      }
      const hotWeights: number[] = generateBinaryWeights(1 - newPostsRate, hotPool.length);
      const newWeights: number[] = generateBinaryWeights(newPostsRate, newPool.length);

      const pool: SortedPost[] = hotPool.concat(newPool);
      const poolWeights = hotWeights.concat(newWeights);
      console.log("pool:", pool.length, "pool weights:", sum(poolWeights), poolWeights);

      const selectedIndices = sampleIndicesWithoutReplacement(poolWeights, pageSize);
      for (const selectedIndex of selectedIndices) {
        seenPosts.add(pool[selectedIndex]);
        recommended.push(pool[selectedIndex]);
      }
    }

    setComputing(false);
    return recommended;
  }, [recompute, data, scoreFn, newPostsRate]);

  const maxX = useMemo(() => {
    const maxProbability = Math.max(...sortedPosts.map((sortedPost) => sortedPost.probability));
    return Math.min(1.0, maxProbability / .72);
  }, [sortedPosts]);

  return (
    <div>
      {computing && <div>Computing...</div>}
      <Button className="mb-4" onClick={() => setRecompute(recompute + 1)}>Recompute</Button>
      <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
        <Label>每页（每次）推荐中新帖子的占比:</Label>
        <Input
          type="number"
          step="0.05"
          id="alpha"
          placeholder="Alpha"
          value={newPostsRate}
          onChange={handleNewPostsRateChange}
          min={0}
          max={1}/>
      </div>

      <div className="container mx-auto ">
        <DataTable columns={makeSortedPostColumns(maxX)} data={sortedPosts}/>
      </div>
      <CardDescription className="m-auto">
        注：Probability Components 列的条形图中，
        <ul>
          <li>
            红色和绿色的部分加起来代表了该 Post 的最终推荐概率；
          </li>
          <li>
            灰色框和黄色框的部分分别代表了新鲜度和遗忘度导致推荐概率减少的部分，
            增加新鲜度或遗忘度会导致该部分减少，从而增加推荐概率。
          </li>
        </ul>
      </CardDescription>
    </div>
  )
}
