'use client'

import React, { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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

function cartesianProduct(arr: number[][]) {
  const result: number[][] = [];

  function helper(arr: number[][], index: number, current: number[]) {
    if (index === arr.length) {
      result.push(current.slice());
      return;
    }
    for (const item of arr[index]) {
      current.push(item);
      helper(arr, index + 1, current);
      current.pop();
    }
  }

  helper(arr, 0, []);
  return result;
}

export default function Home() {
  const [weightPopularity, setWeightPopularity] = useState(5);
  const [alpha, setAlpha] = useState(0.5);
  const [chartDataPopularity, setChartDataPopularity] = useState([]);
  const [xsPopularity] = useState(range(0, 50, 10));

  const [weightFreshness, setWeightFreshness] = useState(5);
  const [freshDays, setFreshDays] = useState(7);
  const [decayRate, setDecayRate] = useState(0.8);
  const [chartDataFreshness, setChartDataFreshness] = useState([]);
  const [xsFreshness] = useState(range(0, 28, 1));

  const ratePopularity = useMemo(() => weightPopularity / (weightPopularity + weightFreshness), [weightPopularity, weightFreshness]);
  const rateFreshness = useMemo(() => weightFreshness / (weightPopularity + weightFreshness), [weightPopularity, weightFreshness]);

  const [gamma, setGamma] = useState(0.8);
  const [delayDays, setDelayDays] = useState(7);
  const [chartDataStaleness, setChartDataStaleness] = useState([]);
  const [xsStaleness] = useState(range(0, 28, 1));

  const allPosts = cartesianProduct([
    [0, 10, 20, 50],
    [0, 10, 20, 50],
    [2, 4, 8, 16],
    [-1, 2, 8, 16],
  ]).map(([likes, comments, daysPastCreation, daysPastLastRecommendation]) => {
    return {
      title: "",
      likes: likes,
      comments: comments,
      daysPastCreation: daysPastCreation,
      daysPastLastRecommendation: daysPastLastRecommendation,
    };
  });

  const scoreFn = useMemo(() => {
    function computeLikesScore(post: Post) {
      return alpha * (post.likes / 10);
    }

    function computeCommentsScore(post: Post) {
      return (1 - alpha) * (post.comments / 10);
    }

    function computeFreshnessScore(post: Post) {
      return 1 / (1 + Math.exp(decayRate * (post.daysPastCreation - freshDays)));
    }

    function computeStalenessScore(post: Post) {
      if (post.daysPastLastRecommendation < 0) {
        return 1.0;
      }
      return 1.0 - Math.min(Math.exp(-gamma * (post.daysPastLastRecommendation - delayDays)), 1.0);
    }

    return (post: Post) => {
      const pl = computeLikesScore(post);
      const pc = computeCommentsScore(post);
      const f = computeFreshnessScore(post);
      const s = computeStalenessScore(post);
      const score = (ratePopularity * pl + ratePopularity * pc + rateFreshness * f) * s;
      return {
        score: score,
        probabilityComponents: {
          likes: pl * ratePopularity * s,
          comments: pc * ratePopularity * s,
          daysPastCreation: f * rateFreshness * s,
          daysPastLastRecommendation: s,
        }
      }
    }
  }, [ratePopularity, rateFreshness, alpha, decayRate, freshDays, gamma, delayDays]);

  // Generate data for the popularity chart
  useEffect(() => {
    const chartDataPopularity = xsPopularity.map((x) => {
      return {
        count: x,
        likes: alpha * (x / 10),
        comments: (1 - alpha) * (x / 10),
      };
    });
    setChartDataPopularity(chartDataPopularity as never[]);
  }, [xsPopularity, alpha]);

  // Generate data for the freshness chart
  useEffect(() => {
    const chartDataFreshness = xsFreshness.map((x) => {
      return {
        days: x,
        daysPastCreation: 1 / (1 + Math.exp(decayRate * (x - freshDays))),
      };
    });
    setChartDataFreshness(chartDataFreshness as never[]);
  }, [xsFreshness, freshDays, decayRate]);

  // Generate data for the staleness chart
  useEffect(() => {
    const chartDataStaleness = xsStaleness.map((x) => {
      return {
        days: x,
        daysPastLastRecommendation: 1.0 - Math.min(Math.exp(-gamma * (x - delayDays)), 1.0),
      };
    });
    setChartDataStaleness(chartDataStaleness as never[]);
  }, [xsStaleness, gamma, delayDays]);

  function handleWeightPopularityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newWeightPopularity = parseFloat(e.target.value);
    if (!isNaN(newWeightPopularity) && newWeightPopularity >= 0 && newWeightPopularity <= 10) {
      setWeightPopularity(newWeightPopularity);
    }
  }

  function handleWeightFreshnessChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newWeightFreshness = parseFloat(e.target.value);
    if (!isNaN(newWeightFreshness) && newWeightFreshness >= 0 && newWeightFreshness <= 10) {
      setWeightFreshness(newWeightFreshness);
    }
  }

  function handleAlphaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newAlpha = parseFloat(e.target.value);
    if (!isNaN(newAlpha) && newAlpha >= 0 && newAlpha <= 1) {
      setAlpha(newAlpha);
    }
  }

  function handleFreshDaysChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFreshDays = parseInt(e.target.value);
    if (!isNaN(newFreshDays) && newFreshDays >= 0 && newFreshDays <= 28) {
      setFreshDays(newFreshDays);
    }
  }

  function handleDecayRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDecayRate = parseFloat(e.target.value);
    if (!isNaN(newDecayRate) && newDecayRate >= 0 && newDecayRate <= 28) {
      setDecayRate(newDecayRate);
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

  return (
    <div className="flex flex-row">
      <ScrollArea className="h-screen">
        <div className="flex flex-col w-[640px] min-w-[640px]">
          <div className="flex flex-col m-8 mb-0 rounded border">
            <CardHeader>
              <CardTitle>Popularity Score</CardTitle>
              <CardDescription>
                A score derived from the number of likes and comments a post has received.
                This indicates how engaging the post is.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row space-x-4">
                <div className="flex flex-col min-w-32 w-32 space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Weight <span
                      className="text-neutral-500">({(ratePopularity * 100).toFixed(1)}%)</span></Label>
                    <Input
                      type="number"
                      step="0.5"
                      id="weightPopularity"
                      placeholder="Weight"
                      value={weightPopularity}
                      onChange={handleWeightPopularityChange}
                      min={0}
                      max={10}/>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Alpha</Label>
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
                      A stacked area chart showing popularity components
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
                          type="natural"
                          fill="var(--color-comments)"
                          fillOpacity={0.4}
                          stroke="var(--color-comments)"
                          stackId="a"
                        />
                        <Area
                          dataKey="likes"
                          type="natural"
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
                        <div className="flex items-center gap-2 font-medium leading-none">
                          More likes or comments, more possible engagement
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                          January - June 2024
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
              <CardTitle>Freshness Score</CardTitle>
              <CardDescription>
                A score based on how recently the post was created or updated.
                This helps prioritize newer content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row space-x-4">
                <div className="flex flex-col min-w-32 w-32 space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Weight <span
                      className="text-neutral-500">({(rateFreshness * 100).toFixed(1)}%)</span></Label>
                    <Input
                      type="number"
                      step="0.5"
                      id="weightFreshness"
                      placeholder="Weight"
                      value={weightFreshness}
                      onChange={handleWeightFreshnessChange}
                      min={0}
                      max={10}/>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Fresh Days</Label>
                    <Input
                      type="number"
                      step="1"
                      id="freshDays"
                      placeholder="Fresh Days"
                      value={freshDays}
                      onChange={handleFreshDaysChange}
                      min={0}
                      max={28}/>
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Decay Rate</Label>
                    <Input
                      type="number"
                      step=".2"
                      id="decayRate"
                      placeholder="Decay Rate"
                      value={decayRate}
                      onChange={handleDecayRateChange}
                      min={0}
                      max={4}/>
                  </div>
                </div>
                <div className="rounded border">
                  <CardHeader>
                    <CardTitle>Freshness Chart</CardTitle>
                    <CardDescription>
                      A stacked area chart showing the relationship between the freshness and the passed time
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
                          dataKey="daysPastCreation"
                          type="natural"
                          fill="var(--color-daysPastCreation)"
                          fillOpacity={0.4}
                          stroke="var(--color-daysPastCreation)"
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full items-start gap-2 text-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                          More likes or comments, more possible engagement
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                          January - June 2024
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
              <CardTitle>Staleness Penalty</CardTitle>
              <CardDescription>
                A decaying factor based on the time since the last recommendation,
                to avoid recommending the same post too frequently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row space-x-4">
                <div className="flex flex-col min-w-32 w-32 space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Delay Days</Label>
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
                    <Label>Gamma</Label>
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
                    <CardTitle>Staleness Chart</CardTitle>
                    <CardDescription>
                      An area chart showing the relationship between staleness and the time since the last
                      recommendation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig}>
                      <AreaChart
                        accessibilityLayer
                        data={chartDataStaleness}
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
                          dataKey="daysPastLastRecommendation"
                          type="basis"
                          fill="var(--color-daysPastLastRecommendation)"
                          fillOpacity={0.4}
                          stroke="var(--color-daysPastLastRecommendation)"
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter>
                    <div className="flex w-full items-start gap-2 text-sm">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                          This penalizes posts that have been recommended recently.
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                          January - June 2024
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
        <Tabs defaultValue="account" className="m-8 ml-0">
          <TabsList>
            <TabsTrigger value="sorted">Sorted</TabsTrigger>
            <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
          </TabsList>
          <TabsContent value="sorted" className="rounded border p-4">
            <SortedPosts data={allPosts} scoreFn={scoreFn}/>
          </TabsContent>
          <TabsContent value="recommendation" className="rounded border p-4">
            <RecommendedPosts/>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
