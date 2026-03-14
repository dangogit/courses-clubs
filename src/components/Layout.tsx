'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Users, BookOpen, Video, Calendar, Trophy, UserPlus, HelpCircle,
  Search, Bell, MessageCircle, Sparkles, Bot,
  Settings, LogOut, User, Crown, Moon, Sun, MessageSquareText, ChevronDown, Shield, Zap,
} from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { initialRecordings } from "@/data/recordings";
import { groups } from "@/data/groups";
import { agents } from "@/data/agents";
import { videoTutorials, writtenGuides } from "@/data/tutorials";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, SidebarInset,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { club } from "@/config/club";

/* ───────── Data ───────── */

interface NavItem {
  label: string;
  icon: React.FC<{ className?: string }>;
  path: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "ראשי",
    items: [
      { label: "בית - הקהילה", icon: Sparkles, path: "/community" },
    ],
  },
  {
    title: "תוכן",
    items: [
      { label: "לו״ז חודשי", icon: Calendar, path: "/events" },
      { label: "הקלטות מפגשי הלייב", icon: Video, path: "/recordings" },
      { label: "קורסים מלאים", icon: BookOpen, path: "/courses" },
      { label: "הדרכות קצרות", icon: Zap, path: "/tutorials" },
    ],
  },
  {
    title: "מועדון",
    items: [
      { label: "קבוצות", icon: Users, path: "/groups", badge: "5" },
      { label: "סוכני AI", icon: Bot, path: "/ai-agents" },
      { label: "היכל התהילה", icon: Trophy, path: "/leaderboard" },
      { label: "הזמנת חברים", icon: UserPlus, path: "/invite" },
    ],
  },
];

const standaloneLinks: NavItem[] = [
  { label: "ברוכים הבאים", icon: Home, path: "/onboarding" },
  { label: "צור קשר", icon: HelpCircle, path: "/contact" },
];

const notifications = [
  { id: 1, text: "משה הגיב על הפוסט שלך", time: "לפני 5 דקות", read: false },
  { id: 2, text: "קורס חדש זמין: AI למתקדמים", time: "לפני שעה", read: false },
  { id: 3, text: "הרמה שלך עלתה!", time: "לפני 3 שעות", read: false },
];

const unreadMessages = [
  { id: 1, name: "רותי דניס", lastMsg: "היי, ראית את ההקלטה החדשה?", time: "עכשיו", avatar: "ruti", unread: 2 },
  { id: 3, name: "גבי דניאל", lastMsg: "מתי יוצא הקורס הבא?", time: "לפני 20 דק׳", avatar: "gabi", unread: 1 },
];

