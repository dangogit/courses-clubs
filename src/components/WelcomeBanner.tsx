'use client';
import { CalendarPlus, Check, Clock, MapPin, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const hiliPlautImg = "/assets/speakers/hili-plaut.jpg";

function useCountdown(targetDate: string, targetTime: string) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const target = new Date(`${targetDate}T${targetTime}:00`);
    const update = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setIsLive(true);
        setDays(0); setHours(0); setMinutes(0); setSeconds(0);
        return;
      }
      setIsLive(false);
      setDays(Math.floor(diff / (1000 * 60 * 60 * 24)));
      setHours(Math.floor((diff / (1000 * 60 * 60)) % 24));
      setMinutes(Math.floor((diff / (1000 * 60)) % 60));
      setSeconds(Math.floor((diff / 1000) % 60));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  return { days, hours, minutes, seconds, isLive };
}

const nextEvent = {
  title: "Manychat - יצירת אוטומציות לסושיאל ולוואטסאפ",
  date: "2026-02-18",
  time: "20:30",
  host: "הילי פלאוט",
  type: "סדנה",
  description: "הילי פלאוט מדריכה איך ליצור אוטומציות לסושיאל ולוואטסאפ עם Manychat בקלות ובמהירות",
};

function buildGoogleCalendarUrl() {
  const start = new Date(`${nextEvent.date}T${nextEvent.time}:00`);
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE", text: nextEvent.title,
    dates: `${fmt(start)}/${fmt(end)}`, details: nextEvent.description, location: "Zoom",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function WelcomeBanner() {
  const { days, hours, minutes, seconds, isLive } = useCountdown(nextEvent.date, nextEvent.time);
  const [registered, setRegistered] = useState(false);

  const d = new Date(nextEvent.date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="gradient-hero relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsla(0,0%,100%,0.08),transparent_50%)]" />

        {/* Desktop layout */}
        <div className="relative hidden sm:flex gap-5 p-5">
          {/* Right side: avatar + info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Date block */}
            <div className="shrink-0 w-14 text-center pt-1.5">
              <p className="text-xl font-extrabold text-primary-foreground leading-none tracking-tight">
                {day}.{month}
              </p>
              <p className="text-[10px] text-primary-foreground/50 font-medium mt-0.5">
                {d.toLocaleDateString("he-IL", { weekday: "short" })}
              </p>
            </div>

            {/* Avatar */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="rounded-full p-[2px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shadow-lg">
                <Avatar className="h-12 w-12 border-[2px] border-background">
                  <AvatarImage src={hiliPlautImg} className="object-cover" />
                  <AvatarFallback className="text-xs font-bold">הפ</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-[9px] text-primary-foreground/50 font-medium">הילי</p>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge className="gradient-primary border-0 text-[10px] font-bold gap-1 text-primary-foreground shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" /> הלייב הבא
                </Badge>
                {isLive && (
                  <Badge className="bg-red-500 text-white border-0 text-[10px] font-bold gap-1 animate-pulse">
                    <Radio className="h-2.5 w-2.5" /> LIVE
                  </Badge>
                )}
              </div>

              <h2 className="font-extrabold text-base text-primary-foreground leading-snug">
                {nextEvent.title}
              </h2>

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-primary-foreground/60">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {nextEvent.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> זום
                </span>
                <span>מנחה: <span className="font-medium text-primary-foreground/80">{nextEvent.host}</span></span>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-center mt-1.5">
                <Button
                  size="sm"
                  className={`h-8 rounded-xl gap-1.5 text-xs font-bold ${registered ? "bg-emerald-500 hover:bg-emerald-600" : "gradient-primary hover:opacity-90"}`}
                  onClick={() => setRegistered(!registered)}
                >
                  {registered ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl gap-1.5 text-xs font-bold hover:bg-primary/5 hover:border-primary/40"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
                </Button>
              </div>
            </div>
          </div>

          {/* Left side: countdown + buttons */}
          <div className="shrink-0 flex flex-col justify-center items-center gap-3 min-w-[150px]">
            {/* Countdown */}
            <div className="flex items-center gap-1 direction-rtl">
              {(days > 0
                ? [
                  { value: pad(minutes), label: "דקות" },
                  { value: pad(hours), label: "שעות" },
                  { value: pad(days), label: "ימים" },
                ]
                : [
                  { value: pad(hours), label: "שעות" },
                  { value: pad(minutes), label: "דקות" },
                  { value: pad(seconds), label: "שניות" },
                ]
              ).map((unit, i, arr) => (
                <div key={unit.label} className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-lg w-10 py-1.5 text-center border border-primary-foreground/10">
                      <span className="text-primary-foreground font-mono font-bold text-base tabular-nums leading-none">
                        {unit.value}
                      </span>
                    </div>
                    <span className="text-primary-foreground/40 text-[8px] font-medium mt-0.5">{unit.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-primary-foreground/30 font-bold text-sm mb-3">:</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="relative sm:hidden">
          <div className="flex items-start gap-3 p-4 pb-3">
            {/* Date + Avatar column */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="text-center">
                <p className="text-lg font-extrabold text-primary-foreground leading-none tracking-tight">
                  {day}.{month}
                </p>
                <p className="text-[9px] text-primary-foreground/50 font-medium mt-0.5">
                  {d.toLocaleDateString("he-IL", { weekday: "short" })}
                </p>
              </div>
              <div className="rounded-full p-[1.5px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)]">
                <Avatar className="h-10 w-10 border-[2px] border-background">
                  <AvatarImage src={hiliPlautImg} className="object-cover" />
                  <AvatarFallback className="text-xs font-bold">הפ</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Badge className="gradient-primary border-0 text-[9px] font-bold gap-0.5 px-1.5 py-0 text-primary-foreground shadow-sm">
                  <Sparkles className="h-2.5 w-2.5" /> הלייב הבא
                </Badge>
                {isLive && (
                  <Badge className="bg-red-500 text-white border-0 text-[9px] font-bold gap-0.5 px-1.5 py-0 animate-pulse">
                    <Radio className="h-2.5 w-2.5" /> LIVE
                  </Badge>
                )}
              </div>

              <h3 className="font-extrabold text-[14px] text-primary-foreground leading-snug">
                {nextEvent.title}
              </h3>

              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-primary-foreground/60 flex-wrap">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {nextEvent.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> זום</span>
              </div>
              <p className="text-[11px] text-primary-foreground/50 mt-1">
                מנחה: <span className="font-medium text-primary-foreground/80">{nextEvent.host}</span>
              </p>



              {/* Countdown inline */}
              <div className="flex items-center gap-1 mt-2">
                {(days > 0
                  ? [
                    { value: pad(days), label: "ימים" },
                    { value: pad(hours), label: "שעות" },
                    { value: pad(minutes), label: "דקות" },
                  ]
                  : [
                    { value: pad(hours), label: "שעות" },
                    { value: pad(minutes), label: "דקות" },
                    { value: pad(seconds), label: "שניות" },
                  ]
                ).map((unit, i, arr) => (
                  <div key={unit.label} className="flex items-center gap-1">
                    <div className="flex flex-col items-center">
                      <div className="bg-primary-foreground/15 backdrop-blur-sm rounded-md w-8 py-1 text-center border border-primary-foreground/10">
                        <span className="text-primary-foreground font-mono font-bold text-xs tabular-nums leading-none">
                          {unit.value}
                        </span>
                      </div>
                      <span className="text-primary-foreground/40 text-[7px] font-medium mt-0.5">{unit.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="text-primary-foreground/30 font-bold text-xs mb-2.5">:</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile buttons footer */}
          <div className="border-t border-primary-foreground/10 px-4 py-2.5 flex gap-2">
            <Button
              size="sm"
              className={`flex-1 rounded-xl gap-1.5 text-xs font-bold ${registered ? "bg-emerald-600 hover:bg-emerald-700" : "gradient-primary hover:opacity-90"}`}
              onClick={() => setRegistered(!registered)}
            >
              {registered ? <><Check className="h-3.5 w-3.5" /> נרשמת!</> : <><Sparkles className="h-3.5 w-3.5" /> הרשמה לאירוע</>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl gap-1.5 text-xs font-bold bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20 hover:border-primary-foreground/30"
              onClick={() => window.open(buildGoogleCalendarUrl(), "_blank", "noopener,noreferrer")}
            >
              <CalendarPlus className="h-3.5 w-3.5" /> הוסף ליומן
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
