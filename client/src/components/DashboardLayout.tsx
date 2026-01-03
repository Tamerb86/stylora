import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  Calendar,
  Scissors,
  UserCog,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  Gift,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingCart,
  Receipt,
  Search,
  RefreshCw,
  Plane,
  CalendarCheck,
  Database,
  Building2,
  CreditCard,
  History,
  ChevronDown,
  MessageCircle,
  Send,
  UserCheck,
  Mail,
  Shield,
  Wallet,
  FileText,
  Settings,
  X,
  Activity,
  Moon,
  Sun,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { useUIMode } from "@/contexts/UIModeContext";
import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OnboardingTour } from "./OnboardingTour";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Menu items factory functions
const getMenuItems = (t: (key: string) => string) => [
  {
    icon: LayoutDashboard,
    label: t("nav.dashboard"),
    path: "/dashboard",
    tooltip: t("nav.tooltip.dashboard"),
  },
  {
    icon: Calendar,
    label: t("nav.timebook"),
    path: "/appointments",
    tooltip: t("nav.tooltip.timebook"),
  },
  {
    icon: UserCheck,
    label: t("nav.walkInQueue"),
    path: "/walk-in-queue",
    tooltip: t("nav.tooltip.walkInQueue"),
  },
  {
    icon: ShoppingCart,
    label: t("nav.pos"),
    path: "/pos",
    tooltip: t("nav.tooltip.pos"),
  },
  {
    icon: Users,
    label: t("nav.customers"),
    path: "/customers",
    tooltip: t("nav.tooltip.customers"),
  },
  {
    icon: Scissors,
    label: t("nav.services"),
    path: "/services",
    tooltip: t("nav.tooltip.services"),
  },
  {
    icon: UserCog,
    label: t("nav.employees"),
    path: "/employees",
    tooltip: t("nav.tooltip.employees"),
  },
  {
    icon: Package,
    label: t("nav.products"),
    path: "/products",
    advancedOnly: true,
    tooltip: t("nav.tooltip.products"),
  },
  {
    icon: Clock,
    label: t("nav.timeRegistration"),
    path: "/timeclock",
    tooltip: t("nav.tooltip.clockInTerminal"),
    submenu: [
      {
        icon: Clock,
        label: t("nav.clockInTerminal"),
        path: "/timeclock",
        tooltip: t("nav.tooltip.clockInTerminal"),
      },
      {
        icon: UserCog,
        label: t("nav.manageShifts"),
        path: "/timeclock-admin",
        adminOnly: true,
        tooltip: t("nav.tooltip.manageShifts"),
      },
      {
        icon: BarChart3,
        label: t("nav.hoursReport"),
        path: "/work-hours-report",
        adminOnly: true,
        tooltip: t("nav.tooltip.hoursReport"),
      },
    ],
  },
  {
    icon: Gift,
    label: t("nav.loyalty"),
    path: "/loyalty",
    advancedOnly: true,
    tooltip: t("nav.tooltip.loyalty"),
  },
  {
    icon: MessageCircle,
    label: t("nav.communication"),
    path: "/communications",
    advancedOnly: true,
    tooltip: t("nav.tooltip.communicationSettings"),
    submenu: [
      {
        icon: MessageCircle,
        label: t("nav.communicationSettings"),
        path: "/communications",
        tooltip: t("nav.tooltip.communicationSettings"),
      },
      {
        icon: Send,
        label: t("nav.bulkMessaging"),
        path: "/bulk-messaging",
        tooltip: t("nav.tooltip.bulkMessaging"),
      },
      {
        icon: TrendingUp,
        label: t("nav.campaignAnalytics"),
        path: "/campaign-analytics",
        tooltip: t("nav.tooltip.campaignAnalytics"),
      },
      {
        icon: Mail,
        label: t("nav.emailTemplates"),
        path: "/email-templates",
        tooltip: t("nav.tooltip.emailTemplates"),
      },
    ],
  },
  {
    icon: Bell,
    label: t("nav.notifications"),
    path: "/notifications",
    advancedOnly: true,
    tooltip: t("nav.tooltip.notifications"),
  },
];

