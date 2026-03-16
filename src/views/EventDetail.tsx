'use client';

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calendar as CalIcon, CalendarPlus, Clock, MapPin, Timer, Users,
  ArrowRight, MessageSquare, Send, Heart, Share2, Check, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEvent, useEvents } from "@/hooks/useEvents";
import { useEventRsvp } from "@/hooks/useEventRsvp";
import { downloadICS } from "@/lib/calendar";


const typeStyles: Record<string, string> = {
  "הרצאה": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "סדנה": "bg-purple-500/10 text-purple-600 border-purple-500/30",
  "אסטרטגיה": "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

function formatDateHebrew(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { weekday: "long" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

function getDateStr(startsAt: string): string {
  return startsAt.slice(0, 10);
}

function getTimeStr(startsAt: string): string {
  const d = new Date(startsAt);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function useCountdown(startsAt: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const target = new Date(startsAt);
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("עכשיו!"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) setTimeLeft(`${days} ימים, ${hours} שעות`);
      else if (hours > 0) setTimeLeft(`${hours} שעות, ${minutes} דקות`);
      else setTimeLeft(`${minutes} דקות`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startsAt]);
  return timeLeft;
}

function buildGoogleCalendarUrl(event: { title: string; description: string | null; starts_at: string; ends_at: string | null }) {
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 90 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE", text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`, details: event.description || "", location: "Zoom",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
}

const mockComments: Comment[] = [
  { id: 1, author: "שרי רוזנוסר", avatar: "sari", text: "מחכה בקוצר רוח! נושא סופר רלוונטי 🔥", time: "לפני שעתיים", likes: 5 },
  { id: 2, author: "דוד לוי", avatar: "david", text: "תודה על הסשן האחרון, היה מעולה!", time: "לפני 4 שעות", likes: 3 },
  { id: 3, author: "מאיה ר.", avatar: "maya", text: "שאלה - האם יהיה חלק של Q&A בסוף?", time: "אתמול", likes: 2 },
];

export default function EventDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: event, isLoading, error } = useEvent(id);
  const { toggleRsvp, isToggling } = useEventRsvp(id);
  const { data: allEvents } = useEvents();
  const timeLeft = useCountdown(event?.starts_at ?? "");
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">האירוע לא נמצא</p>
        <Button variant="link" onClick={() => router.push("/events")}>חזרה ללוח אירועים</Button>
      </div>
    );
  }

  const isPast = new Date(event.starts_at) < new Date();
  const typeCls = typeStyles[event.event_type ?? ""] || "";
  const dateStr = getDateStr(event.starts_at);
  const timeStr = getTimeStr(event.starts_at);

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      { id: Date.now(), author: "לי ברקוביץ", avatar: "iti", text: newComment.trim(), time: "עכשיו", likes: 0 },
      ...prev,
    ]);
    setNewComment("");
  };

  const toggleLike = (commentId: number) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  // Other upcoming events (not current)
  const otherEvents = (allEvents ?? [])
    .filter((e) => e.id !== id && new Date(e.starts_at) >= new Date())
    .slice(0, 3);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.push("/events")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
      >
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        <span>חזרה ללוח אירועים</span>
      </button>

      {/* Header card */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
        {/* Top section with speaker */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Speaker column */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
              <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shadow-lg">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-[3px] border-background">
                  {event.speaker_avatar_url ? (
                    <AvatarImage src={event.speaker_avatar_url} className="object-cover" />
                  ) : (
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.speaker_name ?? "speaker"}`} />
                  )}
                  <AvatarFallback className="text-lg font-bold">{(event.speaker_name ?? "?")[0]}</AvatarFallback>
                </Avatar>
              </div>
              <div className="sm:text-center">
                <p className="text-sm font-bold text-foreground/80">{event.speaker_name}</p>
                <p className="text-[10px] text-muted-foreground">מנחה</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {event.event_type && (
                  <Badge variant="outline" className={`text-[10px] ${typeCls}`}>{event.event_type}</Badge>
                )}
                {!isPast && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Timer className="h-3 w-3" />
                    {timeLeft}
                  </div>
                )}
                {isPast && <Badge variant="secondary" className="text-[10px]">הסתיים</Badge>}
              </div>

              <h1 className="font-display text-xl sm:text-2xl font-bold leading-snug">{event.title}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{event.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><CalIcon className="h-3.5 w-3.5" /> {formatDay(dateStr)}, {formatDateShort(dateStr)}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {timeStr}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.is_online ? "זום (אונליין)" : "פרונטלי"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions bar */}
        <div className="border-t border-border/40 px-5 sm:px-6 py-3 flex items-center gap-3 flex-wrap bg-secondary/10">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-bold">{event.rsvpCount}</span>
            <span className="text-muted-foreground text-xs">נרשמו</span>
          </div>

          <div className="flex-1" />

          <Button
            size="sm"
            className={`min-w-[130px] rounded-xl gap-1.5 text-xs font-bold ${event.isRsvped ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
            onClick={() => toggleRsvp()}
            disabled={isToggling}
          >
            {event.isRsvped ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-w-[130px] rounded-xl gap-1.5 text-xs font-bold"
            render={<a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" />}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-w-[130px] rounded-xl gap-1.5 text-xs font-bold"
            onClick={() => {
              const start = new Date(event.starts_at);
              const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 90 * 60 * 1000);
              downloadICS({
                title: event.title,
                description: event.description || "",
                startTime: start,
                endTime: end,
                location: event.is_online ? "Zoom" : undefined,
                url: event.zoom_url ?? undefined,
              }, `${event.title.slice(0, 30)}.ics`);
            }}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> הורד .ics
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <><Check className="h-3.5 w-3.5" /> הועתק!</> : <><Share2 className="h-3.5 w-3.5" /> שתף</>}
          </Button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          תגובות ({comments.length})
        </h2>

        {/* New comment */}
        <div className="flex gap-3 mb-5">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=iti" />
            <AvatarFallback className="text-[9px]">לב</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <input
              placeholder="כתבו תגובה..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addComment()}
              className="flex-1 text-sm bg-secondary/30 border border-border/40 rounded-xl px-3 py-2 outline-none focus:border-primary/50 transition-colors"
            />
            <Button size="sm" className="rounded-xl gap-1 shrink-0" onClick={addComment} disabled={!newComment.trim()}>
              <Send className="h-3 w-3" /> שלח
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`} />
                <AvatarFallback className="text-[9px]">{c.author[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-secondary/30 rounded-2xl rounded-tr-sm px-3 py-2 border border-border/20">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-xs">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                </div>
                <button
                  onClick={() => toggleLike(c.id)}
                  className={`flex items-center gap-1 text-[11px] font-medium mt-1 px-1 transition-all cursor-pointer ${
                    likedComments.has(c.id) ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                  }`}
                >
                  <Heart className={`h-3 w-3 ${likedComments.has(c.id) ? "fill-current" : ""}`} />
                  {c.likes + (likedComments.has(c.id) ? 1 : 0) > 0 && (c.likes + (likedComments.has(c.id) ? 1 : 0))}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other upcoming events */}
      {otherEvents.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-primary" />
            אירועים נוספים
          </h2>
          <div className="space-y-2">
            {otherEvents.map((e) => (
              <div
                key={e.id}
                onClick={() => router.push(`/events/${e.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/40 transition-colors cursor-pointer group"
              >
                <div className="shrink-0 text-center w-10">
                  <p className="text-sm font-extrabold text-primary leading-none">{formatDateShort(getDateStr(e.starts_at))}</p>
                </div>
                <div className="rounded-full p-[1px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shrink-0">
                  <Avatar className="h-9 w-9 border-[1.5px] border-background">
                    {e.speaker_avatar_url ? (
                      <AvatarImage src={e.speaker_avatar_url} className="object-cover" />
                    ) : (
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${e.speaker_name ?? "speaker"}`} />
                    )}
                    <AvatarFallback className="text-[9px] font-bold">{(e.speaker_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">{e.speaker_name} · {getTimeStr(e.starts_at)}</p>
                </div>
                {e.event_type && (
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${typeStyles[e.event_type] || ""}`}>{e.event_type}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
