import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  Sun,
  LogOut,
  Building2,
  User,
  Calculator,
  Wallet,
  Package,
  ShoppingCart,
  UserCheck,
  MessageSquare,
  HelpCircle,
  Bell,
  TrendingUp,
  Target,
  Award,
  Zap,
  ChevronRight,
  Gift,
  Trophy,
  Wrench,
} from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { ChatbotAssistant } from "@/components/chatbot-assistant";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const adminMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Partner Management",
    items: [
      { title: "Partner Approvals", url: "/admin/partners", icon: UserCheck },
      { title: "All Customers", url: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
      { title: "Commission Payouts", url: "/admin/payouts", icon: Wallet },
      { title: "Site Expenses", url: "/admin/site-expenses", icon: FileText },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "User Feedback", url: "/admin/feedback", icon: MessageSquare },
      { title: "Vendor Approvals", url: "/admin/vendors", icon: Wrench },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
      { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
    ],
  },
];

const bdpMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/bdp/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Partner Network",
    items: [
      { title: "District Partners", url: "/bdp/partners", icon: Building2 },
      { title: "Add Partner", url: "/bdp/partners/new", icon: UserPlus, highlight: true },
      { title: "All Customers", url: "/bdp/customers", icon: Users },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Store", url: "/bdp/store", icon: ShoppingCart },
      { title: "Commission Wallet", url: "/bdp/wallet", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "My Profile", url: "/profile", icon: User },
      { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
    ],
  },
];

const ddpMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/ddp/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Customer Management",
    items: [
      { title: "Customers", url: "/ddp/customers", icon: Users },
      { title: "Add Customer", url: "/ddp/customers/new", icon: UserPlus, highlight: true },
      { title: "Applications", url: "/ddp/applications", icon: FileText },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Store", url: "/ddp/store", icon: ShoppingCart },
      { title: "Earnings", url: "/ddp/earnings", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "My Profile", url: "/profile", icon: User },
      { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
    ],
  },
];

const customerPartnerMenuSections: MenuSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/customer-partner/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Referrals",
    items: [
      { title: "My Referrals", url: "/customer-partner/referrals", icon: Users },
      { title: "Earnings", url: "/customer-partner/earnings", icon: Wallet },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "My Profile", url: "/customer-partner/profile", icon: User },
      { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
    ],
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Fetch notification count
  const { data: notificationData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch stats based on role
  const { data: stats } = useQuery<any>({
    queryKey: user?.role === "bdp" ? ["/api/bdp/stats"] : 
              user?.role === "customer_partner" ? ["/api/customer-partner/stats"] : 
              ["/api/ddp/stats"],
    enabled: !!user && user.role !== "admin",
  });

  const menuSections = user?.role === "admin" 
    ? adminMenuSections 
    : user?.role === "bdp" 
    ? bdpMenuSections 
    : user?.role === "customer_partner"
    ? customerPartnerMenuSections
    : ddpMenuSections;

  const unreadCount = notificationData?.count || 0;

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      logout();
      toast({ title: "Logged out successfully" });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Administrator";
      case "bdp": return "Business Development Partner";
      case "ddp": return "District Development Partner";
      case "customer_partner": return "Customer Partner";
      default: return "Partner";
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center group">
          <img 
            src={logoImage} 
            alt="Divyanshi Solar" 
            className="h-10 w-auto object-contain"
          />
        </Link>
      </SidebarHeader>

      {/* Quick Stats Banner */}
      {user?.role !== "admin" && stats && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">Quick Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {user?.role === "bdp" ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.totalPartners || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Partners</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.totalCustomers || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Customers</p>
                </div>
              </>
            ) : user?.role === "customer_partner" ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.totalReferrals || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.eligibleReferrals || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Eligible</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.totalCustomers || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.completedInstallations || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <SidebarContent className="mt-2">
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location === item.url || location.startsWith(item.url + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={item.highlight && !isActive ? "text-primary" : ""}
                      >
                        <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className={`w-4 h-4 ${item.highlight && !isActive ? "text-primary" : ""}`} />
                          <span className="font-medium">{item.title}</span>
                          {item.highlight && !isActive && (
                            <Zap className="w-3 h-3 ml-auto text-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Support Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/notifications" data-testid="link-notifications">
                    <Bell className="w-4 h-4" />
                    <span className="font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ChatbotAssistant
                  trigger={
                    <button 
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none ring-offset-background transition-colors hover-elevate focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="button-help-assistant"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span className="font-medium">Help Assistant</span>
                    </button>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {/* User Profile Card */}
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" data-testid="text-user-name">
                {user?.name || "User"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleBadge role={user?.role || "ddp"} />
              </div>
              {user?.state && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  {user.district ? `${user.district}, ` : ""}{user.state}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5">
          {user?.role !== "admin" && (
            <FeedbackDialog
              trigger={
                <Button variant="outline" size="sm" className="w-full justify-start" data-testid="button-open-feedback">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Feedback
                </Button>
              }
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
