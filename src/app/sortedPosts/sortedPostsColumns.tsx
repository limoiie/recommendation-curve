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
  daysPastCreation: number;
  daysPastLastRecommendation: number;
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
      accessorKey: "postWithProbability", header: "Post & Probability", cell: (data) =>
        <PostCard className="w-64" data={data.row.original.post}/>
    },
    {
      accessorKey: "probabilityComponents", header: "Probability Components", cell: (data) =>
        <div>
          <ChartContainer config={chartConfig} className="w-96 h-[24px] aspect-auto">
            <BarChart accessibilityLayer layout="vertical" barSize={10} data={[
              {
                ...data.row.original.probabilityComponents,
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
                ...data.row.original.probabilityComponents,
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
        </div>
    },
    {
      accessorKey: "probability", header: ((header) =>
          <Button
            variant="ghost"
            className="flex m-auto"
            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
          >
            Probability
            <ArrowUpDown className="ml-2 h-4 w-4"/>
          </Button>

      ), cell: (data) => (
        <div className="text-center">
          {data.row.original.probability.toFixed(4)}
        </div>
      )
    },
  ] as ColumnDef<SortedPost>[]
}
