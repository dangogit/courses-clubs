'use client';

import { useState } from "react";
import { Trophy, Star, Crown } from "lucide-react";
import { club } from "@/config/club";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { levels, getLevel } from "@/data/levels";
import { useLeaderboard, useUserRank, type LeaderboardPeriod, type LeaderboardEntry } from "@/hooks/useLeaderboard";
import { useUserXP } from "@/hooks/useUserXP";

const rankMedals: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function LeaderList({ data, isLoading }: { data: LeaderboardEntry[]; isLoading: boolean }) {
  const maxPoints = data[0]?.points ?? 1;

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-secondary/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        אין נתונים עדיין — התחילו לצבור נקודות!
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {data.map((l) => (
        <div
          key={l.user_id}
          className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl hover:bg-accent/40 transition-colors ${
            l.rank <= 3 ? "bg-accent/20" : ""
          }`}
        >
          <span className="w-6 text-center shrink-0">
            {rankMedals[l.rank] ? (
              <span className="text-base">{rankMedals[l.rank]}</span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">{l.rank}</span>
            )}
          </span>
          <Avatar className={`h-8 w-8 shrink-0 ring-2 ${l.rank <= 3 ? "ring-primary/30" : "ring-border/20"}`}>
            <AvatarImage src={l.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${l.user_id}`} />
            <AvatarFallback className="text-[10px] font-bold">{(l.display_name ?? "?")[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${l.rank <= 3 ? "text-foreground" : ""}`}>{l.display_name ?? "משתמש"}</p>
            <div className="h-1 rounded-full bg-secondary/80 mt-1 overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${(l.points / maxPoints) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-600">{l.points.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const tabs = [
  { id: "weekly" as const, label: "שבועי" },
  { id: "monthly" as const, label: "חודשי" },
  { id: "alltime" as const, label: "כל הזמנים" },
];

export default function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardPeriod>("weekly");
  const { data: xp } = useUserXP();
  const { data: leaderboardData, isLoading } = useLeaderboard(tab);
  const { data: userRank } = useUserRank(tab);

  const userPoints = xp?.xpTotal ?? 0;
  const myLevel = getLevel(userPoints);

  const periodPoints = userRank?.points ?? userPoints;
  const periodRank = userRank?.rank;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Trophy className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">מובילי הקהילה</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
{`              החברים הפעילים ביותר במועדון ${club.name}`}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-accent/40 to-primary/5 pt-5 pb-4 flex flex-col items-center">
          <div className="rounded-full p-[3px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shadow-lg">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-[3px] border-background">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
              <AvatarFallback className="text-xl font-bold">?</AvatarFallback>
            </Avatar>
          </div>
          <h3 className="font-extrabold text-lg mt-2">חבר מועדון</h3>
          <p className="text-xs text-muted-foreground">
            {periodRank ? `מקום ${periodRank} ב${tabs.find((t) => t.id === tab)?.label}` : "חבר מועדון"}
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-border/40">
          <div className="p-3 text-center border-l border-border/40">
            <p className="text-[10px] text-muted-foreground mb-0.5">נקודות</p>
            <p className="text-lg font-extrabold text-primary">{periodPoints.toLocaleString()}</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">דרגה נוכחית</p>
            <p className="text-sm font-extrabold text-primary">{myLevel.icon} {myLevel.name}</p>
          </div>
        </div>
        {myLevel.nextLvl && (
          <div className="px-4 pb-3 pt-2 border-t border-border/40">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">עד {myLevel.nextLvl.icon} {myLevel.nextLvl.name}</span>
              <span className="font-bold text-primary">{myLevel.pointsToNext} נק׳</span>
            </div>
            <Progress value={myLevel.progress} className="h-2" />
          </div>
        )}
      </div>

      {/* How to earn points */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-5">
        <h3 className="font-bold text-sm text-center mb-4">כך תעלו רמות במערכת ותזכו בפרסים 🎁</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: "👍", label: "לייקים", lines: ["2 נק׳ על כל לייק שתקבלו", "על פוסט או תגובה"] },
            { icon: "🎓", label: "למידה", lines: ["4 נק׳ על כל צפייה בהקלטה", "של מפגש"] },
            { icon: "🔁", label: "עקביות", lines: ["1 נק׳ על כל כניסה יומית", "5 נק׳ על 5 ימי רצף", "10 נק׳ על צפייה ב-4 מפגשים בחודש"] },
            { icon: "🌟", label: "פרגון לקהילה", lines: ["1 נק׳ על כל לייק שתתנו", "לפוסט שעזר לכם"] },
            { icon: "🤝", label: "הזמנת חברים", lines: ["50 נק׳ על כל חבר שהצטרף", "למועדון דרככם"] },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-accent/20 hover:bg-accent/40 transition-colors">
              <div className="h-11 w-11 rounded-full gradient-primary flex items-center justify-center text-xl shadow-sm">
                {item.icon}
              </div>
              <p className="text-xs font-bold text-primary">{item.label}</p>
              <div className="space-y-0.5">
                {item.lines.map((line, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground leading-snug">{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Levels + Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Levels List */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border/40 text-center shrink-0">
            <h3 className="font-bold text-sm flex items-center justify-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              דרגות הקהילה
            </h3>
          </div>
          <div className="overflow-y-auto scrollbar-thin max-h-[530px]">
            <div className="space-y-0.5 p-2">
              {levels.map((l) => {
                const reached = userPoints >= l.min;
                const isCurrent = myLevel.name === l.name;
                return (
                  <div
                    key={l.rank}
                    className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 rounded-xl hover:bg-accent/40 transition-colors ${
                      isCurrent ? "bg-accent/20" : ""
                    }`}
                  >
                    <span className="w-6 text-center shrink-0">
                      <span className={`text-xs font-bold ${reached ? "text-primary" : "text-muted-foreground/40"}`}>{l.rank}</span>
                    </span>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-lg shrink-0 ring-2 ${reached ? "ring-primary/30 bg-primary/10" : "ring-border/20 bg-secondary"}`}>
                      {l.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${reached ? "text-foreground" : "text-muted-foreground/40"}`}>{l.name}</p>
                      <div className="h-1 rounded-full bg-secondary/80 mt-1 overflow-hidden">
                        <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: reached ? "100%" : "0%" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className={`text-xs font-bold ${reached ? "text-amber-600" : "text-muted-foreground/40"}`}>{l.min.toLocaleString()}</span>
                      {isCurrent && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">אתה כאן</span>}
                      {reached && !isCurrent && <span className="text-primary text-xs">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden flex flex-col">
          <div className="flex items-center gap-1 p-2 border-b border-border/40 bg-secondary/20 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto scrollbar-thin max-h-[530px] p-2">
            <LeaderList data={leaderboardData ?? []} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
