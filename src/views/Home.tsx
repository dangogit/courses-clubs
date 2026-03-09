'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target, Play, Bot, Users, Sparkles, Rocket, Wrench,
  Zap, ArrowLeft, BookOpen, Video, Gift, MessageCircle,
  Timer, Calendar as CalIcon, Menu, Palette, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import EditableText from "@/components/admin/EditableText";
import { club } from "@/config/club";

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
  }),
};

const initialGoals = [
  { icon: Sparkles, title: "אני רוצה להתחיל מאפס", desc: "מבוא ל-AI, מושגים בסיסיים וכלים ראשונים", color: "from-primary/20 to-accent", to: "/courses" },
  { icon: Wrench, title: "אני רוצה לייעל את העבודה שלי", desc: "כלים, פרומפטים וטיפים ליומיום", color: "from-accent to-primary/10", to: "/recordings" },
  { icon: Zap, title: "אני רוצה לבנות אוטומציות", desc: "תהליכים אוטומטיים, Make, Zapier ו-AI", color: "from-primary/15 to-accent", to: "/ai-agents" },
  { icon: Palette, title: "אני רוצה ליצור תוכן ביעילות ובקלות", desc: "יצירת וידאו, תמונות, כתיבה שיווקית, מצגות", color: "from-accent to-primary/20", to: "/recordings" },
  { icon: Rocket, title: "תכנים שמתאימים לבעלי עסקים", desc: "סדנאות, פרקטיקות, רעיונות לייעול ושדרוג העסק", color: "from-primary/20 to-accent", to: "/groups/ml" },
  { icon: Briefcase, title: "תכנים לעובדים בארגונים וחברות", desc: "עבודה עם Copilot, שיטות עבודה יעילות, כלים שחובה להכיר", color: "from-accent to-primary/15", to: "/courses" },
];

const nextEvent = {
  title: "מפגש אסטרטגיה חודשי",
  date: "2026-02-23",
  time: "19:30",
  host: "עדן ביבס",
  type: "אסטרטגיה",
};

function useCountdown(targetDate: string, targetTime: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const target = new Date(`${targetDate}T${targetTime}:00`);
    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("עכשיו! 🔴"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff / 3600000) % 24);
      const minutes = Math.floor((diff / 60000) % 60);
      if (days > 0) setTimeLeft(`${days} ימים, ${hours} שעות`);
      else if (hours > 0) setTimeLeft(`${hours} שעות, ${minutes} דקות`);
      else setTimeLeft(`${minutes} דקות`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);
  return timeLeft;
}

