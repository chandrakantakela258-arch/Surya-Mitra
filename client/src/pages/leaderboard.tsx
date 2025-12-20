import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as WouterLink } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Leaderboard, User } from "@shared/schema";

const badgeConfig: Record<string, { icon: any; color: string; label: string }> = {
  gold: { icon: Trophy, color: "text-yellow-500", label: "Gold" },
  silver: { icon: Medal, color: "text-gray-400", label: "Silver" },
  bronze: { icon: Medal, color: "text-orange-600", label: "Bronze" },
  rising_star: { icon: Star, color: "text-purple-500", label: "Rising Star" },
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("monthly");
  
  const { data: entries, isLoading } = useQuery<(Leaderboard & { partner?: User })[]>({
    queryKey: ["/api/leaderboard", { period }],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <WouterLink href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </WouterLink>
            <h1 className="text-xl font-bold">Partner Leaderboard</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Top Performing Partners</h2>
          <p className="text-muted-foreground">
            Compete with fellow partners and earn recognition for your achievements
          </p>
        </div>

        <Tabs value={period} onValueChange={setPeriod} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly" data-testid="tab-quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="yearly" data-testid="tab-yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.slice(0, 3).length > 0 && (
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                {entries.slice(0, 3).map((entry, index) => {
                  const badge = entry.badge ? badgeConfig[entry.badge] : null;
                  const BadgeIcon = badge?.icon || Trophy;
                  
                  return (
                    <Card
                      key={entry.id}
                      className={`text-center ${
                        index === 0
                          ? "md:order-2 ring-2 ring-yellow-400"
                          : index === 1
                          ? "md:order-1"
                          : "md:order-3"
                      }`}
                      data-testid={`card-top-${entry.rank}`}
                    >
                      <CardContent className="pt-6">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                          index === 0 ? "bg-yellow-100" : index === 1 ? "bg-gray-100" : "bg-orange-100"
                        }`}>
                          <BadgeIcon className={`w-8 h-8 ${badge?.color || "text-muted-foreground"}`} />
                        </div>
                        <p className="text-3xl font-bold mb-1">#{entry.rank}</p>
                        <p className="font-semibold">{entry.partner?.name || "Unknown"}</p>
                        <Badge variant="outline" className="mt-2">
                          {entry.partnerType.toUpperCase()}
                        </Badge>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground">{entry.totalInstallations}</p>
                            <p>Installations</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{entry.points}</p>
                            <p>Points</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {entries.slice(3).map((entry) => {
              const badge = entry.badge ? badgeConfig[entry.badge] : null;
              
              return (
                <Card key={entry.id} className="hover-elevate" data-testid={`card-rank-${entry.rank}`}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                      {entry.rank}
                    </div>
                    <Avatar>
                      <AvatarFallback>
                        {entry.partner?.name?.substring(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{entry.partner?.name || "Unknown"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {entry.partnerType.toUpperCase()}
                        </Badge>
                        {badge && (
                          <Badge className={`text-xs ${badge.color}`}>
                            {badge.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.points} pts</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {entry.totalInstallations}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {entry.totalCapacityKw} kW
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No leaderboard data available yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complete installations to appear on the leaderboard
            </p>
          </div>
        )}

        <Card className="mt-8 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              How Points are Calculated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline">+10</Badge>
                <span>Points per completed installation</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">+20</Badge>
                <span>Points per successful referral</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline">+5</Badge>
                <span>Points per kW capacity installed</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
