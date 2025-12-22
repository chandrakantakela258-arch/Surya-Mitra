import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ShoppingCart,
  UserPlus,
  FileText,
  User,
  GitBranch,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

const ddpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/ddp/dashboard" },
  { icon: Users, label: "Customers", href: "/ddp/customers" },
  { icon: UserPlus, label: "Add", href: "/ddp/customers/new" },
  { icon: Wallet, label: "Earnings", href: "/ddp/earnings" },
  { icon: ShoppingCart, label: "Store", href: "/ddp/store" },
];

const bdpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/bdp/dashboard" },
  { icon: Users, label: "Partners", href: "/bdp/partners" },
  { icon: Wallet, label: "Wallet", href: "/bdp/wallet" },
  { icon: ShoppingCart, label: "Store", href: "/bdp/store" },
  { icon: User, label: "Profile", href: "/profile" },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/admin/dashboard" },
  { icon: Users, label: "Partners", href: "/admin/partners" },
  { icon: FileText, label: "Journey", href: "/admin/customer-journey" },
  { icon: Receipt, label: "Expenses", href: "/admin/site-expenses" },
  { icon: GitBranch, label: "Hierarchy", href: "/admin/partner-hierarchy" },
];

const customerPartnerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/customer-partner/dashboard" },
  { icon: UserPlus, label: "Refer", href: "/customer-registration" },
  { icon: Users, label: "Referrals", href: "/customer-partner/referrals" },
  { icon: Wallet, label: "Earnings", href: "/customer-partner/earnings" },
  { icon: User, label: "Profile", href: "/customer-partner/profile" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = user.role === "admin" 
    ? adminNavItems 
    : user.role === "bdp" 
      ? bdpNavItems 
      : user.role === "customer_partner"
        ? customerPartnerNavItems
        : ddpNavItems;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden safe-area-bottom"
      data-testid="nav-mobile-bottom"
    >
      <div className="flex items-center justify-evenly h-16 w-full px-1">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center min-w-[52px] flex-1 h-full gap-0.5 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium truncate max-w-[52px]">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
