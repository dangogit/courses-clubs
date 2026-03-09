'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Settings, CreditCard, LogOut, Trophy, PlayCircle, Calendar, Camera, Check, X, Pencil, ImagePlus, ChevronLeft, Zap, Linkedin, Instagram, Globe, Briefcase, Facebook, Mail } from "lucide-react";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import { motion } from "framer-motion";
import type { Easing } from "framer-motion";
import { getLevel } from "@/data/levels";
import { useProfileCompletion, notifyProfileUpdated } from "@/hooks/useProfileCompletion";

const easeOut: Easing = [0, 0, 0.2, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: easeOut },
  }),
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function CountUpValue({ target, suffix }: { target: number; suffix?: string }) {
  const v = useCountUp(target);
  return <>{v.toLocaleString()}{suffix}</>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, saveProfile } = useProfileCompletion();

  const [firstName, setFirstName] = useState("השם");
  const [lastName, setLastName] = useState("שלך");
  const [avatarSrc, setAvatarSrc] = useState(profile.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=you");
  const [editingName, setEditingName] = useState(false);
  const [draftFirst, setDraftFirst] = useState(firstName);
  const [draftLast, setDraftLast] = useState(lastName);
  const [bio, setBio] = useState(profile.bio || "חובב AI ולומד לכל החיים. חבר מועדון מינואר 2026.");
  const [editingBio, setEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState(bio);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);

  // Social / occupation fields
  const [linkedin, setLinkedin] = useState(profile.linkedin || "");
  const [instagram, setInstagram] = useState(profile.instagram || "");
  const [facebook, setFacebook] = useState(profile.facebook || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [occupation, setOccupation] = useState(profile.occupation || "");
  const [editingLinkedin, setEditingLinkedin] = useState(false);
  const [editingInstagram, setEditingInstagram] = useState(false);
  const [editingFacebook, setEditingFacebook] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState(false);

  const userPoints = 750;
  const myLevel = getLevel(userPoints);
  const { watchedCount, totalCount } = useWatchedProgress("recording");
  const joinDate = new Date("2026-01-01");
  const daysInCommunity = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarSrc(url);
      saveProfile({ avatar: url });
      notifyProfileUpdated();
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverSrc(URL.createObjectURL(file));
  };

  const saveName = () => { setFirstName(draftFirst); setLastName(draftLast); setEditingName(false); };
  const cancelEdit = () => { setDraftFirst(firstName); setDraftLast(lastName); setEditingName(false); };

  const saveBioField = () => {
    setBio(draftBio);
    saveProfile({ bio: draftBio });
    notifyProfileUpdated();
    setEditingBio(false);
  };

  const saveField = (key: "linkedin" | "instagram" | "facebook" | "website" | "occupation", value: string) => {
    saveProfile({ [key]: value });
    notifyProfileUpdated();
  };

  const stats = [
    { icon: Trophy, label: "נקודות XP", value: userPoints, sub: `עוד ${myLevel.pointsToNext} לדרגה הבאה`, gradient: "from-amber-500/10 to-orange-500/10", borderColor: "border-amber-500/20", iconBg: "bg-amber-500/20", iconColor: "text-amber-500" },
    { icon: PlayCircle, label: "הקלטות נצפו", value: watchedCount, sub: `מתוך ${totalCount} הקלטות`, gradient: "from-primary/10 to-blue-500/10", borderColor: "border-primary/20", iconBg: "bg-primary/20", iconColor: "text-primary" },
    { icon: Calendar, label: "ימים בקהילה", value: daysInCommunity, sub: "חבר מינואר 2026", gradient: "from-purple-500/10 to-fuchsia-500/10", borderColor: "border-purple-500/20", iconBg: "bg-purple-500/20", iconColor: "text-purple-500" },
  ];

  const inviteStats = { invited: 3, joined: 2, xpEarned: 150 };

  const actions = [
    { icon: Settings, label: "הגדרות חשבון", desc: "ניהול פרופיל והעדפות", onClick: () => router.push("/settings"), destructive: false },
    { icon: CreditCard, label: "תשלום וחיוב", desc: "ניהול מנוי ואמצעי תשלום", onClick: () => router.push("/subscription"), destructive: false },
    { icon: LogOut, label: "התנתקות", desc: "יציאה מהחשבון", onClick: undefined, destructive: true },
  ];

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-5xl mx-auto w-full">
      {/* Hero Card -- full width */}
      <motion.div variants={fadeUp} custom={0} className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
        {/* Cover */}
        <div className="h-36 gradient-hero relative group/cover overflow-hidden">
          {coverSrc ? (
            <img src={coverSrc} alt="תמונת נושא" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsla(0,0%,100%,0.15),transparent_50%)]" />
          )}
          <button
            onClick={() => coverRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="bg-background/90 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-bold shadow-lg">
              <ImagePlus className="h-4 w-4 text-primary" />
              שנה תמונת נושא
            </div>
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </div>

        {/* Avatar + Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="relative group w-fit">
            <div className="rounded-full p-[3px] bg-gradient-to-br from-primary to-[hsl(195,100%,60%)] shadow-lg">
              <div className="h-24 w-24 rounded-full border-[3px] border-card overflow-hidden bg-muted flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="תמונת פרופיל" className="w-full h-full object-cover object-center" />
                ) : (
                  <span className="text-xl font-bold">{firstName[0]}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="mt-3">
            {editingName ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Input value={draftFirst} onChange={(e) => setDraftFirst(e.target.value)} placeholder="שם פרטי" className="w-32 h-9 text-sm" dir="auto" autoFocus />
                <Input value={draftLast} onChange={(e) => setDraftLast(e.target.value)} placeholder="שם משפחה" className="w-32 h-9 text-sm" dir="auto" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveName}><Check className="h-4 w-4 text-primary" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}><X className="h-4 w-4 text-destructive" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">
                  {firstName} {lastName}
                </h1>
                <button
                  onClick={() => { setDraftFirst(firstName); setDraftLast(lastName); setEditingName(true); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/60 hover:bg-secondary px-2 py-1 rounded-lg"
                >
                  <Pencil className="h-3 w-3" />
                  ערוך שם
                </button>
              </div>
            )}
            {editingBio ? (
              <div className="mt-1 flex flex-col gap-1.5">
                <Textarea
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  className="text-sm min-h-[72px]"
                  dir="auto"
                  autoFocus
                  maxLength={160}
                  placeholder="כאן אפשר לכתוב כמה מילים על עצמך"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveBioField}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setDraftBio(bio); setEditingBio(false); }}><X className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                  <span className={`text-[11px] tabular-nums ${draftBio.length > 150 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    {draftBio.length} / 160
                  </span>
                </div>
              </div>
            ) : (
              <p
                className={`text-sm mt-1 cursor-pointer hover:text-foreground transition-colors group/bio flex items-center gap-1 ${bio === "חובב AI ולומד לכל החיים. חבר מועדון מינואר 2026." || !bio ? "text-muted-foreground/50 italic" : "text-muted-foreground"}`}
                onClick={() => { setDraftBio(bio === "חובב AI ולומד לכל החיים. חבר מועדון מינואר 2026." ? "" : bio); setEditingBio(true); }}
              >
                {bio === "חובב AI ולומד לכל החיים. חבר מועדון מינואר 2026." || !bio
                  ? "כאן אפשר לכתוב כמה מילים על עצמך"
                  : bio}
                <Pencil className="inline-block h-3 w-3 mr-1.5 text-primary opacity-0 group-hover/bio:opacity-100 transition-opacity shrink-0" />
              </p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Badge className="gradient-primary border-0 font-bold">✨ חבר פרימיום</Badge>
              <Badge variant="outline" className="border-primary/30 text-primary font-bold text-xs">
                {myLevel.icon} {myLevel.name}
              </Badge>
            </div>

            {myLevel.nextLvl && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">עד {myLevel.nextLvl.icon} {myLevel.nextLvl.name}</span>
                  <span className="font-bold text-primary">{myLevel.pointsToNext} נק׳</span>
                </div>
                <Progress value={myLevel.progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Two-column grid below hero */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Stats */}
          <div className="grid gap-4 grid-cols-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={i + 1}
                className={`bg-gradient-to-br ${s.gradient} backdrop-blur-sm rounded-2xl p-5 card-shadow border ${s.borderColor} text-center hover:scale-[1.03] hover:shadow-md transition-all cursor-default`}
              >
                <div className={`h-10 w-10 rounded-full ${s.iconBg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <p className="text-2xl font-bold"><CountUpValue target={s.value} /></p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Invite Friends */}
          <motion.div variants={fadeUp} custom={4} className="bg-gradient-to-br from-primary/10 to-blue-500/10 backdrop-blur-sm rounded-2xl card-shadow border border-primary/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                הזמנת חברים
              </h3>
              <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary" onClick={() => router.push("/invite")}>
                הזמן עכשיו
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold"><CountUpValue target={inviteStats.invited} /></p>
                <p className="text-[11px] text-muted-foreground">הוזמנו</p>
              </div>
              <div>
                <p className="text-xl font-bold text-primary"><CountUpValue target={inviteStats.joined} /></p>
                <p className="text-[11px] text-muted-foreground">הצטרפו</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-500">+<CountUpValue target={inviteStats.xpEarned} /></p>
                <p className="text-[11px] text-muted-foreground">XP שהרווחת</p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeUp} custom={6} className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
            {actions.map((item, i) => (
              <motion.button
                key={i}
                variants={fadeUp}
                custom={6 + i}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors text-right group ${i > 0 ? "border-t border-border/30" : ""}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.destructive ? "bg-destructive/10 group-hover:bg-destructive/20" : "bg-secondary group-hover:bg-accent"}`}>
                  <item.icon className={`h-5 w-5 transition-colors ${item.destructive ? "text-destructive" : "text-muted-foreground group-hover:text-primary"}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${item.destructive ? "text-destructive" : ""}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronLeft className={`h-4 w-4 group-hover:-translate-x-1 transition-all ${item.destructive ? "text-destructive/50" : "text-muted-foreground group-hover:text-primary"}`} />
              </motion.button>
            ))}
          </motion.div>

        </div>{/* end main col */}

        {/* Sidebar (1/3) */}
        <div className="space-y-4 lg:sticky lg:top-6 self-start">

          {/* Occupation */}
          <motion.div variants={fadeUp} custom={3.8} className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              תחום עיסוק
            </h3>
            {editingOccupation ? (
              <div className="flex items-center gap-2">
                <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="לדוגמה: יזם, שיווק דיגיטלי" className="h-9 text-sm flex-1" dir="auto" autoFocus />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setEditingOccupation(false); saveField("occupation", occupation); }}><Check className="h-4 w-4 text-primary" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setOccupation(profile.occupation || ""); setEditingOccupation(false); }}><X className="h-4 w-4 text-destructive" /></Button>
              </div>
            ) : (
              <div className="flex items-center justify-between group/occ cursor-pointer" onClick={() => setEditingOccupation(true)}>
                <span className="text-sm text-muted-foreground">{occupation || "הוסף תחום עיסוק"}</span>
                <Pencil className="h-3.5 w-3.5 text-primary opacity-0 group-hover/occ:opacity-100 transition-opacity" />
              </div>
            )}
          </motion.div>

          {/* Social Networks */}
          <motion.div variants={fadeUp} custom={3.5} className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              רשתות חברתיות
            </h3>
            <div className="space-y-1">
              {/* Email */}
              <div className="flex items-center gap-3 rounded-xl p-3 bg-muted/30">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-primary">מייל רשום</p>
                  <p className="text-sm text-muted-foreground break-all">user@example.com</p>
                </div>
                <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">לא ניתן לעריכה</span>
              </div>

              {/* LinkedIn */}
              <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${editingLinkedin ? "bg-accent/50" : "hover:bg-accent/30 cursor-pointer"}`}
                   onClick={() => !editingLinkedin && setEditingLinkedin(true)}>
                <div className="h-10 w-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                  <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                </div>
                {editingLinkedin ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-[#0A66C2] mb-1">LinkedIn</p>
                      <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="h-8 text-sm" dir="ltr" autoFocus />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingLinkedin(false); saveField("linkedin", linkedin); }}><Check className="h-4 w-4 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setLinkedin(profile.linkedin || ""); setEditingLinkedin(false); }}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between group/field">
                    <div>
                      <p className="text-[11px] font-semibold text-[#0A66C2]">LinkedIn</p>
                      <p className="text-sm text-muted-foreground">{linkedin || "הוסף פרופיל LinkedIn"}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Instagram */}
              <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${editingInstagram ? "bg-accent/50" : "hover:bg-accent/30 cursor-pointer"}`}
                   onClick={() => !editingInstagram && setEditingInstagram(true)}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 flex items-center justify-center shrink-0">
                  <Instagram className="h-5 w-5 text-[#DD2A7B]" />
                </div>
                {editingInstagram ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-[#DD2A7B] mb-1">Instagram</p>
                      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@שם_משתמש" className="h-8 text-sm" dir="ltr" autoFocus />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingInstagram(false); saveField("instagram", instagram); }}><Check className="h-4 w-4 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setInstagram(profile.instagram || ""); setEditingInstagram(false); }}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between group/field">
                    <div>
                      <p className="text-[11px] font-semibold text-[#DD2A7B]">Instagram</p>
                      <p className="text-sm text-muted-foreground">{instagram || "הוסף פרופיל Instagram"}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Facebook */}
              <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${editingFacebook ? "bg-accent/50" : "hover:bg-accent/30 cursor-pointer"}`}
                   onClick={() => !editingFacebook && setEditingFacebook(true)}>
                <div className="h-10 w-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                </div>
                {editingFacebook ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-[#1877F2] mb-1">Facebook</p>
                      <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/username" className="h-8 text-sm" dir="ltr" autoFocus />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingFacebook(false); saveField("facebook", facebook); }}><Check className="h-4 w-4 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setFacebook(profile.facebook || ""); setEditingFacebook(false); }}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between group/field">
                    <div>
                      <p className="text-[11px] font-semibold text-[#1877F2]">Facebook</p>
                      <p className="text-sm text-muted-foreground">{facebook || "הוסף פרופיל Facebook"}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>

              {/* Website */}
              <div className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${editingWebsite ? "bg-accent/50" : "hover:bg-accent/30 cursor-pointer"}`}
                   onClick={() => !editingWebsite && setEditingWebsite(true)}>
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                {editingWebsite ? (
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1">אתר אישי</p>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://mysite.com" className="h-8 text-sm" dir="ltr" autoFocus />
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setEditingWebsite(false); saveField("website", website); }}><Check className="h-4 w-4 text-primary" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setWebsite(profile.website || ""); setEditingWebsite(false); }}><X className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between group/field">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">אתר אישי</p>
                      <p className="text-sm text-muted-foreground">{website || "הוסף אתר אישי"}</p>
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/field:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>{/* end sidebar */}

      </div>{/* end grid */}
    </motion.div>
  );
}
