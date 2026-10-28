import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Users, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PartnerOfMonth, User } from "@shared/schema";

interface PartnerOfMonthData extends PartnerOfMonth {
  partner?: User;
}

export function PartnerOfMonthCard() {
  const { data: pom, isLoading } = useQuery<PartnerOfMonthData | null>({
    queryKey: ["/api/partner-of-month"],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-200 dark:bg-yellow-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-yellow-200 dark:bg-yellow-800 rounded w-32" />
              <div className="h-3 bg-yellow-200 dark:bg-yellow-800 rounded w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pom) {
    return null;
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800 overflow-visible">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
            Partner of the Month
          </CardTitle>
          <Badge variant="secondary" className="ml-auto bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200">
            {monthNames[(pom.month || 1) - 1]} {pom.year}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-yellow-400">
              <AvatarFallback className="bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-lg font-semibold">
                {pom.partner?.name ? getInitials(pom.partner.name) : "P"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
              <Star className="h-3 w-3 text-yellow-900" fill="currentColor" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate" data-testid="text-pom-name">
              {pom.partner?.name || "Top Partner"}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {pom.partner?.district}, {pom.partner?.state}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {pom.achievement}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{pom.customersCount || 0} Customers</span>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {((pom.totalCommission || 0) / 1000).toFixed(0)}K Earned
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