export default function Home() {
  const countdown = useCountdown(nextEvent.date, nextEvent.time);
  const [goals, setGoals] = useState(initialGoals);

  const [heroWelcome, setHeroWelcome] = useState("ברוכים הבאים למועדון");
  const [heroSubtitle, setHeroSubtitle] = useState("למדו AI בדרך החכמה — עם הכוונה, תוכן וקהילה");
  const [navTipTitle, setNavTipTitle] = useState("☰ הכירו את התפריט שלכם");
  const [navTipDesc, setNavTipDesc] = useState("לחצו על 3 הפסים למעלה כדי לגלות את כל מה שהמועדון מציע");
  const [goalsTitle, setGoalsTitle] = useState("🎯 התחל מהמטרה שלך");
  const [mentorTitle, setMentorTitle] = useState("🤖 לא בטוח מאיפה להתחיל?");
  const [mentorDesc, setMentorDesc] = useState("המנטור AI ינחה אותך בדיוק לקורס, שיעור או הקלטה שמתאימים למטרה שלך. בלי לחפש, בלי להתבלבל.");
  const [continueTitle, setContinueTitle] = useState("▶️ חזרו למסלול");
  const [communityTitle, setCommunityTitle] = useState("👥 לומדים טוב יותר ביחד");
  const [communityDesc, setCommunityDesc] = useState("שאלו שאלות, קבלו פידבק, ולמדו מחברי הקהילה בזמן שאתם מיישמים את מה שלמדתם.");
  const [inviteTitle, setInviteTitle] = useState("🎁 מכירים מישהו שיאהב את זה?");
  const [inviteDesc, setInviteDesc] = useState("הזמינו חבר למועדון וקבלו 50 XP + 37 מטבעות Brainers. החבר שלכם יקבל גישה מלאה לכל התכנים.");

  const updateGoal = (i: number, key: "title" | "desc", val: string) => {
    setGoals((prev) => prev.map((g, j) => j === i ? { ...g, [key]: val } : g));
  };

  const openAIMentor = () => {
    window.dispatchEvent(new CustomEvent("open-ai-mentor"));
  };

  return (
    <div className="space-y-14 pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero py-4 px-5 md:py-5 md:px-8 text-primary-foreground">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 text-center">
          <EditableText value={heroWelcome} onChange={setHeroWelcome} className="text-sm md:text-base font-medium opacity-80 mb-0.5" as="p" />
          <img src={club.heroLogo} alt={club.name} className="h-20 md:h-28 lg:h-32 mx-auto object-contain" />
        </div>

        <div className="mt-0.5 relative z-10 text-center">
          <EditableText value={heroSubtitle} onChange={setHeroSubtitle} className="text-xs md:text-sm opacity-75 max-w-md mx-auto" as="p" />
        </div>

        <div className="mt-1.5 flex flex-wrap gap-3 relative z-10 justify-center">
          <Button size="sm" className="bg-white text-primary hover:bg-white/90 rounded-full text-xs font-bold px-5 shadow-lg" render={<Link href="/community" />}>
            <Target className="h-3.5 w-3.5 ml-1.5" />להיכנס לקהילה
          </Button>
          <Button size="sm" variant="outline" className="border-white/60 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold px-5 shadow-md" render={<a href={club.whatsappGroup} target="_blank" rel="noopener noreferrer" />}>
            <Play className="h-3.5 w-3.5 ml-1.5" />להצטרף לקבוצת הוואטסאפ
          </Button>
        </div>
      </section>

      {/* NAV TIP */}
      <section>
        <div>
          <Card className="border border-primary/30 bg-gradient-to-br from-accent/60 via-primary/10 to-accent/40 shadow-md overflow-hidden">
            <CardContent className="p-5 md:p-6 flex items-center gap-5">
              <div className="shrink-0 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <Menu className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <EditableText value={navTipTitle} onChange={setNavTipTitle} className="font-bold text-base mb-1" as="h3" />
                <EditableText value={navTipDesc} onChange={setNavTipDesc} className="text-sm text-muted-foreground leading-relaxed mb-3" as="p" />
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: BookOpen, label: "קורסים", to: "/courses" },
                    { icon: Video, label: "הקלטות", to: "/recordings" },
                    { icon: Users, label: "קבוצות", to: "/groups" },
                    { icon: CalIcon, label: "אירועים", to: "/events" },
                    { icon: Bot, label: "סוכני AI", to: "/ai-agents" },
                    { icon: Sparkles, label: "לידרבורד", to: "/leaderboard" },
                  ].map((item, i) => (
                    <Link key={i} href={item.to} className="flex items-center gap-1.5 text-xs font-medium bg-white/60 dark:bg-white/10 px-3 py-1.5 rounded-full shadow-sm hover:bg-primary/10 hover:shadow-md transition-all">
                      <item.icon className="h-3.5 w-3.5 text-primary" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* GOALS */}
      <section id="goals">
        <div className="mb-8">
          <EditableText value={goalsTitle} onChange={setGoalsTitle} className="text-2xl md:text-3xl font-extrabold" as="h2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g, i) => (
            <div key={i}>
              <Link href={g.to}>
                <Card className={`group cursor-pointer border-0 bg-gradient-to-br ${g.color} hover:shadow-lg hover:scale-[1.03] transition-all duration-300`}>
                  <CardContent className="p-6 flex flex-col gap-3">
                    <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
                      <g.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <EditableText value={g.title} onChange={(v) => updateGoal(i, "title", v)} className="text-lg font-bold" as="h3" />
                    <EditableText value={g.desc} onChange={(v) => updateGoal(i, "desc", v)} className="text-sm text-muted-foreground leading-relaxed" as="p" />
                    <span className="text-sm font-semibold text-primary flex items-center gap-1 mt-1 group-hover:gap-2 transition-all">
                      תראה לי את התוכן המתאים <ArrowLeft className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* AI MENTOR */}
      <section>
        <div>
          <Card className="border-0 bg-gradient-to-br from-primary/10 via-accent to-primary/5 overflow-hidden animate-glow-pulse">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0 h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <EditableText value={mentorTitle} onChange={setMentorTitle} className="text-2xl font-bold mb-2" as="h2" />
                <EditableText value={mentorDesc} onChange={setMentorDesc} className="text-muted-foreground leading-relaxed" as="p" />
              </div>
              <Button size="lg" className="rounded-full font-bold px-8 shrink-0" onClick={openAIMentor}>
                <Sparkles className="h-5 w-5 ml-2" />
                תן ל-AI להנחות אותי
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CONTINUE LEARNING */}
      <section id="continue">
        <div className="mb-8">
          <EditableText value={continueTitle} onChange={setContinueTitle} className="text-2xl md:text-3xl font-extrabold" as="h2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Card className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">קורס פעיל</p>
                    <h3 className="font-bold">יסודות AI</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">שיעור 9 מתוך 12</span>
                    <span className="font-semibold text-primary">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <Button className="w-full rounded-full" render={<Link href="/courses" />}>
                  המשך ללמוד
                </Button>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">הקלטה אחרונה</p>
                    <h3 className="font-bold">בניית צ׳אטבוטים חכמים עם Sendpulse</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">צפית ב-15 מתוך 83 דקות</p>
                <Button variant="outline" className="w-full rounded-full" render={<Link href="/recordings" />}>
                  המשך לצפות
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* NEXT EVENT */}
      <section>
        <div>
          <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/40 overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-5">
              <div className="shrink-0 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                <CalIcon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <Badge variant="secondary" className="text-[10px] font-bold">{nextEvent.type}</Badge>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    <Timer className="h-3.5 w-3.5" />
                    <span>{countdown}</span>
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold">{nextEvent.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  מנחה: {nextEvent.host} · {new Date(nextEvent.date).toLocaleDateString("he-IL", { day: "numeric", month: "long" })} · {nextEvent.time}
                </p>
              </div>
              <Button size="lg" className="rounded-full font-bold px-8 shrink-0" render={<Link href="/events" />}>
                לכל האירועים
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* COMMUNITY */}
      <section>
        <div>
          <Card className="border-0 bg-gradient-to-br from-accent/60 to-secondary">
            <CardContent className="p-8 md:p-10 text-center space-y-4">
              <EditableText value={communityTitle} onChange={setCommunityTitle} className="text-2xl md:text-3xl font-bold" as="h2" />
              <EditableText value={communityDesc} onChange={setCommunityDesc} className="text-muted-foreground max-w-lg mx-auto leading-relaxed" as="p" />
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button variant="outline" className="rounded-full font-bold" render={<Link href="/groups" />}>
                  <MessageCircle className="h-4 w-4 ml-2" />שאל שאלה בקבוצה
                </Button>
                <Button variant="ghost" className="rounded-full font-bold" render={<Link href="/community" />}>
                  <Users className="h-4 w-4 ml-2" />גלה דיונים פעילים
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* INVITE */}
      <section>
        <div>
          <Card className="border-0 gradient-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0 h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-right">
                <EditableText value={inviteTitle} onChange={setInviteTitle} className="text-2xl font-bold mb-2" as="h2" />
                <EditableText value={inviteDesc} onChange={setInviteDesc} className="opacity-85 leading-relaxed" as="p" />
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-8 shadow-lg shrink-0" render={<Link href="/invite" />}>
                הזמן חבר וקבל פרס
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
