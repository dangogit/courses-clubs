'use client';

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Period = "day" | "week" | "month" | "year" | "custom";

const periodLabels: Record<Period, string> = {
  day: "יום",
  week: "שבוע",
  month: "חודש",
  year: "שנה",
  custom: "תאריך",
};

// ── Activity chart data per period ──

const activityData: Record<Exclude<Period, "custom">, { label: string; posts: number; logins: number }[]> = {
  day: [
    { label: "בוקר", posts: 12, logins: 35 },
    { label: "צהריים", posts: 18, logins: 52 },
    { label: "ערב", posts: 24, logins: 61 },
    { label: "לילה", posts: 8, logins: 19 },
  ],
  week: [
    { label: "ראשון", posts: 42, logins: 120 },
    { label: "שני", posts: 55, logins: 145 },
    { label: "שלישי", posts: 38, logins: 132 },
    { label: "רביעי", posts: 67, logins: 168 },
    { label: "חמישי", posts: 49, logins: 151 },
    { label: "שישי", posts: 31, logins: 98 },
    { label: "שבת", posts: 22, logins: 75 },
  ],
  month: [
    { label: "שבוע 1", posts: 180, logins: 520 },
    { label: "שבוע 2", posts: 210, logins: 580 },
    { label: "שבוע 3", posts: 195, logins: 540 },
    { label: "שבוע 4", posts: 230, logins: 610 },
  ],
  year: [
    { label: "ספט", posts: 820, logins: 2400 },
    { label: "אוק", posts: 910, logins: 2650 },
    { label: "נוב", posts: 870, logins: 2500 },
    { label: "דצמ", posts: 950, logins: 2800 },
    { label: "ינו", posts: 1020, logins: 3100 },
    { label: "פבר", posts: 1100, logins: 3350 },
  ],
};

const activityCustomDay: typeof activityData.day = [
  { label: "בוקר", posts: 9, logins: 28 },
  { label: "צהריים", posts: 14, logins: 41 },
  { label: "ערב", posts: 19, logins: 53 },
  { label: "לילה", posts: 5, logins: 12 },
];

// ── Growth chart data per period ──

const growthData: Record<Exclude<Period, "custom">, { label: string; members: number }[]> = {
  day: [
    { label: "בוקר", members: 5202 },
    { label: "צהריים", members: 5215 },
    { label: "ערב", members: 5230 },
    { label: "לילה", members: 5237 },
  ],
  week: [
    { label: "ראשון", members: 5180 },
    { label: "שני", members: 5192 },
    { label: "שלישי", members: 5198 },
    { label: "רביעי", members: 5210 },
    { label: "חמישי", members: 5225 },
    { label: "שישי", members: 5231 },
    { label: "שבת", members: 5237 },
  ],
  month: [
    { label: "שבוע 1", members: 5050 },
    { label: "שבוע 2", members: 5110 },
    { label: "שבוע 3", members: 5170 },
    { label: "שבוע 4", members: 5237 },
  ],
  year: [
    { label: "ספט", members: 3200 },
    { label: "אוק", members: 3600 },
    { label: "נוב", members: 4100 },
    { label: "דצמ", members: 4500 },
    { label: "ינו", members: 4800 },
    { label: "פבר", members: 5200 },
  ],
};

const growthCustomDay: typeof growthData.day = [
  { label: "בוקר", members: 5195 },
  { label: "צהריים", members: 5202 },
  { label: "ערב", members: 5210 },
  { label: "לילה", members: 5214 },
];

// ── Period subtitle helper ──

function getActivitySubtitle(period: Period, customDate?: Date): string {
  switch (period) {
    case "day": return "פוסטים וכניסות היום";
    case "week": return "פוסטים וכניסות השבוע";
    case "month": return "פוסטים וכניסות החודש";
    case "year": return "פוסטים וכניסות ב-6 חודשים אחרונים";
    case "custom": return customDate ? `נתוני ${format(customDate, "dd/MM/yyyy")}` : "בחר תאריך";
  }
}

function getGrowthSubtitle(period: Period, customDate?: Date): string {
  switch (period) {
    case "day": return "צמיחה לפי שעות ביום";
    case "week": return "צמיחה לפי ימים בשבוע";
    case "month": return "צמיחה לפי שבועות בחודש";
    case "year": return "מספר חברי המועדון ב-6 חודשים אחרונים";
    case "custom": return customDate ? `נתוני ${format(customDate, "dd/MM/yyyy")}` : "בחר תאריך";
  }
}

// ── Filter Pills Component ──

function PeriodFilter({
  period,
  setPeriod,
  customDate,
  setCustomDate,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
  customDate?: Date;
  setCustomDate: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {(["day", "week", "month", "year"] as const).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full transition-all",
            period === p
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
          )}
        >
          {periodLabels[p]}
        </button>
      ))}
      <Popover>
        <PopoverTrigger
          render={<button
            className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full transition-all flex items-center gap-1",
              period === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {periodLabels.custom}
          </button>}
        />
        <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
          <Calendar
            mode="single"
            selected={customDate}
            onSelect={(date) => {
              setCustomDate(date);
              setPeriod("custom");
            }}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── Main Component ──

export default function ActivityCharts() {
  const [activityPeriod, setActivityPeriod] = useState<Period>("week");
  const [activityCustomDate, setActivityCustomDate] = useState<Date>();

  const [growthPeriod, setGrowthPeriod] = useState<Period>("year");
  const [growthCustomDate, setGrowthCustomDate] = useState<Date>();

  const currentActivityData = activityPeriod === "custom" ? activityCustomDay : activityData[activityPeriod];
  const currentGrowthData = growthPeriod === "custom" ? growthCustomDay : growthData[growthPeriod];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Activity Chart */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-bold">פעילות שבועית</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {getActivitySubtitle(activityPeriod, activityCustomDate)}
        </p>
        <PeriodFilter
          period={activityPeriod}
          setPeriod={setActivityPeriod}
          customDate={activityCustomDate}
          setCustomDate={setActivityCustomDate}
        />
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={currentActivityData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 90%)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(225, 14%, 90%)",
                  boxShadow: "0 4px 16px -2px rgba(0,0,0,0.06)",
                  fontSize: "12px",
                  direction: "rtl",
                }}
              />
              <Bar dataKey="logins" name="כניסות" fill="hsl(195, 100%, 42%)" radius={[6, 6, 0, 0]} opacity={0.3} />
              <Bar dataKey="posts" name="פוסטים" fill="hsl(195, 100%, 42%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Growth Chart */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-bold">צמיחת חברים</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {getGrowthSubtitle(growthPeriod, growthCustomDate)}
        </p>
        <PeriodFilter
          period={growthPeriod}
          setPeriod={setGrowthPeriod}
          customDate={growthCustomDate}
          setCustomDate={setGrowthCustomDate}
        />
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={currentGrowthData}>
              <defs>
                <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(195, 100%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(195, 100%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 90%)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(225, 14%, 90%)",
                  boxShadow: "0 4px 16px -2px rgba(0,0,0,0.06)",
                  fontSize: "12px",
                  direction: "rtl",
                }}
              />
              <Area
                type="monotone"
                dataKey="members"
                name="חברים"
                stroke="hsl(195, 100%, 42%)"
                strokeWidth={2.5}
                fill="url(#memberGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
