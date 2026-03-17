'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar as CalIcon, CalendarPlus, Check, Clock, MapPin, Timer, Sparkles, ChevronRight, ChevronLeft, User, Radio, Video, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge } from "@/components/TierBadge";
import { initialRecordings } from "@/data/recordings";
import { useAdmin } from "@/contexts/AdminContext";
import { useEvents, type EventWithRsvpCount } from "@/hooks/useEvents";
import { getDateStr, getTimeStr, formatDayShort, formatDateShort, useCountdown } from "@/lib/dateUtils";

const liveStyle = "bg-primary/10 text-primary border-primary/30";

const calendarEventStyle = { bg: "bg-primary/10 border-primary/20", text: "text-primary" };

const HEBREW_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
// RTL: Sunday=0 first col, Saturday=6 last col
const DAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

function getDaysGrid(year: number, month: number) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  // Use 5 rows (35 cells) if month fits, otherwise 6 rows (42)
  const totalCells = firstDay + daysInMonth <= 35 ? 35 : 42;

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrev - i), isCurrentMonth: false });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Padding to complete rows
  const remaining = totalCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}


function buildGoogleCalendarUrl(event: EventWithRsvpCount) {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 90 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE", text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`, details: event.description || "", location: "Zoom",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function CountdownBadge({ startsAt }: { startsAt: string }) {
  const timeLeft = useCountdown(startsAt);
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full shrink-0">
      <Timer className="h-3.5 w-3.5" /><span>{timeLeft}</span>
    </div>
  );
}

