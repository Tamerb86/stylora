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
import { LayoutDashboard, LogOut, PanelLeft, Users, Calendar, Scissors, UserCog, Package, BarChart3, Settings as SettingsIcon, Bell, Gift, DollarSign, TrendingUp, Clock, ShoppingCart, Receipt, Search, RefreshCw, Plane, CalendarCheck, Database, Building2, CreditCard, History, ChevronDown, MessageCircle, Send, UserCheck, Mail } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OnboardingTour } from "./OnboardingTour";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Timebok", path: "/appointments" },
  { icon: UserCheck, label: "Walk-in Kø", path: "/walk-in-queue" },
  { icon: ShoppingCart, label: "Salgssted (POS)", path: "/pos" },
  { icon: Users, label: "Kunder", path: "/customers" },
  { icon: Scissors, label: "Tjenester", path: "/services" },
  { icon: UserCog, label: "Ansatte", path: "/employees" },
  { icon: Package, label: "Produkter", path: "/products", advancedOnly: true },
  { icon: Clock, label: "Timeregistrering", path: "/timeclock", submenu: [
    { icon: Clock, label: "Innstemplingsterminal", path: "/timeclock" },
    { icon: UserCog, label: "Administrer vakter", path: "/timeclock-admin", adminOnly: true },
    { icon: BarChart3, label: "Fremmøterapport", path: "/attendance" },
  ] },
  { icon: Bell, label: "Varsler", path: "/notifications", advancedOnly: true },
  { icon: Gift, label: "Lojalitet", path: "/loyalty", advancedOnly: true },
  { icon: MessageCircle, label: "Kommunikasjon", path: "/communications", advancedOnly: true, submenu: [
    { icon: MessageCircle, label: "Innstillinger", path: "/communications" },
    { icon: Send, label: "Masseutsendelse", path: "/bulk-messaging" },
    { icon: TrendingUp, label: "Kampanjeanalyse", path: "/campaign-analytics" },
    { icon: Mail, label: "E-postmaler", path: "/email-templates" },
  ] },
  { icon: Database, label: "Sikkerhetskopier", path: "/backups", adminOnly: true, advancedOnly: true },
  { icon: Building2, label: "Unimicro", path: "/unimicro", adminOnly: true, advancedOnly: true },
  { icon: CreditCard, label: "Betalingsterminaler", path: "/payment-providers", adminOnly: true, advancedOnly: true },
  { icon: SettingsIcon, label: "Innstillinger", path: "/settings" },
];

const paymentsMenuItems = [
  { icon: CreditCard, label: "Kasse (Betaling)", path: "/pos-payment", advancedOnly: true },
  { icon: Receipt, label: "Ordrehistorikk", path: "/orders", advancedOnly: true },
  { icon: History, label: "Betalingshistorikk", path: "/payment-history", advancedOnly: true },
  { icon: RefreshCw, label: "Refusjoner", path: "/refunds", advancedOnly: true },
  { icon: RefreshCw, label: "Refusjonsstyring", path: "/refund-management", advancedOnly: true },
];

const reportsMenuItems = [
  { icon: BarChart3, label: "Rapporter", path: "/reports", advancedOnly: true },
  { icon: DollarSign, label: "Økonomi", path: "/financial", advancedOnly: true },
  { icon: TrendingUp, label: "Analyse", path: "/analytics", advancedOnly: true },
  { icon: TrendingUp, label: "Avanserte rapporter", path: "/advanced-reports", advancedOnly: true },
  { icon: DollarSign, label: "POS Rapporter", path: "/pos-reports", advancedOnly: true },
];

