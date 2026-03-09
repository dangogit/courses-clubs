'use client';

import { useState } from "react";
import { TrendingUp, TrendingDown, CalendarIcon } from "lucide-react";
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

interface PeriodData {
  value: string;
  change: string;
  trend: "up" | "down";
}

interface FilterableStatCardProps {
  title: string;
  icon: React.ElementType;
  periodData: Record<Exclude<Period, "custom">, PeriodData>;
  customData?: PeriodData;
  invertTrend?: boolean;
}

export default function FilterableStatCard({ title, icon: Icon, periodData, customData, invertTrend }: FilterableStatCardProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [customDate, setCustomDate] = useState<Date>();

  const data = period === "custom"
    ? (customData || { value: "—", change: customDate ? format(customDate, "dd/MM/yyyy") : "בחר תאריך", trend: "up" as const })
    : periodData[period];

  const trendColor = invertTrend
    ? data.trend === "up" ? "text-destructive" : "text-success"
    : data.trend === "up" ? "text-success" : "text-destructive";

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 hover:elevated-shadow transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{data.value}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendColor}`}>
            {data.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {data.change}
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

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
    </div>
  );
}
