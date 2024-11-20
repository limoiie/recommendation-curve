import { ColumnDef } from "@tanstack/table-core";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { chartConfig } from "@/app/chart-config";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import PostCard from "@/components/postCard";

export interface ProbabilityComponents {
  likes: number;
  comments: number;
  hoursSinceCreation: number;
  daysSinceLastRecommendation: number;
}

export interface SortedPost {
  post: Post;
  score: number;
  probability: number;
  probabilityComponents: ProbabilityComponents
}

export function makeSortedPostColumns(maxX: number) {
  return [
    {
      accessorKey: "postWithProbability", header: "Post", cell: (data) =>
        <PostCard className="w-64" data={data.row.original.post}/>,
      filterFn: (row, _columnId, filterValue) => {
        const {likes, comments, hoursSinceCreation, daysSinceLastRecommendation} = row.original.post;
        console.trace(likes, comments, hoursSinceCreation, daysSinceLastRecommendation)
        try {
          return eval(filterValue);
        } catch (e) {
          console.trace(e)
          return false;
        }
      }
    },
    {
      accessorKey: "probabilityComponents", header: "Score Components", cell: (data) => {
        const pc = data.row.original.probabilityComponents;
        const p = data.row.original.probability;
        const deltaByDaysPastLastRecommendation = pc.daysSinceLastRecommendation != 0 ? p * (1 / pc.daysSinceLastRecommendation - 1) : p;
        return <div>
          <ChartContainer config={chartConfig} className="w-96 h-[24px] aspect-auto">
            <BarChart accessibilityLayer layout="vertical" barSize={10} data={[
              {
                ...pc,
                daysSinceLastRecommendation: deltaByDaysPastLastRecommendation ?? p,
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
                radius={[0, 0, 0, 0]}
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
                dataKey="hoursSinceCreation"
                stackId="a"
                fill="var(--color-hoursSinceCreation)"
                fillOpacity={0.4}
                stroke="var(--color-hoursSinceCreation)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="daysSinceLastRecommendation"
                stackId="a"
                fill="var(--color-daysSinceLastRecommendation)"
                fillOpacity={0.1}
                stroke="var(--color-daysSinceLastRecommendation)"
                strokeOpacity={0.5}
                strokeDasharray={3}
                strokeDashoffset={0}
                radius={[0, 0, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>;
      }
    },
    {
      accessorKey: "probability", header: ((header) =>
          <Button
            variant="ghost"
            className="flex m-auto"
            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
          >
            Score
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>

      ), cell: (data) => (
        <div className="text-center">
          {(data.row.original.probability * 100).toFixed(5)} %
        </div>
      )
    },
  ] as ColumnDef<SortedPost>[]
}
