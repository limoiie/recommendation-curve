import { ChartConfig } from "@/components/ui/chart";

export const chartConfig = {
  likes: {
    label: "#点赞数对推荐概率的贡献",
    color: "hsl(var(--chart-1))",
  },
  comments: {
    label: "#评论数对推荐概率的贡献",
    color: "hsl(var(--chart-2))",
  },
  daysPastCreation: {
    label: "#创建后经过的天数对推荐概率的损失",
    color: "hsl(var(--chart-3))",
  },
  daysPastLastRecommendation: {
    label: "#推荐后经过的天数对推荐概率的损失",
    color: "hsl(var(--chart-4))",
  }
} satisfies ChartConfig
