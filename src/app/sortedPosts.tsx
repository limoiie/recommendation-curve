import { useMemo, useState } from "react";
import { makeSortedPostColumns, ProbabilityComponents, SortedPost } from "@/app/sortedPosts/sortedPostsColumns";
import { DataTable } from "@/app/sortedPosts/data-table";

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
        daysPastCreation: sorted[i].probabilityComponents.daysPastCreation / totalScore,
        daysPastLastRecommendation: sorted[i].probabilityComponents.daysPastLastRecommendation,
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
    </div>
  )
}
