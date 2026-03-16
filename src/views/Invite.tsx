'use client';

import { Copy, Check, Users, Gift, Star, Crown, Zap, UserCheck, Award, MessageCircle, Share2, Link as LinkIcon } from "lucide-react";
import { club } from "@/config/club";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useInviteLink } from "@/hooks/useInviteLink";
import { useReferralStats, useTopInviters } from "@/hooks/useReferralStats";

export default function InvitePage() {
  const [copied, setCopied] = useState(false);
  const { data: inviteLink, isLoading: linkLoading } = useInviteLink();
  const { data: stats } = useReferralStats();
  const { data: topInviters } = useTopInviters(5);

  const link = inviteLink
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteLink.code}`
    : "";

  const totalReferred = stats?.totalReferred ?? 0;
  const totalXP = stats?.totalXP ?? 0;
  const friends = stats?.friends ?? [];
  const milestoneProgress = Math.min((totalReferred / 25) * 100, 100);

  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!link) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`גיליתי קהילה מטורפת של AI — ${club.name}!\nלמידה, נטוורקינג, וכלים שמשנים את המשחק.\nהצטרפו 👇\n${link}`)}`,
      "_blank"
    );
  };

  const shareEmail = () => {
    if (!link) return;
    window.open(
      `mailto:?subject=${encodeURIComponent(`הצטרפו ל-${club.name}!`)}&body=${encodeURIComponent(`בואו להצטרף לקהילת ${club.name}!\n${link}`)}`,
      "_blank"
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Gift className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">הזמנת חברים</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              שתפו וצברו נקודות, מטבעות ותגי הישג
            </p>
          </div>
        </div>
      </div>

      {/* Share + Link Card */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 p-4 sm:p-5">
        <div className="flex flex-col gap-1.5 mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            קישור הזמנה אישי
          </h2>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            העתק את הקישור האישי שלך או שלח אותו לחברים ב-WhatsApp או באימייל.
          </p>
        </div>

        <div className="flex items-stretch gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={linkLoading ? "טוען..." : link}
              readOnly
              dir="ltr"
              className="bg-secondary/40 border-border/30 text-left font-mono text-xs pr-9 rounded-xl"
            />
          </div>
          <Button
            onClick={copy}
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0"
            aria-label="העתק קישור להזמנה"
            disabled={!link}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          <Button
            onClick={shareWhatsApp}
            className="h-11 rounded-xl gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 font-bold justify-center"
            variant="ghost"
            disabled={!link}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            onClick={shareEmail}
            className="h-11 rounded-xl gap-2 font-bold justify-center"
            variant="outline"
            disabled={!link}
          >
            <Share2 className="h-4 w-4" />
            אימייל
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: UserCheck, label: "הצטרפו", value: totalReferred, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { icon: Star, label: "נקודות XP", value: totalXP, color: "text-primary", bg: "bg-primary/10" },
        ].map((s, i) => (
          <div key={i} className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 card-shadow border border-border/50 text-center">
            <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-lg sm:text-xl font-bold">{s.value}</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rewards + Milestones row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rewards */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 card-shadow border border-border/50">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            פרסים על כל הזמנה
          </h2>
          <div className="space-y-2.5">
            {[
              { icon: Star, value: "50 XP", desc: "לעלייה בדרגות", color: "text-primary", bg: "bg-primary/10" },
              { icon: Crown, value: "בונוס ×5", desc: "100 XP על כל 5 הרשמות", color: "text-purple-600", bg: "bg-purple-500/10" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3 bg-accent/40">
                <div className={`h-9 w-9 rounded-xl ${r.bg} flex items-center justify-center shrink-0`}>
                  <r.icon className={`h-4 w-4 ${r.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm">{r.value}</p>
                  <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 card-shadow border border-border/50">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            הישגים
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground font-medium shrink-0">{totalReferred}/25</span>
            <Progress value={milestoneProgress} className="h-2 flex-1" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { count: 3, title: "מגייס", emoji: "🏅", achieved: totalReferred >= 3 },
              { count: 10, title: "שגריר", emoji: "⭐", achieved: totalReferred >= 10 },
              { count: 25, title: "שגריר זהב", emoji: "👑", achieved: totalReferred >= 25 },
            ].map((m) => (
              <div
                key={m.count}
                className={`rounded-xl p-2.5 sm:p-3 border text-center transition-all ${
                  m.achieved ? "bg-amber-500/10 border-amber-500/30" : "bg-secondary/40 border-border/50 opacity-50"
                }`}
              >
                <span className="text-lg sm:text-xl block mb-0.5">{m.emoji}</span>
                <p className="font-bold text-[11px] sm:text-xs">{m.title}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">{m.count} הצטרפויות</p>
                {m.achieved && (
                  <Badge className="mt-1.5 bg-amber-500/20 text-amber-700 border-amber-500/30 text-[9px]">הושג!</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two columns: Friends + Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referred Friends */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              חברים ({friends.length})
            </h2>
          </div>
          <div className="divide-y divide-border/30 max-h-72 overflow-y-auto scrollbar-thin">
            {friends.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                עוד אין הזמנות — שתפו את הקישור!
              </div>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="flex items-center gap-2.5 px-4 py-3 hover:bg-accent/20 transition-colors">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`} />
                    <AvatarFallback>{(f.display_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{f.display_name ?? "משתמש"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(f.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                    הצטרף
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Inviters Leaderboard */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              מגייסים מובילים
            </h2>
          </div>
          <div className="divide-y divide-border/30">
            {(!topInviters || topInviters.length === 0) ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                היו הראשונים להזמין חברים!
              </div>
            ) : (
              topInviters.map((inv, i) => (
                <div key={inv.user_id} className="flex items-center gap-2.5 px-4 py-3 hover:bg-accent/20 transition-colors">
                  <span className={`w-5 text-xs font-bold text-center shrink-0 ${i < 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={inv.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inv.user_id}`} />
                    <AvatarFallback>{(inv.display_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs flex-1 min-w-0 truncate">{inv.display_name ?? "משתמש"}</span>
                  <span className="text-xs font-bold text-primary shrink-0">{inv.referral_count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
