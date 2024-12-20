'use client'

import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { chartConfig } from "@/app/chart-config";
import SortedPosts from "@/app/sortedPosts";
import RecommendedPosts from "@/app/recommendedPosts";

const chartMargin = {
  left: 12,
  right: 12,
};

function range(start: number, end: number, step: number) {
  const range = [];
  for (let i = start; i <= end; i += step) {
    range.push(i);
  }
  return range;
}

function newPost(
  {
    title = '',
    likes = 0,
    comments = 0,
    hoursSinceCreation = 0,
    daysSinceLastRecommendation = 0
  }: Partial<Post>
) {
  return {
    title: title,
    likes: likes,
    comments: comments,
    hoursSinceCreation: hoursSinceCreation,
    daysSinceLastRecommendation: daysSinceLastRecommendation,
  };
}

export default function Home() {
  const [alpha, setAlpha] = useState(0.5);
  const [chartDataPopularity, setChartDataPopularity] = useState([]);
  const [xsPopularity] = useState(range(0, 50, 10));

  const [freshHours, setFreshHours] = useState(9);
  const [beta, setBeta] = useState(0.5);
  const [omega, setOmega] = useState(10);
  const [chartDataFreshness, setChartDataFreshness] = useState([]);
  const [xsFreshness] = useState(range(0, 48, 2));

  const [gamma, setGamma] = useState(0.1);
  const [delayDays, setDelayDays] = useState(14);
  const [chartDataForgetting, setChartDataForgetting] = useState([]);
  const [xsForgetting] = useState(range(0, 28, 1));

  const [data, setData] = useState<Post[]>([]); // Use an array if your JSON contains an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const computeLikesScore = useMemo(() => (post: Post) => {
    return alpha * (post.likes);
  }, [alpha])

  const computeCommentsScore = useMemo(() => (post: Post) => {
    return (1 - alpha) * (post.comments);
  }, [alpha])

  const computeFreshnessScore = useMemo(() => (post: Post) => {
    return omega / (1 + Math.exp(beta * (post.hoursSinceCreation - freshHours)));
  }, [omega, beta, freshHours])

  const computeForgettingScore = useMemo(() => (post: Post) => {
    if (post.daysSinceLastRecommendation < 0) {
      return 1.0;
    }
    return 1.0 - Math.min(Math.exp(-gamma * (post.daysSinceLastRecommendation - delayDays)), 1.0);
  }, [gamma, delayDays])

  const scoreFn = useMemo(() => {
    return (post: Post) => {
      const pl = computeLikesScore(post);
      const pc = computeCommentsScore(post);
      const f = computeFreshnessScore(post);
      const s = computeForgettingScore(post);
      const score = (pl + pc + f) * s;
      return {
        score: score,
        probabilityComponents: {
          likes: pl * s,
          comments: pc * s,
          hoursSinceCreation: f * s,
          daysSinceLastRecommendation: s,
        }
      }
    }
  }, [computeLikesScore, computeCommentsScore, computeFreshnessScore, computeForgettingScore]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/post.json'); // Fetching data from public folder
        if (!response.ok) {
          setError(Error('Failed to fetch: ' + response.statusText));
          setLoading(false);
          return;
        }
        const jsonData: Post[] = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (err: unknown) {
        setError(err as Error);
      }
    };

    fetchData().then(r => console.log(r));
  }, []); // Empty dependency array to run only once on component mount

  // Generate data for the popularity chart
  useEffect(() => {
    const chartDataPopularity = xsPopularity.map((x) => {
      return {
        count: x,
        likes: computeLikesScore(newPost({likes: x})),
        comments: computeCommentsScore(newPost({comments: x})),
      };
    });
    setChartDataPopularity(chartDataPopularity as never[]);
  }, [computeLikesScore, computeCommentsScore, xsPopularity, alpha]);

  // Generate data for the freshness chart
  useEffect(() => {
    const chartDataFreshness = xsFreshness.map((x) => {
      return {
        days: x,
        hoursSinceCreation: computeFreshnessScore(newPost({hoursSinceCreation: x})),
      };
    });
    setChartDataFreshness(chartDataFreshness as never[]);
  }, [computeFreshnessScore, xsFreshness, freshHours, beta]);

  // Generate data for the Forgetting chart
  useEffect(() => {
    const chartDataForgetting = xsForgetting.map((x) => {
      return {
        days: x,
        daysSinceLastRecommendation: computeForgettingScore(newPost({daysSinceLastRecommendation: x})),
      };
    });
    setChartDataForgetting(chartDataForgetting as never[]);
  }, [computeForgettingScore, xsForgetting, gamma, delayDays]);

  function handleAlphaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newAlpha = parseFloat(e.target.value);
    if (!isNaN(newAlpha) && newAlpha >= 0 && newAlpha <= 1) {
      setAlpha(newAlpha);
    }
  }

  function handleOmegaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newOmega = parseFloat(e.target.value);
    if (!isNaN(newOmega) && newOmega >= 0) {
      setOmega(newOmega);
    }
  }

  function handleFreshHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFreshHours = parseFloat(e.target.value);
    if (!isNaN(newFreshHours) && newFreshHours >= 0 && newFreshHours <= 28) {
      setFreshHours(newFreshHours);
    }
  }

  function handleDecayRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDecayRate = parseFloat(e.target.value);
    if (!isNaN(newDecayRate) && newDecayRate >= 0 && newDecayRate <= 28) {
      setBeta(newDecayRate);
    }
  }

  function handleDelayDaysChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDelayDays = parseInt(e.target.value);
    if (!isNaN(newDelayDays) && newDelayDays >= 0 && newDelayDays <= 28) {
      setDelayDays(newDelayDays);
    }
  }

  function handleGammaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newGamma = parseFloat(e.target.value);
    if (!isNaN(newGamma) && newGamma >= 0 && newGamma <= 28) {
      setGamma(newGamma);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <MathJaxContext>
      <div className="flex flex-row">
        <ScrollArea className="h-screen">
          <div className="flex flex-col w-[640px] min-w-[640px]">
            <div className="flex flex-col">
              <CardHeader className="pb-0">
                <CardTitle>整体推荐度评分公式</CardTitle>
                <CardDescription>
                  评分公式由人气评分、新鲜度评分和遗忘率三部分组成。
                  每个部分的权重和参数可以调整以获得不同的推荐效果。
                  <MathJax>
                    {/*{String.raw`*/}
                    {/*  \[*/}
                    {/*    \mathtt{Score} = (*/}
                    {/*    \frac{w_\mathtt{p}}{w_\mathtt{p} + w_\mathtt{f}} \times S_\mathtt{popularity} + */}
                    {/*    \frac{w_\mathtt{f}}{w_\mathtt{p} + w_\mathtt{f}} \times S_\mathtt{freshness}) \times P_\mathtt{Forgetting} \\*/}
                    {/*  \] `}*/}
                    {String.raw`
                      \[
                        \mathtt{Score} = (S_\mathtt{popularity} + S_\mathtt{freshness}) \times P_\mathtt{Forgetting} \\
                      \] `}
                  </MathJax>
                </CardDescription>
              </CardHeader>
            </div>
            <div className="flex flex-col m-8 mb-0 rounded border">
              <CardHeader>
                <CardTitle>人气评分 <span className="text-neutral-400">(点赞数+评论数)</span></CardTitle>
                <CardDescription>
                  根据帖子收到的点赞和评论数量得出的评分。
                  这表明帖子有多吸引人。
                  <MathJax>
                    {String.raw`
                      \[
                        S_\mathtt{popularity} = \alpha \times n_\mathtt{Likes} + (1 - \alpha) \times n_\mathtt{Comments}
                      \]
                    `}
                  </MathJax>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row space-x-4">
                  <div className="flex flex-col min-w-32 w-32 space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \alpha \)`} <span className="text-neutral-500">(点赞数占比)</span></MathJax></Label>
                      <Input
                        type="number"
                        step="0.05"
                        id="alpha"
                        placeholder="Alpha"
                        value={alpha}
                        onChange={handleAlphaChange}
                        min={0}
                        max={1}/>
                    </div>
                  </div>
                  <div className="rounded border">
                    <CardHeader>
                      <CardTitle>Popularity Chart - Stacked</CardTitle>
                      <CardDescription>
                        显示人气成分的堆叠面积图
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig}>
                        <AreaChart
                          accessibilityLayer
                          data={chartDataPopularity}
                          className="mr-3"
                          margin={chartMargin}
                        >
                          <CartesianGrid vertical={false}/>
                          <XAxis
                            dataKey="count"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot"/>}
                          />
                          <Area
                            dataKey="comments"
                            type="basis"
                            fill="var(--color-comments)"
                            fillOpacity={0.4}
                            stroke="var(--color-comments)"
                            stackId="a"
                          />
                          <Area
                            dataKey="likes"
                            type="basis"
                            fill="var(--color-likes)"
                            fillOpacity={0.4}
                            stroke="var(--color-likes)"
                            stackId="a"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter>
                      <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                          {/*<div className="flex items-center gap-2 font-medium leading-none"> </div>*/}
                          <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            X-坐标是点赞数或评论数
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="flex flex-col m-8 mb-0 rounded border">
              <CardHeader>
                <CardTitle>新鲜度</CardTitle>
                <CardDescription>
                  基于帖子创建或更新的时间得出的评分。
                  这有助于优先考虑较新的内容。
                  <MathJax>
                    {String.raw`
                      \[
                        S_\mathtt{freshness} = \frac{\omega}{1 + e^{\beta \times (x - \mathtt{freshHours})}}
                      \]
                    `}
                  </MathJax>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row space-x-4">
                  <div className="flex flex-col min-w-32 w-32 space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \omega \)`} <span
                        className="text-neutral-500">(新鲜度系数)</span></MathJax></Label>
                      <Input
                        type="number"
                        step=".2"
                        id="omega"
                        placeholder="Omega"
                        value={omega}
                        onChange={handleOmegaChange}
                        min={0}/>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \mathtt{freshHours} \)`} <span
                        className="text-neutral-500">(该小时内新鲜度 &gt;0.5)</span></MathJax></Label>
                      <Input
                        type="number"
                        step="1"
                        id="freshHours"
                        placeholder="Fresh Days"
                        value={freshHours}
                        onChange={handleFreshHoursChange}
                        min={0}
                        max={28}/>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \beta \)`} <span
                        className="text-neutral-500">(衰退系数)</span></MathJax></Label>
                      <Input
                        type="number"
                        step=".2"
                        id="decayRate"
                        placeholder="Decay Rate"
                        value={beta}
                        onChange={handleDecayRateChange}
                        min={0}
                        max={4}/>
                    </div>
                  </div>
                  <div className="rounded border">
                    <CardHeader>
                      <CardTitle>Freshness Chart</CardTitle>
                      <CardDescription>
                        显示新鲜度和已创建时间之间的关系的曲线图
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig}>
                        <AreaChart
                          accessibilityLayer
                          data={chartDataFreshness}
                          className="mr-3"
                          margin={chartMargin}
                        >
                          <CartesianGrid vertical={false}/>
                          <XAxis
                            dataKey="days"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot"/>}
                          />
                          <Area
                            dataKey="hoursSinceCreation"
                            type="basis"
                            fill="var(--color-hoursSinceCreation)"
                            fillOpacity={0.4}
                            stroke="var(--color-hoursSinceCreation)"
                            stackId="a"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter>
                      <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                          {/*<div className="flex items-center gap-2 font-medium leading-none"> </div>*/}
                          <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            X-坐标是帖子创建或更新的天数
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="flex flex-col m-8 rounded border">
              <CardHeader>
                <CardTitle>遗忘率</CardTitle>
                <CardDescription>
                  基于上次推荐的时间得出的衰减因子，
                  以避免过于频繁地推荐相同的帖子。
                  <MathJax>
                    {String.raw`
                      \[
                        P_\mathtt{Forgetting} = 1 - \min(e^{-\gamma \times (x - \mathtt{delayDays})}, 1)
                      \]
                    `}
                  </MathJax>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row space-x-4">
                  <div className="flex flex-col min-w-32 w-32 space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \mathtt{delayDays} \)`} <span
                        className="text-neutral-500">(该天数后开始遗忘)</span></MathJax></Label>
                      <Input
                        type="number"
                        step="1"
                        id="delayDays"
                        placeholder="Delay Days"
                        value={delayDays}
                        onChange={handleDelayDaysChange}
                        min={0}
                        max={28}/>
                    </div>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label><MathJax>{String.raw`\( \gamma \)`} <span
                        className="text-neutral-500">(衰退系数)</span></MathJax></Label>
                      <Input
                        type="number"
                        step=".2"
                        id="gamma"
                        placeholder="Gamma"
                        value={gamma}
                        onChange={handleGammaChange}
                        min={0}
                        max={4}/>
                    </div>
                  </div>
                  <div className="rounded border">
                    <CardHeader>
                      <CardTitle>Forgetting Chart</CardTitle>
                      <CardDescription>
                        显示陈旧度和上次推荐时间之间关系的曲线图
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig}>
                        <AreaChart
                          accessibilityLayer
                          data={chartDataForgetting}
                          className="mr-3"
                          margin={chartMargin}
                        >
                          <CartesianGrid vertical={false}/>
                          <XAxis
                            dataKey="days"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot"/>}
                          />
                          <Area
                            dataKey="daysSinceLastRecommendation"
                            type="basis"
                            fill="var(--color-daysSinceLastRecommendation)"
                            fillOpacity={0.4}
                            stroke="var(--color-daysSinceLastRecommendation)"
                            stackId="a"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                    <CardFooter>
                      <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                          {/*<div className="flex items-center gap-2 font-medium leading-none"></div>*/}
                          <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            X-坐标是上次推荐距离当前的天数
                            遗忘率会随着时间的推移而增加。
                          </div>
                        </div>
                      </div>
                    </CardFooter>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </ScrollArea>

        <div className="flex-grow">
          <Tabs defaultValue="sorted" className="m-8 ml-0">
            <TabsList>
              <TabsTrigger value="sorted">整体排序</TabsTrigger>
              <TabsTrigger value="recommendation">模拟推荐</TabsTrigger>
            </TabsList>
            <TabsContent value="sorted" className="rounded border p-4">
              <SortedPosts data={data} scoreFn={scoreFn}/>
            </TabsContent>
            <TabsContent value="recommendation" className="rounded border p-4">
              <RecommendedPosts/>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MathJaxContext>
  );
}