interface LayoutProps {
  children: React.ReactNode;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   App Sidebar — glassmorphism, RTL, collapsible icons
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      dir="rtl"
      className="border-l border-border/40"
    >
      {/* ── Sidebar Header — logo row, height-matched with page header ── */}
      <SidebarHeader className="h-16 flex items-center px-3 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center border-b border-sidebar-border/60">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" className="flex items-center justify-center" />}
              tooltip={club.name}
            >
              <img
                src={club.logo}
                alt={club.name}
                className="size-32 object-contain shrink-0 transition-all duration-200"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="pt-2 scrollbar-thin">
        {navGroups.map((group) => (
          <SidebarGroup key={group.title} className="px-2 py-0 group-data-[collapsible=icon]:px-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-0.5">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const active = pathname === item.path || pathname.startsWith(item.path + "/");
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        render={<Link href={item.path} />}
                        isActive={active}
                        tooltip={item.label}
                        className="rounded-xl h-9 cursor-pointer transition-all duration-200 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm data-[active=true]:shadow-primary/20 hover:bg-sidebar-accent/60"
                      >
                        <item.icon className="!h-[18px] !w-[18px]" />
                        <span className="font-medium text-[13px]">{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge className="text-[10px] font-semibold">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarSeparator className="my-2 opacity-50" />

        {/* Standalone links */}
        <SidebarGroup className="px-2 py-0 group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {standaloneLinks.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    render={<Link href={item.path} />}
                    isActive={pathname === item.path}
                    tooltip={item.label}
                    className="rounded-xl h-9 cursor-pointer transition-all duration-200 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/60"
                  >
                    <item.icon className="!h-[18px] !w-[18px]" />
                    <span className="font-medium text-[13px]">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-50" />

        {/* Admin link */}
        <SidebarGroup className="px-2 py-0 group-data-[collapsible=icon]:px-0">
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/admin" />}
                  isActive={pathname === "/admin"}
                  tooltip="פאנל ניהול"
                  className="rounded-xl h-9 cursor-pointer transition-all duration-200 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent/60"
                >
                  <Shield className="!h-[18px] !w-[18px]" />
                  <span className="font-medium text-[13px]">פאנל ניהול</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer — premium card ── */}
      <SidebarFooter className="p-2.5 group-data-[collapsible=icon]:px-0">
        {/* Expanded view */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-purple-500/6 to-primary/4 p-3.5 border border-primary/10 group-data-[collapsible=icon]:hidden transition-all duration-200">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center shrink-0">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold block">חבר פרימיום</span>
              <span className="text-[10px] text-muted-foreground">750 / 1,000 XP</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
            <div className="h-full w-3/4 rounded-full gradient-primary transition-all duration-500" />
          </div>
        </div>
        {/* Collapsed icon fallback */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center py-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center">
            <Crown className="h-4 w-4 text-primary" />
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Page Header — glassmorphism, connected to sidebar
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ── Search results helper ── */
interface SearchResult {
  label: string;
  href: string;
  category: string;
}

function useSearch(query: string): SearchResult[] {
  const { data: courses = [] } = useCourses();

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];

    courses.forEach((c) => {
      if (c.title.toLowerCase().includes(q)) results.push({ label: c.title, href: `/courses/${c.id}`, category: "קורסים" });
    });
    initialRecordings.forEach((r, i) => {
      if (r.title.toLowerCase().includes(q)) results.push({ label: r.title, href: `/recordings/${i}`, category: "הקלטות" });
    });
    groups.forEach((g) => {
      if (g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
        results.push({ label: g.name, href: `/groups/${g.id}`, category: "קבוצות" });
    });
    agents.forEach((a) => {
      if (a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q))
        results.push({ label: a.name, href: `/ai-agents/${a.id}`, category: "כלי AI" });
    });
    videoTutorials.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) results.push({ label: t.title, href: `/tutorials/video/${t.id}`, category: "הדרכות" });
    });
    writtenGuides.forEach((g) => {
      if (g.title.toLowerCase().includes(q)) results.push({ label: g.title, href: `/tutorials/guide/${g.id}`, category: "הדרכות" });
    });

    return results.slice(0, 12);
  }, [query, courses]);
}

