import { useLocation, Link } from "wouter";
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
  Shield,
} from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Partners", url: "/admin/partners", icon: Building2 },
  { title: "All Customers", url: "/admin/customers", icon: Users },
  { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
];

const bdpMenuItems = [
  { title: "Dashboard", url: "/bdp/dashboard", icon: LayoutDashboard },
  { title: "District Partners", url: "/bdp/partners", icon: Building2 },
  { title: "Add Partner", url: "/bdp/partners/new", icon: UserPlus },
  { title: "All Customers", url: "/bdp/customers", icon: Users },
  { title: "Commission Wallet", url: "/bdp/wallet", icon: Wallet },
  { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
];

const ddpMenuItems = [
  { title: "Dashboard", url: "/ddp/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/ddp/customers", icon: Users },
  { title: "Add Customer", url: "/ddp/customers/new", icon: UserPlus },
  { title: "Applications", url: "/ddp/applications", icon: FileText },
  { title: "Earnings", url: "/ddp/earnings", icon: Wallet },
  { title: "Subsidy Calculator", url: "/calculator", icon: Calculator },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const menuItems = user?.role === "admin" 
    ? adminMenuItems 
    : user?.role === "bdp" 
    ? bdpMenuItems 
    : ddpMenuItems;

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

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg">DivyanshiSolar</span>
            <span className="text-xs text-muted-foreground">Solar Partner Portal</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.name || "User"}
            </p>
            <div className="flex items-center gap-2">
              <RoleBadge role={user?.role || "ddp"} />
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