const vacationMenuItems = [
  { icon: Plane, label: "Mine Ferier", path: "/my-leaves", advancedOnly: true },
  { icon: CalendarCheck, label: "Feriegodkjenninger", path: "/leave-approvals", adminOnly: true, advancedOnly: true },
  { icon: Calendar, label: "Helligdager", path: "/holidays", adminOnly: true, advancedOnly: true },
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
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
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
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth} breadcrumbs={breadcrumbs}>
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
  
  // Check email verification status
  const { data: tenant } = trpc.tenants.getCurrent.useQuery(undefined, {
    enabled: !!user?.tenantId,
  });
  
  // Redirect to verification page if email not verified
  useEffect(() => {
    if (tenant && !tenant.emailVerified && location !== '/email-verification-required') {
      setLocation('/email-verification-required');
    }
  }, [tenant, location, setLocation]);
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const { isSimpleMode, toggleMode } = useUIMode();
  const [isVacationExpanded, setIsVacationExpanded] = useState(true);
  const [isReportsExpanded, setIsReportsExpanded] = useState(true);
  const [isPaymentsExpanded, setIsPaymentsExpanded] = useState(true);

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
                    <img src="/stylora-logo.png" alt="Stylora Logo" className="h-8 w-8 shrink-0" />
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
            <SidebarMenu className="px-2 py-1">
              {menuItems
                .filter(item => {
                  // Filter out advanced-only items in simple mode
                  if (isSimpleMode && item.advancedOnly) return false;
                  // Filter out admin-only items for non-admins
                  if (item.adminOnly && user?.role !== "admin" && user?.role !== "owner") return false;
                  return true;
                })
                .map(item => {
                  const isActive = location === item.path;
                  // Add data-tour attributes for onboarding
                  const tourAttr = item.path === "/dashboard" ? "dashboard-link" :
                                   item.path === "/appointments" ? "appointments-link" :
                                   item.path === "/services" ? "services-link" :
                                   item.path === "/employees" ? "employees-link" :
                                   item.path === "/settings" ? "settings-link" : undefined;
                  
                  // Get badge count for this item
                  let badgeCount = 0;
                  if (item.path === "/appointments" && badgeCounts?.pendingAppointments) {
                    badgeCount = badgeCounts.pendingAppointments;
                  } else if (item.path === "/notifications" && badgeCounts?.unreadNotifications) {
                    badgeCount = badgeCounts.unreadNotifications;
                  }

                  return (
                    <SidebarMenuItem key={item.path}>
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
                            <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs font-semibold">
                              {badgeCount}
                            </Badge>
                          )}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              
              {/* Payments Group Label (Advanced Mode Only) */}
              {!isSimpleMode && (
                <>
                  <button
                    onClick={() => setIsPaymentsExpanded(!isPaymentsExpanded)}
                    className="w-full px-2 py-2 text-xs font-semibold text-muted-foreground/70 mt-2 flex items-center justify-between hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">💰 Betalinger</span>
                    <ChevronDown 
                      className={`h-3 w-3 transition-transform duration-200 ${isPaymentsExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  
                  {/* Payments Menu Items */}
                  {isPaymentsExpanded && paymentsMenuItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
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
                    <span className="flex items-center gap-1.5">📊 Rapporter</span>
                    <ChevronDown 
                      className={`h-3 w-3 transition-transform duration-200 ${isReportsExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  
                  {/* Reports Menu Items */}
                  {isReportsExpanded && reportsMenuItems
                    .filter(item => {
                      // Filter out advanced-only items in simple mode
                      if (item.advancedOnly && isSimpleMode) return false;
                      return true;
                    })
                    .map(item => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-9 transition-all font-normal"
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
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
                    <span className="flex items-center gap-1.5">✈️ Ferie & Fridager</span>
                    <ChevronDown 
                      className={`h-3 w-3 transition-transform duration-200 ${isVacationExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                  
                  {/* Vacation Menu Items */}
                  {isVacationExpanded && vacationMenuItems
                    .filter(item => {
                      // Filter out admin-only items for non-admins
                      if (item.adminOnly && user?.role !== "admin" && user?.role !== "owner") return false;
                      return true;
                    })
                    .map(item => {
                      const isActive = location === item.path;
                      
                      // Get badge count for leave approvals
                      let badgeCount = 0;
                      if (item.path === "/leave-approvals" && badgeCounts?.pendingLeaveApprovals) {
                        badgeCount = badgeCounts.pendingLeaveApprovals;
                      }

                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-9 transition-all font-normal"
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                            <span className="flex items-center gap-2 flex-1">
                              {item.label}
                              {badgeCount > 0 && (
                                <Badge variant="default" className="ml-auto h-5 px-1.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600">
                                  {badgeCount}
                                </Badge>
                              )}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-3">
            {/* UI Mode Toggle */}
            <div data-tour="ui-mode-toggle" className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-accent/50 group-data-[collapsible=icon]:hidden">
              <Label htmlFor="ui-mode" className="text-xs font-medium cursor-pointer">
                {isSimpleMode ? "Enkel modus" : "Avansert modus"}
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
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
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
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="h-9 w-9"
            >
              <Search className="h-4 w-4" />
            </Button>
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
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
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