// Settings & Configuration - Grouped together
const getSettingsMenuItems = (t: (key: string) => string) => [
  {
    icon: SettingsIcon,
    label: t("nav.settings"),
    path: "/settings",
    tooltip: t("nav.tooltip.settings"),
  },
  {
    icon: CreditCard,
    label: t("nav.paymentTerminals"),
    path: "/payment-providers",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.paymentTerminals"),
  },
  {
    icon: CreditCard,
    label: t("nav.izettle"),
    path: "/izettle",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.izettle"),
  },
  {
    icon: Building2,
    label: t("nav.accounting"),
    path: "/accounting",
    adminOnly: true,
    tooltip: t("nav.tooltip.allIntegrations"),
    submenu: [
      {
        icon: Building2,
        label: t("nav.allIntegrations"),
        path: "/accounting",
        tooltip: t("nav.tooltip.allIntegrations"),
      },
      {
        icon: Building2,
        label: t("nav.accountantExport"),
        path: "/accountant-export",
        tooltip: t("nav.tooltip.accountantExport"),
      },
      {
        icon: Building2,
        label: t("nav.unimicro"),
        path: "/unimicro",
        tooltip: t("nav.tooltip.unimicro"),
      },
      {
        icon: Building2,
        label: t("nav.fiken"),
        path: "/fiken",
        tooltip: t("nav.tooltip.fiken"),
      },
    ],
  },
  {
    icon: Database,
    label: t("nav.backups"),
    path: "/backups",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.backups"),
  },
  {
    icon: FileText,
    label: t("nav.importData"),
    path: "/import",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.importData"),
  },
  {
    icon: Activity,
    label: t("nav.systemMonitoring"),
    path: "/monitoring",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.systemMonitoring"),
  },
];

const getPaymentsMenuItems = (t: (key: string) => string) => [
  {
    icon: CreditCard,
    label: t("nav.posPayment"),
    path: "/pos-payment",
    advancedOnly: true,
    tooltip: t("nav.tooltip.posPayment"),
  },
  {
    icon: Receipt,
    label: t("nav.orderHistory"),
    path: "/orders",
    advancedOnly: true,
    tooltip: t("nav.tooltip.orderHistory"),
  },
  {
    icon: History,
    label: t("nav.paymentHistory"),
    path: "/payment-history",
    advancedOnly: true,
    tooltip: t("nav.tooltip.paymentHistory"),
  },
  {
    icon: RefreshCw,
    label: t("nav.refunds"),
    path: "/refunds",
    advancedOnly: true,
    tooltip: t("nav.tooltip.refunds"),
  },
  {
    icon: RefreshCw,
    label: t("nav.refundManagement"),
    path: "/refund-management",
    advancedOnly: true,
    tooltip: t("nav.tooltip.refundManagement"),
  },
];

const getReportsMenuItems = (t: (key: string) => string) => [
  {
    icon: BarChart3,
    label: t("nav.reports"),
    path: "/reports",
    advancedOnly: true,
    tooltip: t("nav.tooltip.reports"),
  },
  {
    icon: BarChart3,
    label: t("nav.attendanceReport"),
    path: "/attendance",
    advancedOnly: true,
    tooltip: t("nav.tooltip.attendanceReport"),
  },
  {
    icon: DollarSign,
    label: t("nav.financial"),
    path: "/financial",
    advancedOnly: true,
    tooltip: t("nav.tooltip.financial"),
  },
  {
    icon: TrendingUp,
    label: t("nav.analytics"),
    path: "/analytics",
    advancedOnly: true,
    tooltip: t("nav.tooltip.analytics"),
  },
  {
    icon: TrendingUp,
    label: t("nav.advancedReports"),
    path: "/advanced-reports",
    advancedOnly: true,
    tooltip: t("nav.tooltip.advancedReports"),
  },
  {
    icon: DollarSign,
    label: t("nav.posReports"),
    path: "/pos-reports",
    advancedOnly: true,
    tooltip: t("nav.tooltip.posReports"),
  },
];