function SearchDropdown({ query, onSelect }: { query: string; onSelect: () => void }) {
  const results = useSearch(query);
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return map;
  }, [results]);

  if (query.trim().length < 2) return null;
  if (results.length === 0) {
    return (
      <div className="absolute top-full mt-1 w-full bg-popover border border-border/50 rounded-xl shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
        לא נמצאו תוצאות
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-1 w-full bg-popover border border-border/50 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto scrollbar-thin">
      {Array.from(grouped.entries()).map(([cat, items]) => (
        <div key={cat}>
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-muted/30">{cat}</div>
          {items.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              onClick={onSelect}
              className="block px-3 py-2 text-sm hover:bg-accent/40 transition-colors cursor-pointer truncate"
            >
              {r.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function AppHeader() {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const closeSearch = useCallback(() => {
    setSearchFocused(false);
    setSearchQuery("");
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 flex shrink-0 items-center header-glass border-b border-border/40">
        <div className="flex items-center gap-3 w-full px-4 lg:px-5">
          {/* ── Right group: Trigger + Search ── */}
          <SidebarTrigger className="-mr-1 h-9 w-9 rounded-lg hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer" />
          <Separator orientation="vertical" className="ml-2 !h-6 bg-border/60" />

          {/* ── Logo — mobile only ── */}
          <Link href="/" className="flex items-center md:hidden mr-1">
            <img src={club.logo} alt={club.name} className="h-8" />
          </Link>

          {/* ── Search — desktop ── */}
          <div className="max-w-sm hidden md:block relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="חפש במועדון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                className="pr-10 w-64 lg:w-80 bg-secondary/40 border-border/30 h-10 rounded-xl text-sm placeholder:text-muted-foreground/50 hover:bg-secondary/60 focus:bg-secondary/70 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
              />
            </div>
            {searchFocused && <SearchDropdown query={searchQuery} onSelect={closeSearch} />}
          </div>

          {/* ── Spacer — pushes action buttons to the left (in RTL) ── */}
          <div className="flex-1" />

          {/* ── Left group: Actions ── */}
          <div className="flex items-center gap-1.5">
            {/* WhatsApp — desktop pill */}
            <a
              href="https://chat.whatsapp.com/BrainAIClub"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-emerald-600 bg-emerald-500/8 border border-emerald-500/15 hover:bg-emerald-500/15 hover:border-emerald-500/25 transition-all duration-200 cursor-pointer"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              <span>קבוצת WhatsApp</span>
            </a>

            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 md:hidden cursor-pointer"
              aria-label="חיפוש"
            >
              <Search className="h-[18px] w-[18px] text-muted-foreground" />
            </button>

            <Separator orientation="vertical" className="mx-1 !h-6 bg-border/40 hidden sm:block" />

            {/* Notifications */}
            <Popover>
              <PopoverTrigger
                render={<button aria-label="התראות" />}
                className="relative p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
              >
                <Bell className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full gradient-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                  3
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-lg border-border/50" align="end" sideOffset={8}>
                <div className="p-3.5 border-b border-border/50">
                  <h3 className="font-bold text-sm">התראות</h3>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 p-3.5 hover:bg-accent/30 transition-colors duration-150 cursor-pointer border-b border-border/30 last:border-0">
                      <div className="h-2 w-2 rounded-full gradient-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm leading-relaxed">{n.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 border-t border-border/50">
                  <button className="w-full text-center text-xs text-primary font-medium hover:text-primary/80 py-1 cursor-pointer transition-colors duration-150">צפה בכל ההתראות</button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Messages */}
            <Popover>
              <PopoverTrigger
                render={<button aria-label="הודעות" />}
                className="relative p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
              >
                <MessageCircle className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full gradient-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                  {unreadMessages.length}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-2xl shadow-lg border-border/50" align="end" sideOffset={8} dir="rtl">
                <div className="p-3.5 border-b border-border/50">
                  <h3 className="font-bold text-sm">הודעות</h3>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {unreadMessages.map((m) => (
                    <Link
                      key={m.id}
                      href={`/chats?conv=${m.id}`}
                      className="flex items-center gap-3 p-3.5 hover:bg-accent/30 transition-colors duration-150 border-b border-border/30 last:border-0"
                    >
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/30">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.avatar}`} />
                        <AvatarFallback className="text-xs">{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{m.lastMsg}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground/60">{m.time}</span>
                        <span className="h-4 min-w-4 px-1 rounded-full gradient-primary text-[9px] text-primary-foreground flex items-center justify-center font-bold">
                          {m.unread}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="p-2.5 border-t border-border/50">
                  <Link href="/chats" className="block w-full text-center text-xs text-primary font-medium hover:text-primary/80 py-1 transition-colors duration-150">
                    צפה בכל הצ׳אטים
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="mx-1 !h-6 bg-border/40 hidden sm:block" />

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button />}
                className="flex items-center gap-2.5 p-1.5 pl-3.5 rounded-full hover:bg-accent/40 transition-all duration-200 outline-none cursor-pointer group"
              >
                <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200 hidden sm:block">שלום, אורח</span>
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/15 group-hover:ring-primary/30 transition-all duration-200">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">אני</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl" sideOffset={8}>
                <DropdownMenuItem render={<Link href="/profile" />} className="flex items-center gap-2.5 cursor-pointer rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>הפרופיל שלי</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/chats" />} className="flex items-center gap-2.5 cursor-pointer rounded-lg">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span>צ׳אטים</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/subscription" />} className="flex items-center gap-2.5 cursor-pointer rounded-lg">
                  <Crown className="h-4 w-4 text-muted-foreground" />
                  <span>ניהול מנוי מועדון</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />} className="flex items-center gap-2.5 cursor-pointer rounded-lg">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>הגדרות</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2.5 cursor-pointer rounded-lg"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
                  <span>{theme === "dark" ? "מצב בהיר" : "מצב כהה"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive rounded-lg">
                  <LogOut className="h-4 w-4" />
                  <span>התנתקות</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Mobile search — expandable below header ── */}
      {mobileSearchOpen && (
        <div className="px-4 py-2.5 header-glass border-b border-border/40 md:hidden relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="חפש במועדון..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              className="pr-10 bg-secondary/40 border-border/30 h-9 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:bg-secondary/70 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
            />
          </div>
          <SearchDropdown query={searchQuery} onSelect={() => { closeSearch(); setMobileSearchOpen(false); }} />
        </div>
      )}
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Layout — generic app shell
   All page-specific layout (like community sidebars) lives in the page.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Close the mobile sidebar sheet whenever the route changes */
function CloseMobileSidebarOnNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return null;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <CloseMobileSidebarOnNav />
      <AppSidebar />
      <SidebarInset className="gradient-mesh flex min-h-screen flex-col min-w-0 overflow-x-hidden">
        <AppHeader />
        <main className="flex-1 flex flex-col w-full min-w-0 px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
