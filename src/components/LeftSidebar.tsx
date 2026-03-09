'use client';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Sparkles,
  Trophy,
  Flame,
  Bot,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
} from "lucide-react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const rutiDenisImg = "/assets/speakers/ruti-denis.jpg";
const gabiDanielImg = "/assets/speakers/gabi-daniel.jpg";
const hiliPlautImg = "/assets/speakers/hili-plaut.jpg";
const edenBibasImg = "/assets/speakers/eden-bibas.jpg";
const mosheEylonImg = "/assets/speakers/moshe-eylon.jpg";

// ─── Profile Completion Widget ─────────────────────────────────────────────────

function ProfileCompletionWidget() {
  const { steps, completedCount, totalCount, progressPercent, remainingPoints } = useProfileCompletion();

  if (completedCount === totalCount) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 card-shadow border border-primary/25 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            השלם את הפרופיל שלך
          </h3>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-3">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] font-bold text-primary shrink-0">{progressPercent}%</span>
        </div>

        {/* Steps */}
        <div className="space-y-0.5">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors
                ${step.completed ? "text-muted-foreground" : "text-foreground"}`}
            >
              <span className="text-sm shrink-0">{step.emoji}</span>
              <span className={`flex-1 font-medium ${step.completed ? "line-through opacity-50" : ""}`}>
                {step.label}
              </span>
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            קבל עוד
            <span className="font-bold text-primary mx-1">{remainingPoints}</span>
            נקודות 🎁
          </span>
          <Link
            href="/profile"
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
          >
            ✏️ ערוך פרופיל
            <ChevronLeft className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const activeMembers = [
  { name: "שרי רוזנוסר", avatar: "sari", status: "online", role: "מנחה", xp: 1240 },
  { name: "יובל", avatar: "yuval", status: "online", role: null, xp: 980 },
  { name: "דוד מ.", avatar: "david", status: "online", role: null, xp: 870 },
  { name: "מאיה ר.", avatar: "maya", status: "online", role: "מנחה", xp: 760 },
  { name: "אלכס ב.", avatar: "alex", status: "idle", role: null, xp: 620 },
  { name: "גולן", avatar: "golan", status: "online", role: null, xp: 540 },
];

const newMembers = [
  { name: "תמר שפירא", avatar: "tamar", joined: "היום", badge: "חדש" },
  { name: "רון מזרחי", avatar: "ron", joined: "אתמול", badge: null },
  { name: "ליאור אברהם", avatar: "lior", joined: "לפני יומיים", badge: null },
  { name: "עדי גולדשטיין", avatar: "adi", joined: "לפני 3 ימים", badge: null },
  { name: "אורי תבור", avatar: "ori", joined: "לפני 4 ימים", badge: null },
];

const speakerImages: Record<string, string> = {
  "ruti-denis": rutiDenisImg,
  "gabi-daniel": gabiDanielImg,
  "hili-plaut": hiliPlautImg,
  "eden-bibas": edenBibasImg,
  "moshe-eylon": mosheEylonImg,
};

const upcomingSessions = [
  {
    title: "שימוש ב-AI לניהול זמן ופרודוקטיביות",
    date: "04.03 · 20:30",
    host: "רותי דניס",
    hostAvatar: "ruti-denis",
    tag: "לייב",
    tagColor: "bg-primary",
    eventIndex: 5,
  },
  {
    title: "בניית אוטומציות עם Make.com",
    date: "11.03 · 20:30",
    host: "גבי דניאל",
    hostAvatar: "gabi-daniel",
    tag: "לייב",
    tagColor: "bg-primary",
    eventIndex: 6,
  },
  {
    title: "ChatGPT Advanced — טכניקות מתקדמות",
    date: "18.03 · 20:30",
    host: "הילי פלאוט",
    hostAvatar: "hili-plaut",
    tag: "לייב",
    tagColor: "bg-primary",
    eventIndex: 7,
  },
];

const updates = [
  { text: "קורס חדש: יסודות AI הושק", time: "לפני שעתיים", icon: Sparkles, color: "text-primary" },
  { text: "הקהילה הגיעה ל-5,000 חברים!", time: "לפני יום", icon: Trophy, color: "text-amber-500" },
  { text: "הקלטת האירוע האחרון זמינה", time: "לפני 3 ימים", icon: Bot, color: "text-blue-500" },
];

const leaderboard = [
  { rank: 1, name: "לי ברקוביץ", avatar: "iti", xp: 4820, badge: "🥇" },
  { rank: 2, name: "שרי רוזנוסר", avatar: "sari", xp: 3250, badge: "🥈" },
  { rank: 3, name: "מאיה ר.", avatar: "maya", xp: 2980, badge: "🥉" },
  { rank: 4, name: "יובל", avatar: "yuval", xp: 1840, badge: null },
  { rank: 5, name: "דוד מ.", avatar: "david", xp: 1620, badge: null },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeftSidebar() {
  const router = useRouter();
  const [membersTab, setMembersTab] = useState<"active" | "new">("active");

  return (
    <div className="space-y-4">

      {/* Profile Completion */}
      <ProfileCompletionWidget />

      {/* Updates */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-bold">עדכונים אחרונים</h3>
          </div>
          <button className="text-[10px] text-primary hover:underline cursor-pointer font-medium">הכל</button>
        </div>
        <div className="space-y-3">
          {updates.map((u, i) => {
            const Icon = u.icon;
            return (
              <div key={i} className="flex items-start gap-2.5 cursor-pointer group">
                <div className="h-7 w-7 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0 group-hover:bg-secondary transition-colors">
                  <Icon className={`h-3.5 w-3.5 ${u.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm group-hover:text-primary transition-colors">{u.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{u.time}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-1 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-bold">אירועים קרובים</h3>
          </div>
          <button className="text-[10px] text-primary hover:underline cursor-pointer font-medium">לוח שנה</button>
        </div>
        <div className="space-y-2.5">
          {upcomingSessions.map((s, i) => (
            <Link
              key={i}
              href={`/events/${s.eventIndex}`}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors cursor-pointer group"
            >
              <Avatar className="h-7 w-7 shrink-0 ring-1 ring-primary/15">
                <AvatarImage src={speakerImages[s.hostAvatar]} className="object-cover" />
                <AvatarFallback className="text-[9px]">{s.host[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-xs leading-snug group-hover:text-primary transition-colors truncate">{s.title}</p>
                  <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-primary-foreground ${s.tagColor}`}>
                    {s.tag}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.date} · {s.host}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mini Leaderboard */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <h3 className="text-sm font-bold">מובילי קהילה</h3>
          </div>
          <button onClick={() => router.push("/leaderboard")} className="text-[10px] text-primary hover:underline cursor-pointer font-medium">
            הצג הכל
          </button>
        </div>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-2.5 py-1 px-1.5 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
            >
              <div className="w-5 text-center shrink-0">
                {entry.badge ? (
                  <span className="text-sm">{entry.badge}</span>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{entry.rank}</span>
                )}
              </div>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.avatar}`} />
                <AvatarFallback className="text-[9px]">{entry.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{entry.name}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-amber-600">{entry.xp.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Members Panel */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 card-shadow border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-bold">חברים</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {activeMembers.filter((m) => m.status === "online").length} מקוונים
            </span>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 bg-secondary/60 rounded-xl p-1 mb-3">
          {(["active", "new"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMembersTab(tab)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all cursor-pointer ${
                membersTab === tab
                  ? "bg-card text-foreground card-shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "active" ? "פעילים" : "חדשים"}
            </button>
          ))}
        </div>

        {membersTab === "active" ? (
          <div className="space-y-1.5">
            {activeMembers.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2.5 py-1 px-1 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.avatar}`} />
                    <AvatarFallback className="text-[10px] font-bold">{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                      m.status === "online" ? "bg-success" : "bg-warning"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{m.name}</span>
                    {m.role && (
                      <Badge variant="secondary" className="text-[8px] h-3.5 px-1 rounded-full font-semibold shrink-0">
                        {m.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame className="h-2.5 w-2.5 text-amber-500" />
                    <span className="text-[9px] text-muted-foreground font-medium">{m.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {newMembers.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2.5 py-1 px-1 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.avatar}`} />
                  <AvatarFallback className="text-[10px] font-bold">{m.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">{m.name}</span>
                    {m.badge && (
                      <Badge className="text-[8px] h-3.5 px-1 rounded-full font-semibold gradient-primary border-0 shrink-0">
                        {m.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">הצטרף {m.joined}</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary font-semibold cursor-pointer hover:underline shrink-0">
                  עקוב
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ask AI quick action */}
      <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-7 w-7 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Bot className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-bold">שאל את סוכן ה-AI</p>
            <p className="text-[10px] text-muted-foreground">זמין 24/7 לשאלות</p>
          </div>
        </div>
        <div className="bg-card/60 rounded-xl px-3 py-2 text-xs text-muted-foreground border border-border/40 flex items-center gap-2 cursor-pointer hover:bg-card transition-colors group mb-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
          <span className="text-muted-foreground">שאל שאלה על התוכן באתר</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["איזה קלטות כדאי לי לראות?"].map((q) => (
            <button
              key={q}
              className="text-[10px] font-medium text-primary/80 bg-primary/8 hover:bg-primary/15 px-2 py-0.5 rounded-full border border-primary/15 cursor-pointer transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>


    </div>
  );
}
