import { useMemo, useState } from "react";
import { makeSortedPostColumns, ProbabilityComponents, SortedPost } from "@/app/sortedPosts/sortedPostsColumns";
import { DataTable } from "@/app/sortedPosts/data-table";
import { CardDescription } from "@/components/ui/card";

export default function SortedPosts({data, scoreFn}: {
  data: Post[],
  scoreFn: (post: Post) => { score: number, probabilityComponents: ProbabilityComponents }
}) {
  const [computing, setComputing] = useState(false);

  const sortedPosts: SortedPost[] = useMemo(() => {
    setComputing(true);

    // Compute the score for each post and sorted
    const sorted: SortedPost[] = data.map((post) => {
      const {score, probabilityComponents} = scoreFn(post);
      return {post, score, probability: 0.0, probabilityComponents};
    }).sort((a, b) => b.score - a.score);

    // Compute the probability for each post
    const totalScore = sorted.reduce((acc, post) => acc + post.score, 0);
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].probability = sorted[i].score / totalScore;
      sorted[i].probabilityComponents = {
        likes: sorted[i].probabilityComponents.likes / totalScore,
        comments: sorted[i].probabilityComponents.comments / totalScore,
        hoursSinceCreation: sorted[i].probabilityComponents.hoursSinceCreation / totalScore,
        daysSinceLastRecommendation: sorted[i].probabilityComponents.daysSinceLastRecommendation,
      }
    }

    setComputing(false);
    return sorted;
  }, [data, scoreFn]);

  const maxX = useMemo(() => {
    const maxProbability = Math.max(...sortedPosts.map((sortedPost) => sortedPost.probability));
    return Math.min(1.0, maxProbability / .72);
  }, [sortedPosts]);

  return (
    <div>
      {computing && <div>Computing...</div>}
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