function LiveBadge({ startsAt, size = "md" }: { startsAt: string; size?: "sm" | "md" }) {
  const daysUntil = getDaysUntil(getDateStr(startsAt));
  const isSoon = daysUntil >= 0 && daysUntil <= 7;
  const textCls = size === "sm" ? "text-[9px] px-1.5 py-0" : "text-[10px] px-1.5 py-0";
  return (
    <Badge variant="outline" className={`${textCls} ${liveStyle} gap-1 items-center`}>
      {isSoon && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        </span>
      )}
      לייב
    </Badge>
  );
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────── MonthCalendar ───────────────────
function MonthCalendar({
  events,
  registeredEvents,
  onRegister,
}: {
  events: EventWithRsvpCount[];
  registeredEvents: Set<string>;
  onRegister: (ev: React.MouseEvent, eventId: string) => void;
}) {
  const router = useRouter();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = getDaysGrid(year, month);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Map events to their date strings
  const eventsByDate: Record<string, EventWithRsvpCount[]> = {};
  events.forEach((e) => {
    const dateKey = getDateStr(e.starts_at);
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(e);
  });

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
        <button
          onClick={prevMonth}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="חודש קודם"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h2 className="font-display font-bold text-base">
            {HEBREW_MONTHS[month]} {year}
          </h2>
        </div>
        <button
          onClick={nextMonth}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="חודש הבא"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>


      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border/40">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dateKey = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, "0")}-${String(cell.date.getDate()).padStart(2, "0")}`;
          const cellEvents = eventsByDate[dateKey] || [];
          const isToday = isSameDay(cell.date, today);
          const isCurrentMonth = cell.isCurrentMonth;
          const isLastRow = idx >= cells.length - 7;

          return (
            <div
              key={idx}
              className={`
                min-h-[90px] sm:min-h-[110px] border-b border-l border-border/30 p-1.5 sm:p-2
                ${!isLastRow ? "" : "border-b-0"}
                ${idx % 7 === 6 ? "border-l-0" : ""}
                ${cellEvents.length > 0 ? "hover:bg-secondary/20 transition-colors" : ""}
                ${!isCurrentMonth ? "bg-secondary/10" : ""}
              `}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span className={`
                  w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold
                  ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                  ${!isCurrentMonth ? "text-muted-foreground/40" : isToday ? "" : "text-foreground/70"}
                `}>
                  {cell.date.getDate()}
                </span>
              </div>

              {/* Events in cell */}
              <div className="space-y-0.5">
                {cellEvents.map((ev, ei) => {
                   const popoverKey = `${dateKey}-${ei}`;

                   return (
                     <Popover
                       key={ei}
                       open={openPopover === popoverKey}
                       onOpenChange={(open) => setOpenPopover(open ? popoverKey : null)}
                     >
                       <PopoverTrigger
                         render={<button onClick={(e: React.MouseEvent) => e.stopPropagation()} />}
                         className={`
                           w-full text-right rounded-md border-r-2 border-primary bg-primary/10
                           px-1.5 py-1 cursor-pointer transition-all
                           hover:bg-primary/20 active:scale-95 space-y-0.5
                         `}
                       >
                            {/* Row 1: time + avatar */}
                            <div className="flex items-center justify-between gap-1">
                              <Avatar className="h-4 w-4 shrink-0">
                                <AvatarImage src={ev.speaker_avatar_url ?? undefined} className="object-cover" />
                                <AvatarFallback className="text-[6px]"><User className="h-2 w-2" /></AvatarFallback>
                              </Avatar>
                              <span className="text-[9px] sm:text-[10px] font-bold text-primary leading-none">{getTimeStr(ev.starts_at)}</span>
                            </div>
                            {/* Row 2: title with line-clamp */}
                            <p className="text-[9px] sm:text-[10px] font-medium text-primary/80 leading-snug line-clamp-2 text-right">
                              {ev.title}
                            </p>
                       </PopoverTrigger>
                       <PopoverContent
                         className="w-72 p-0 overflow-hidden"
                         side="bottom"
                         align="center"
                       >
                         {/* Popover header stripe */}
                         <div className="h-1 w-full bg-primary" />
                        <div className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0 border border-border/50">
                              <AvatarImage src={ev.speaker_avatar_url ?? undefined} className="object-cover" />
                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-snug">{ev.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <LiveBadge startsAt={ev.starts_at} />
                                {ev.min_tier_level > 0 && <TierBadge tierLevel={ev.min_tier_level} size="sm" />}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>{formatDayShort(getDateStr(ev.starts_at))}, {formatDateShort(getDateStr(ev.starts_at))} · {getTimeStr(ev.starts_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>זום (קישור יישלח למנויים)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 shrink-0" />
                              <span>מנחה: <span className="font-medium text-foreground/80">{ev.speaker_name}</span></span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className={`flex-1 rounded-lg gap-1 text-xs font-bold ${registeredEvents.has(ev.id) ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
                              onClick={(e) => {
                                onRegister(e, ev.id);
                                setOpenPopover(null);
                              }}
                            >
                              {registeredEvents.has(ev.id) ? <><Check className="h-3 w-3" /> נרשמת!</> : <><Sparkles className="h-3 w-3" /> הרשמה</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 rounded-lg gap-1 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(buildGoogleCalendarUrl(ev), "_blank", "noopener,noreferrer");
                              }}
                            >
                              <CalendarPlus className="h-3 w-3" /> הוספה ליומן
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────── Live Room Tab ───────────────────
function LiveRoomTab({
  events,
  onSwitchToCalendar,
}: {
  events: EventWithRsvpCount[];
  onSwitchToCalendar: () => void;
}) {
  const { isAdmin } = useAdmin();
  const [isLiveActive, setIsLiveActive] = useState(false);
  const now = new Date();

  // current month events
  const monthEvents = events.filter((e) => {
    const d = new Date(e.starts_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const futureEvents = events.filter((e) => new Date(e.starts_at) >= now);
  const nextEvent = futureEvents[0];

  // recent recordings — last 3
  const recentRecordings = [...initialRecordings]
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 3);

  const liveEvent = isLiveActive ? (monthEvents.find((e) => {
    const d = new Date(e.starts_at);
    return Math.abs(d.getTime() - now.getTime()) < 3 * 60 * 60 * 1000;
  }) ?? monthEvents[0]) : null;

  return (
    <div className="space-y-5">
      {/* Dynamic Banner */}
      {isLiveActive ? (
        <div className="rounded-2xl overflow-hidden border border-destructive/40 bg-destructive/5 ring-1 ring-destructive/20">
          <div className="bg-destructive px-5 py-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive-foreground" />
            </span>
            <span className="text-destructive-foreground font-bold text-sm tracking-wide">שידור פעיל עכשיו</span>
          </div>
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {liveEvent && (
              <Avatar className="h-14 w-14 border-2 border-destructive/30 shrink-0">
                <AvatarImage src={liveEvent.speaker_avatar_url ?? undefined} className="object-cover" />
                <AvatarFallback>{liveEvent.speaker_name?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base leading-snug">{liveEvent?.title ?? "שידור פעיל"}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {liveEvent?.speaker_name} · {liveEvent ? getTimeStr(liveEvent.starts_at) : ""}
              </p>
            </div>
            <Button className="rounded-xl gap-2 font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0">
              <Radio className="h-4 w-4" />
              הצטרף לשידור
            </Button>
          </div>
        </div>
      ) : nextEvent ? (
        <div className="rounded-2xl overflow-hidden border border-border bg-card/80 backdrop-blur-sm card-shadow">
          <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2 text-muted-foreground text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/40" />
            </span>
            אין שידור פעיל כרגע
          </div>
          <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shrink-0">
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage src={nextEvent.speaker_avatar_url ?? undefined} className="object-cover" />
                <AvatarFallback>{nextEvent.speaker_name?.[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium mb-1">הלייב הבא</p>
              <h2 className="font-bold text-base leading-snug">{nextEvent.title}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeStr(nextEvent.starts_at)}</span>
                <span className="flex items-center gap-1"><CalIcon className="h-3 w-3" />{formatDateShort(getDateStr(nextEvent.starts_at))} · {formatDayShort(getDateStr(nextEvent.starts_at))}</span>
                <span>{nextEvent.speaker_name}</span>
              </div>
              <div className="mt-2">
                <CountdownBadge startsAt={nextEvent.starts_at} />
              </div>
            </div>
            <Button
              variant="outline"
              className="rounded-xl gap-2 font-bold hover:bg-primary/5 hover:border-primary/40 shrink-0"
              disabled
            >
              <Radio className="h-4 w-4" />
              הצטרף לשידור
            </Button>
          </div>
        </div>
      ) : null}

      {/* Admin toggle */}
      {isAdmin && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <span>מצב אדמין — סימולציית שידור:</span>
          <Button
            size="sm"
            variant={isLiveActive ? "destructive" : "outline"}
            className="h-6 text-xs px-2"
            onClick={() => setIsLiveActive((v) => !v)}
          >
            {isLiveActive ? "כבה שידור" : "הפעל שידור"}
          </Button>
        </div>
      )}

      {/* Monthly Schedule */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm">
            {["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"][now.getMonth()]} {now.getFullYear()} — לוח שידורים
          </h3>
        </div>
        <div className="divide-y divide-border/40">
          {monthEvents.map((e) => {
            const daysUntil = getDaysUntil(getDateStr(e.starts_at));
            const isPast = daysUntil < 0;
            const isToday = daysUntil === 0;
            const isNext = e === nextEvent;
            return (
              <div key={e.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${isNext ? "bg-primary/5" : "hover:bg-secondary/20"}`}>
                <span className={`text-sm w-5 flex justify-center ${isPast ? "text-muted-foreground/50" : isToday ? "text-destructive" : "text-muted-foreground/50"}`}>
                  {isPast ? "✅" : isToday ? "🔴" : "○"}
                </span>
                <span className={`text-xs font-mono w-11 shrink-0 ${isPast ? "text-muted-foreground/50" : "text-foreground/70"}`}>
                  {formatDateShort(getDateStr(e.starts_at))}
                </span>
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={e.speaker_avatar_url ?? undefined} className="object-cover" />
                  <AvatarFallback className="text-[8px]">{e.speaker_name?.[0]}</AvatarFallback>
                </Avatar>
                <span className={`flex-1 text-sm font-medium truncate ${isPast ? "text-muted-foreground/60" : "text-foreground"}`}>
                  {e.title}
                </span>
                <span className={`text-xs shrink-0 ${isPast ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                  {e.speaker_name?.split(" ")[0]}
                </span>
                {isToday && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[9px] px-1.5 py-0 shrink-0">היום!</Badge>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-border/40">
          <button
            onClick={onSwitchToCalendar}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            לוז מלא בלוח שנה
          </button>
        </div>
      </div>

      {/* Recent Recordings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            <Video className="h-3.5 w-3.5 text-primary" />
            הקלטות אחרונות
          </h3>
          <Link href="/recordings" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
            כל ההקלטות <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {recentRecordings.map((r, idx) => (
            <Link key={idx} href="/recordings" className="block group">
              <div className="bg-card/80 rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all card-shadow">
                <div className={`h-16 bg-gradient-to-br ${r.gradient} flex items-center justify-center`}>
                  <Video className="h-6 w-6 text-white/80" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.speaker} · {r.duration}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Main Page ───────────────────
export default function Events() {
  const router = useRouter();
  const { data: events, isLoading, error } = useEvents();
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("calendar");
  const now = new Date();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !events) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">שגיאה בטעינת אירועים</p>
      </div>
    );
  }

  const toggleRegister = (ev: React.MouseEvent, eventId: string) => {
    ev.stopPropagation();
    setRegisteredEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const futureEvents = events.filter((e) => new Date(e.starts_at) >= now);
  const nextEvent = futureEvents[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <CalIcon className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">לוז המועדון החודשי</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {futureEvents.length} אירועים קרובים · שידורים חיים, סדנאות ומפגשים
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid grid-cols-2 max-w-xs mb-4">
          <TabsTrigger value="calendar" className="gap-1.5 text-sm font-semibold">
            <CalIcon className="h-3.5 w-3.5" /> לוח שנה
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-1.5 text-sm font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            חדר לייבים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0 space-y-5">
          {/* Monthly Calendar */}
          <MonthCalendar
            events={events}
            registeredEvents={registeredEvents}
            onRegister={toggleRegister}
          />

      {/* Next Event Hero Card */}
      {nextEvent && (() => {
        const heroDate = formatDateShort(getDateStr(nextEvent.starts_at));
        const heroDaysUntil = getDaysUntil(getDateStr(nextEvent.starts_at));
        return (
          <div className="pt-2">
            <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              האירוע הבא
            </h2>
            <div
              onClick={() => router.push(`/events/${nextEvent.id}`)}
              className="relative bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-primary/30 ring-1 ring-primary/10 cursor-pointer group hover:elevated-shadow hover:border-primary/40 transition-all duration-300 overflow-hidden"
            >
              {/* Desktop */}
              <div className="relative hidden sm:flex items-start gap-4 p-5">
                <div className="shrink-0 w-16 text-center pt-1">
                  <p className="text-2xl font-extrabold text-primary leading-none tracking-tight">{heroDate}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{formatDayShort(getDateStr(nextEvent.starts_at))}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shadow-lg">
                    <Avatar className="h-14 w-14 border-[2px] border-background">
                      <AvatarImage src={nextEvent.speaker_avatar_url ?? undefined} className="object-cover" />
                      <AvatarFallback className="text-sm font-bold">{nextEvent.speaker_name?.[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium">{nextEvent.speaker_name?.split(" ")[0]}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className="gradient-primary border-0 text-[10px] font-bold gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> האירוע הבא
                    </Badge>
                    <LiveBadge startsAt={nextEvent.starts_at} />
                    {nextEvent.min_tier_level > 0 && <TierBadge tierLevel={nextEvent.min_tier_level} />}
                    {heroDaysUntil <= 3 && heroDaysUntil > 0 && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">
                        עוד {heroDaysUntil} ימים!
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-extrabold text-lg leading-snug group-hover:text-primary transition-colors">{nextEvent.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{nextEvent.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeStr(nextEvent.starts_at)}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> זום</span>
                    <span>מנחה: <span className="font-medium text-foreground/80">{nextEvent.speaker_name}</span></span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <CountdownBadge startsAt={nextEvent.starts_at} />
                    <Button
                      size="sm"
                      className={`rounded-xl gap-1.5 text-xs font-bold ${registeredEvents.has(nextEvent.id) ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
                      onClick={(ev) => toggleRegister(ev, nextEvent.id)}
                    >
                      {registeredEvents.has(nextEvent.id) ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        window.open(buildGoogleCalendarUrl(nextEvent), "_blank", "noopener,noreferrer");
                      }}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="relative sm:hidden">
                <div className="flex items-start gap-3 p-4 pb-3">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="text-center">
                      <p className="text-xl font-extrabold text-primary leading-none tracking-tight">{heroDate}</p>
                      <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{formatDayShort(getDateStr(nextEvent.starts_at))}</p>
                    </div>
                    <div className="rounded-full p-[1.5px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)]">
                      <Avatar className="h-10 w-10 border-[2px] border-background">
                        <AvatarImage src={nextEvent.speaker_avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-xs font-bold">{nextEvent.speaker_name?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge className="gradient-primary border-0 text-[9px] font-bold gap-0.5 px-1.5 py-0">
                        <Sparkles className="h-2.5 w-2.5" /> האירוע הבא
                      </Badge>
                      <LiveBadge startsAt={nextEvent.starts_at} size="sm" />
                      {nextEvent.min_tier_level > 0 && <TierBadge tierLevel={nextEvent.min_tier_level} />}
                    </div>
                    <h3 className="font-extrabold text-[14px] group-hover:text-primary transition-colors leading-snug">{nextEvent.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeStr(nextEvent.starts_at)}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> זום</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      מנחה: <span className="font-medium text-foreground/80">{nextEvent.speaker_name}</span>
                    </p>
                    <div className="mt-2">
                      <CountdownBadge startsAt={nextEvent.starts_at} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-primary/10 px-4 py-2.5 flex gap-2">
                  <Button
                    size="sm"
                    className={`flex-1 rounded-xl gap-1.5 text-xs font-bold ${registeredEvents.has(nextEvent.id) ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
                    onClick={(ev) => toggleRegister(ev, nextEvent.id)}
                  >
                    {registeredEvents.has(nextEvent.id) ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl gap-1.5 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      window.open(buildGoogleCalendarUrl(nextEvent), "_blank", "noopener,noreferrer");
                    }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upcoming Events List */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <CalIcon className="h-3.5 w-3.5 text-primary" />
          אירועים קרובים
        </h2>
        <div className="space-y-3">
          {futureEvents.map((e) => {
            const isNext = e === nextEvent;
            const daysUntil = getDaysUntil(getDateStr(e.starts_at));
            const isSoon = daysUntil <= 3 && daysUntil > 0;

            if (isNext) return null;

            return (
              <div
                key={e.id}
                onClick={() => router.push(`/events/${e.id}`)}
                className="bg-card/80 backdrop-blur-sm border-primary/30 ring-1 ring-primary/10 rounded-2xl card-shadow border transition-all duration-300 hover:elevated-shadow hover:border-primary/30 relative group cursor-pointer overflow-hidden"
              >
                {/* Desktop layout */}
                <div className="hidden sm:flex items-start gap-4 p-4 sm:p-5">
                  <div className="shrink-0 w-14 text-center pt-1">
                    <p className="text-lg font-extrabold text-primary leading-none tracking-tight">{formatDateShort(getDateStr(e.starts_at))}</p>
                    <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{formatDayShort(getDateStr(e.starts_at))}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="rounded-full p-[1.5px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)]">
                      <Avatar className="h-12 w-12 border-[2px] border-background">
                        <AvatarImage src={e.speaker_avatar_url ?? undefined} className="object-cover" />
                        <AvatarFallback className="text-sm font-bold">{e.speaker_name?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="text-[9px] text-muted-foreground font-medium truncate max-w-[70px]">{e.speaker_name?.split(" ")[0]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {isSoon && (
                        <Badge className="gradient-primary border-0 text-[10px] font-bold gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> בקרוב!
                        </Badge>
                      )}
                      <LiveBadge startsAt={e.starts_at} />
                      {e.min_tier_level > 0 && <TierBadge tierLevel={e.min_tier_level} />}
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors leading-snug">{e.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{e.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeStr(e.starts_at)}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> זום</span>
                      <span>מנחה: <span className="font-medium text-foreground/80">{e.speaker_name}</span></span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 self-center">
                    <Button
                      size="sm"
                      className={`rounded-xl gap-1.5 text-xs font-bold ${registeredEvents.has(e.id) ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
                      onClick={(ev) => toggleRegister(ev, e.id)}
                    >
                      {registeredEvents.has(e.id) ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        window.open(buildGoogleCalendarUrl(e), "_blank", "noopener,noreferrer");
                      }}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
                    </Button>
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                      <div className="text-center">
                        <p className="text-[15px] font-extrabold text-primary leading-none tracking-tight">{formatDateShort(getDateStr(e.starts_at))}</p>
                        <p className="text-[8px] text-muted-foreground font-medium mt-0.5">{formatDayShort(getDateStr(e.starts_at))}</p>
                      </div>
                      <div className="rounded-full p-[1.5px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)]">
                        <Avatar className="h-10 w-10 border-[2px] border-background">
                          <AvatarImage src={e.speaker_avatar_url ?? undefined} className="object-cover" />
                          <AvatarFallback className="text-xs font-bold">{e.speaker_name?.[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {isSoon && (
                          <Badge className="gradient-primary border-0 text-[9px] font-bold gap-0.5 px-1.5 py-0">
                            <Sparkles className="h-2.5 w-2.5" /> בקרוב!
                          </Badge>
                        )}
                        <LiveBadge startsAt={e.starts_at} size="sm" />
                        {e.min_tier_level > 0 && <TierBadge tierLevel={e.min_tier_level} />}
                        {daysUntil > 0 && daysUntil <= 7 && (
                          <span className="text-[9px] text-primary/70 font-bold">עוד {daysUntil} ימים</span>
                        )}
                      </div>
                      <h3 className="font-bold text-[13px] group-hover:text-primary transition-colors leading-snug">{e.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getTimeStr(e.starts_at)}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> זום</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        מנחה: <span className="font-medium text-foreground/80">{e.speaker_name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border/40 px-4 py-2.5 flex gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 rounded-xl gap-1.5 text-xs font-bold ${registeredEvents.has(e.id) ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
                      onClick={(ev) => toggleRegister(ev, e.id)}
                    >
                      {registeredEvents.has(e.id) ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl gap-1.5 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        window.open(buildGoogleCalendarUrl(e), "_blank", "noopener,noreferrer");
                      }}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </TabsContent>

        <TabsContent value="live" className="mt-0">
          <LiveRoomTab
            events={events}
            onSwitchToCalendar={() => setActiveTab("calendar")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