const getVacationMenuItems = (t: (key: string) => string) => [
  {
    icon: Plane,
    label: t("nav.myLeaves"),
    path: "/my-leaves",
    advancedOnly: true,
    tooltip: t("nav.tooltip.myLeaves"),
  },
  {
    icon: CalendarCheck,
    label: t("nav.leaveApprovals"),
    path: "/leave-approvals",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.leaveApprovals"),
  },
  {
    icon: Calendar,
    label: t("nav.salonHolidays"),
    path: "/holidays",
    adminOnly: true,
    advancedOnly: true,
    tooltip: t("nav.tooltip.salonHolidays"),
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function DashboardLayout({
  children,
  breadcrumbs,
}: {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { isSimpleMode, toggleMode } = useUIMode();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Logg inn for å fortsette
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Tilgang til dashboardet krever innlogging. Klikk nedenfor for å
              logge inn.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Logg inn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={user.sidebarOpen ?? false}
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent
        setSidebarWidth={setSidebarWidth}
        breadcrumbs={breadcrumbs}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  breadcrumbs?: BreadcrumbItem[];
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  breadcrumbs,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { i18n, t } = useTranslation();
  
  // Determine sidebar side based on language direction
  const sidebarSide = i18n.language === 'ar' ? 'right' : 'left';
  
  // Get menu items with translations
  const menuItems = getMenuItems(t);
  const settingsMenuItems = getSettingsMenuItems(t);
  const paymentsMenuItems = getPaymentsMenuItems(t);
  const reportsMenuItems = getReportsMenuItems(t);
  const vacationMenuItems = getVacationMenuItems(t);

  // Check email verification status
  const { data: tenant } = trpc.tenants.getCurrent.useQuery(undefined, {
    enabled: !!user?.tenantId,
  });

  // Redirect to verification page if email not verified
  useEffect(() => {
    if (
      tenant &&
      !tenant.emailVerified &&
      location !== "/email-verification-required"
    ) {
      setLocation("/email-verification-required");
    }
  }, [tenant, location, setLocation]);
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const { isSimpleMode, toggleMode } = useUIMode();
  // Initialize expansion states from localStorage
  const [isVacationExpanded, setIsVacationExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-vacation-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isReportsExpanded, setIsReportsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-reports-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-payments-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebar-settings-expanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save expansion states to localStorage
  useEffect(() => {
    localStorage.setItem(
      "sidebar-vacation-expanded",
      JSON.stringify(isVacationExpanded)
    );
  }, [isVacationExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "sidebar-reports-expanded",
      JSON.stringify(isReportsExpanded)
    );
  }, [isReportsExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "sidebar-payments-expanded",
      JSON.stringify(isPaymentsExpanded)
    );
  }, [isPaymentsExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "sidebar-settings-expanded",
      JSON.stringify(isSettingsExpanded)
    );
  }, [isSettingsExpanded]);

  // Fetch badge counts
  const { data: badgeCounts } = trpc.dashboard.badgeCounts.useQuery(undefined, {
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Save sidebar state mutation
  const updateSidebarState = trpc.auth.updateSidebarState.useMutation();

  // Custom toggle that saves to database
  const handleToggleSidebar = () => {
    toggleSidebar();
    const newState = state === "collapsed" ? true : false;
    updateSidebarState.mutate({ sidebarOpen: newState });
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          side={sidebarSide}
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={handleToggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src="/stylora-logo.png"
                      alt="Stylora Logo"
                      className="h-8 w-8 shrink-0"
                    />
                    <span className="font-bold tracking-tight truncate bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                      Stylora
                    </span>
                  </div>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                    aria-label="Search"
                    title="Search (Ctrl+K)"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  aria-label="Search"
                  title="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Sidebar Search */}
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Søk i meny..."
                  value={sidebarSearchQuery}
                  onChange={e => setSidebarSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-8 text-sm"
                />
                {sidebarSearchQuery && (
                  <button
                    onClick={() => setSidebarSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <SidebarMenu className="px-2 py-1">
              {(() => {
                const filteredItems = menuItems.filter(item => {
                  // Filter out advanced-only items in simple mode
                  if (isSimpleMode && item.advancedOnly) return false;
                  // Filter out admin-only items for non-admins
                  if (
                    item.adminOnly &&
                    user?.role !== "admin" &&
                    user?.role !== "owner"
                  )
                    return false;
                  // Filter by search query
                  if (sidebarSearchQuery) {
                    const query = sidebarSearchQuery.toLowerCase();
                    return (
                      item.label.toLowerCase().includes(query) ||
                      (item.tooltip?.toLowerCase().includes(query) ?? false)
                    );
                  }
                  return true;
                });

                // Popular pages for empty state
                const popularPages = [
                  {
                    path: "/dashboard",
                    label: t("nav.dashboard"),
                    icon: LayoutDashboard,
                  },
                  { path: "/appointments", label: t("nav.timebook"), icon: Calendar },
                  { path: "/customers", label: t("nav.customers"), icon: Users },
                  {
                    path: "/pos",
                    label: t("nav.pos"),
                    icon: ShoppingCart,
                  },
                  { path: "/reports", label: t("nav.reports"), icon: BarChart3 },
                ];

                // Show empty state if searching and no results
                if (sidebarSearchQuery && filteredItems.length === 0) {
                  return (
                    <div className="px-2 py-4 space-y-4">
                      <div className="text-center text-sm text-muted-foreground">
                        <p className="font-medium">Ingen resultater funnet</p>
                        <p className="text-xs mt-1">Prøv et annet søkeord</p>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                          Populære sider
                        </p>
                        {popularPages.map(page => {
                          const isActive = location === page.path;
                          return (
                            <SidebarMenuItem key={page.path}>
                              <SidebarMenuButton
                                isActive={isActive}
                                onClick={() => {
                                  setLocation(page.path);
                                  setSidebarSearchQuery("");
                                }}
                                className="h-9 transition-all font-normal"
                              >
                                <page.icon
                                  className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                />
                                <span>{page.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return filteredItems.map(item => {
                  const isActive = location === item.path;
                  // Add data-tour attributes for onboarding
                  const tourAttr =
                    item.path === "/dashboard"
                      ? "dashboard-link"
                      : item.path === "/appointments"
                        ? "appointments-link"
                        : item.path === "/services"
                          ? "services-link"
                          : item.path === "/employees"
                            ? "employees-link"
                            : item.path === "/settings"
                              ? "settings-link"
                              : undefined;

                  // Get badge count for this item
                  let badgeCount = 0;
                  if (
                    item.path === "/appointments" &&
                    badgeCounts?.pendingAppointments
                  ) {
                    badgeCount = badgeCounts.pendingAppointments;
                  } else if (
                    item.path === "/notifications" &&
                    badgeCounts?.unreadNotifications
                  ) {
                    badgeCount = badgeCounts.unreadNotifications;
                  }

                  return (
                    <SidebarMenuItem key={item.path}>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              isActive={isActive}
                              onClick={() => setLocation(item.path)}
                              tooltip={item.label}
                              className={`h-9 transition-all font-normal`}
                              data-tour={tourAttr}
                            >
                              <item.icon
                                className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                              />
                              <span className="flex items-center gap-2 flex-1">
                                {item.label}
                                {badgeCount > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="ml-auto h-5 px-1.5 text-xs font-semibold"
                                  >
                                    {badgeCount}
                                  </Badge>
                                )}
                              </span>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {item.tooltip && (
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="text-sm">{item.tooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                });
              })()}

              {/* Payments Group Label (Advanced Mode Only) */}
              {!isSimpleMode && (
                <>
                  <button
                    onClick={() => setIsPaymentsExpanded(!isPaymentsExpanded)}
                    className="w-full px-2 py-2 text-xs font-semibold text-muted-foreground/70 mt-2 flex items-center justify-between hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5" />
                      Betalinger
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${isPaymentsExpanded ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {/* Payments Menu Items */}
                  {isPaymentsExpanded &&
                    paymentsMenuItems
                      .filter(item => {
                        if (sidebarSearchQuery) {
                          const query = sidebarSearchQuery.toLowerCase();
                          return (
                            item.label.toLowerCase().includes(query) ||
                            (item.tooltip?.toLowerCase().includes(query) ??
                              false)
                          );
                        }
                        return true;
                      })
                      .map(item => {
                        const isActive = location === item.path;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive}
                                    onClick={() => setLocation(item.path)}
                                    tooltip={item.label}
                                    className="h-9 transition-all font-normal"
                                  >
                                    <item.icon
                                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                    />
                                    <span>{item.label}</span>
                                  </SidebarMenuButton>
                                </TooltipTrigger>
                                {item.tooltip && (
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">{item.tooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuItem>
                        );
                      })}
                </>
              )}

              {/* Reports Group Label (Advanced Mode Only) */}
              {!isSimpleMode && (
                <>
                  <button
                    onClick={() => setIsReportsExpanded(!isReportsExpanded)}
                    className="w-full px-2 py-2 text-xs font-semibold text-muted-foreground/70 mt-2 flex items-center justify-between hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Rapporter
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${isReportsExpanded ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {/* Reports Menu Items */}
                  {isReportsExpanded &&
                    reportsMenuItems
                      .filter(item => {
                        // Filter out advanced-only items in simple mode
                        if (item.advancedOnly && isSimpleMode) return false;
                        // Filter by search query
                        if (sidebarSearchQuery) {
                          const query = sidebarSearchQuery.toLowerCase();
                          return (
                            item.label.toLowerCase().includes(query) ||
                            (item.tooltip?.toLowerCase().includes(query) ??
                              false)
                          );
                        }
                        return true;
                      })
                      .map(item => {
                        const isActive = location === item.path;
                        return (
                          <SidebarMenuItem key={item.path}>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive}
                                    onClick={() => setLocation(item.path)}
                                    tooltip={item.label}
                                    className="h-9 transition-all font-normal"
                                  >
                                    <item.icon
                                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                    />
                                    <span>{item.label}</span>
                                  </SidebarMenuButton>
                                </TooltipTrigger>
                                {item.tooltip && (
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">{item.tooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuItem>
                        );
                      })}
                </>
              )}

              {/* Settings Group Label (Advanced Mode Only) */}
              {!isSimpleMode && (
                <>
                  <button
                    onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                    className="w-full px-2 py-2 text-xs font-semibold text-muted-foreground/70 mt-2 flex items-center justify-between hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Innstillinger
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${isSettingsExpanded ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {/* Settings Menu Items */}
                  {isSettingsExpanded &&
                    settingsMenuItems
                      .filter(item => {
                        // Filter out admin-only items for non-admins
                        if (
                          item.adminOnly &&
                          user?.role !== "admin" &&
                          user?.role !== "owner"
                        )
                          return false;
                        // Filter by search query
                        if (sidebarSearchQuery) {
                          const query = sidebarSearchQuery.toLowerCase();
                          return (
                            item.label.toLowerCase().includes(query) ||
                            (item.tooltip?.toLowerCase().includes(query) ??
                              false)
                          );
                        }
                        return true;
                      })
                      .map(item => {
                        const isActive = location === item.path;
                        const tourAttr =
                          item.path === "/settings"
                            ? "settings-link"
                            : undefined;

                        return (
                          <SidebarMenuItem key={item.path}>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive}
                                    onClick={() => setLocation(item.path)}
                                    tooltip={item.label}
                                    className="h-9 transition-all font-normal"
                                    data-tour={tourAttr}
                                  >
                                    <item.icon
                                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                    />
                                    <span>{item.label}</span>
                                  </SidebarMenuButton>
                                </TooltipTrigger>
                                {item.tooltip && (
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">{item.tooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuItem>
                        );
                      })}
                </>
              )}

              {/* Vacation Group Label (Advanced Mode Only) */}
              {!isSimpleMode && (
                <>
                  <button
                    onClick={() => setIsVacationExpanded(!isVacationExpanded)}
                    className="w-full px-2 py-2 text-xs font-semibold text-muted-foreground/70 mt-2 flex items-center justify-between hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plane className="h-3.5 w-3.5" />
                      Ferie & Fridager
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${isVacationExpanded ? "rotate-0" : "-rotate-90"}`}
                    />
                  </button>

                  {/* Vacation Menu Items */}
                  {isVacationExpanded &&
                    vacationMenuItems
                      .filter(item => {
                        // Filter out admin-only items for non-admins
                        if (
                          item.adminOnly &&
                          user?.role !== "admin" &&
                          user?.role !== "owner"
                        )
                          return false;
                        // Filter by search query
                        if (sidebarSearchQuery) {
                          const query = sidebarSearchQuery.toLowerCase();
                          return (
                            item.label.toLowerCase().includes(query) ||
                            (item.tooltip?.toLowerCase().includes(query) ??
                              false)
                          );
                        }
                        return true;
                      })
                      .map(item => {
                        const isActive = location === item.path;

                        // Get badge count for leave approvals
                        let badgeCount = 0;
                        if (
                          item.path === "/leave-approvals" &&
                          badgeCounts?.pendingLeaveApprovals
                        ) {
                          badgeCount = badgeCounts.pendingLeaveApprovals;
                        }

                        return (
                          <SidebarMenuItem key={item.path}>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <SidebarMenuButton
                                    isActive={isActive}
                                    onClick={() => setLocation(item.path)}
                                    tooltip={item.label}
                                    className="h-9 transition-all font-normal"
                                  >
                                    <item.icon
                                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                                    />
                                    <span className="flex items-center gap-2 flex-1">
                                      {item.label}
                                      {badgeCount > 0 && (
                                        <Badge
                                          variant="default"
                                          className="ml-auto h-5 px-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600"
                                        >
                                          {badgeCount}
                                        </Badge>
                                      )}
                                    </span>
                                  </SidebarMenuButton>
                                </TooltipTrigger>
                                {item.tooltip && (
                                  <TooltipContent
                                    side="right"
                                    className="max-w-xs"
                                  >
                                    <p className="text-sm">{item.tooltip}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </SidebarMenuItem>
                        );
                      })}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-3">
            {/* Language Switcher */}
            <div className="group-data-[collapsible=icon]:hidden">
              <LanguageSwitcher />
            </div>

            {/* UI Mode Toggle */}
            <div
              data-tour="ui-mode-toggle"
              className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-accent/50 group-data-[collapsible=icon]:hidden"
            >
              <Label
                htmlFor="ui-mode"
                className="text-xs font-medium cursor-pointer"
              >
                {isSimpleMode ? t("common.simpleMode") : t("common.advancedMode")}
              </Label>
              <Switch
                id="ui-mode"
                checked={!isSimpleMode}
                onCheckedChange={toggleMode}
                className="scale-75"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.tenantId === "platform-admin-tenant" && (
                  <DropdownMenuItem
                    onClick={() => setLocation("/saas-admin")}
                    className="cursor-pointer"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>SaaS Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logg ut</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? t("common.menu")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={`crumb-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.href && index < breadcrumbs.length - 1 ? (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <EmailVerificationBanner />
          {children}
        </main>
        <Footer />
      </SidebarInset>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <OnboardingTour />
    </>
  );
}
