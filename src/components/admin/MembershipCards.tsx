'use client';

import { useState } from "react";
import { UserPlus, UserMinus, TrendingUp, TrendingDown, CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
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

// Mock data per period
const joinedData: Record<Exclude<Period, "custom">, { value: number; change: string; trend: "up" | "down" }> = {
  day: { value: 12, change: "+3 מאתמול", trend: "up" },
  week: { value: 84, change: "+15% מהשבוע שעבר", trend: "up" },
  month: { value: 342, change: "+22% מהחודש שעבר", trend: "up" },
  year: { value: 3180, change: "+38% מהשנה שעברה", trend: "up" },
};

const leftData: Record<Exclude<Period, "custom">, { value: number; change: string; trend: "up" | "down" }> = {
  day: { value: 2, change: "-1 מאתמול", trend: "down" },
  week: { value: 18, change: "+3 מהשבוע שעבר", trend: "up" },
  month: { value: 67, change: "-12% מהחודש שעבר", trend: "down" },
  year: { value: 620, change: "-8% מהשנה שעברה", trend: "down" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

interface MembershipCardProps {
  type: "joined" | "left";
  index: number;
}

function MembershipCard({ type, index }: MembershipCardProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [customDate, setCustomDate] = useState<Date>();

  const isJoined = type === "joined";
  const data = period === "custom"
    ? { value: isJoined ? 5 : 1, change: customDate ? format(customDate, "dd/MM/yyyy") : "בחר תאריך", trend: isJoined ? "up" as const : "down" as const }
    : isJoined ? joinedData[period] : leftData[period];

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible"
      className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 hover:elevated-shadow transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            {isJoined ? "הצטרפו למועדון" : "נטשו מועדון"}
          </p>
          <p className="text-2xl font-bold mt-1">{data.value.toLocaleString()}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
            isJoined
              ? data.trend === "up" ? "text-success" : "text-destructive"
              : data.trend === "up" ? "text-destructive" : "text-success"
          }`}>
            {data.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {data.change}
          </div>
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
          isJoined ? "gradient-primary" : "bg-destructive/10"
        }`}>
          {isJoined
            ? <UserPlus className="h-5 w-5 text-primary-foreground" />
            : <UserMinus className="h-5 w-5 text-destructive" />
          }
        </div>
      </div>

      {/* Period filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {(Object.keys(periodLabels) as Period[]).filter(p => p !== "custom").map((p) => (
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
          <PopoverContent className="w-auto p-0" align="start">
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
    </motion.div>
  );
}

export default function MembershipCards() {
  return (
    <>
      <MembershipCard type="joined" index={3} />
      <MembershipCard type="left" index={4} />
    </>
  );
}
