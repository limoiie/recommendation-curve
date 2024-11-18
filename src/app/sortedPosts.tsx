import PostCard from "@/app/postCard";
import { useMemo, useState } from "react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface ProbabilityComponents {
  likes: number;
  comments: number;
  daysPastCreation: number;
  daysPastLastRecommendation: number;
}

interface SortedPost {
  post: Post;
  score: number;
  probability: number;
  probabilityComponents: ProbabilityComponents
}

const chartConfig = {
  likes: {
    label: "#Likes",
    color: "hsl(var(--chart-1))",
  },
  comments: {
    label: "#Comments",
    color: "hsl(var(--chart-2))",
  },
  daysPastCreation: {
    label: "#Days Past Creation",
    color: "hsl(var(--chart-3))",
  },
  daysPastLastRecommendation: {
    label: "#Days Past Last Recommendation",
    color: "hsl(var(--chart-4))",
  }
} satisfies ChartConfig

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
      <div className="flex flex-col gap-4">
        {sortedPosts.map((sortedPost, i) => (
          <div key={i} className="flex flex-col">
            <ChartContainer config={chartConfig} className="w-96 h-[24px] mb-[-4px] aspect-auto">
              <BarChart accessibilityLayer layout="vertical" barSize={10} data={[
                {
                  ...sortedPost.probabilityComponents,
                  daysPastLastRecommendation: 0,
                },
              ]}>
                <CartesianGrid horizontal={false}/>
                <ChartTooltip content={<ChartTooltipContent hideLabel/>}/>
                <XAxis hide type="number" domain={[0, maxX]}/>
                <YAxis hide type="category"/>
                <Bar
                  dataKey="likes"
                  stackId="a"
                  fill="var(--color-likes)"
                  fillOpacity={0.4}
                  stroke="var(--color-likes)"
                  radius={[4, 0, 0, 4]}
                />
                <Bar
                  dataKey="comments"
                  stackId="a"
                  fill="var(--color-comments)"
                  fillOpacity={0.4}
                  stroke="var(--color-comments)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="daysPastCreation"
                  stackId="a"
                  fill="var(--color-daysPastCreation)"
                  fillOpacity={0.4}
                  stroke="var(--color-daysPastCreation)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
            <ChartContainer config={chartConfig} className="w-96 h-[24px] mt-[-4px] aspect-auto">
              <BarChart accessibilityLayer layout="vertical" barSize={10} data={[
                {
                  ...sortedPost.probabilityComponents,
                  likes: 0,
                  comments: 0,
                  daysPastCreation: 0,
                },
              ]}>
                <CartesianGrid horizontal={false}/>
                <ChartTooltip content={<ChartTooltipContent hideLabel/>}/>
                <XAxis hide type="number" domain={[0, 1]}/>
                <YAxis hide type="category"/>
                <Bar
                  dataKey="daysPastLastRecommendation"
                  stackId="a"
                  fill="var(--color-daysPastLastRecommendation)"
                  fillOpacity={0.4}
                  stroke="var(--color-daysPastLastRecommendation)"
                  radius={[4, 4, 4, 4]}
                />
              </BarChart>
            </ChartContainer>
            <PostCard data={sortedPost.post}/>
          </div>
        ))}
      </div>
    </div>
  )
}