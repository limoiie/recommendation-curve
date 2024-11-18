import { ChartConfig } from "@/components/ui/chart";

export const chartConfig = {
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
