'use client';

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  ChevronRight, Settings, Sun, Moon, Bell, Eye, Users,
  Mail, Lock, Calendar, BookOpen, Video,
  MessageSquare, UserPlus
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";


const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
  }),
};

type NotifKey = "eventDay" | "eventHour" | "courseReminder" | "courseNew" | "newRecording" |
  "postReply" | "mention" | "groupPost" | "inviteJoined";

type PrivacyKey = "publicProfile" | "showOnlineStatus";

const categoryColors: Record<string, { bg: string; text: string; iconBg: string }> = {
  "אירועים ומפגשים": { bg: "bg-warning/10", text: "text-warning", iconBg: "bg-warning/15" },
  "קורסים": { bg: "bg-info/10", text: "text-info", iconBg: "bg-info/15" },
  "הקלטות": { bg: "bg-destructive/10", text: "text-destructive", iconBg: "bg-destructive/15" },
  "קהילה": { bg: "bg-success/10", text: "text-success", iconBg: "bg-success/15" },
  "הזמנת חברים": { bg: "bg-primary/10", text: "text-primary", iconBg: "bg-primary/15" },
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const saved = useCallback(() => {
    toast.success("ההגדרות נשמרו בהצלחה");
  }, []);

  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");

  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    eventDay: true, eventHour: true, courseReminder: true, courseNew: true,
    newRecording: true, postReply: true, mention: true, groupPost: false,
    inviteJoined: true,
  });

  const [privacy, setPrivacy] = useState<Record<PrivacyKey, boolean>>({
    publicProfile: true, showOnlineStatus: true,
  });
  const [groupNotifs, setGroupNotifs] = useState<Record<string, boolean>>({
    community: true, "all-groups": true,
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleNotif = (key: NotifKey) => { setNotifs(p => ({ ...p, [key]: !p[key] })); saved(); };
  const togglePrivacy = (key: PrivacyKey) => { setPrivacy(p => ({ ...p, [key]: !p[key] })); saved(); };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("יש למלא את כל השדות");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("הסיסמאות לא תואמות");
      return;
    }
    toast.success("הסיסמה שונתה בהצלחה");
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };


  const notifSections: { title: string; icon: React.ElementType; items: { key: NotifKey; label: string }[] }[] = [
    { title: "אירועים ומפגשים", icon: Calendar, items: [
      { key: "eventDay", label: "התראה יום לפני אירוע" },
      { key: "eventHour", label: "התראה שעה לפני אירוע" },
    ]},
    { title: "קורסים", icon: BookOpen, items: [
      { key: "courseReminder", label: "תזכורת להמשיך קורס שהתחלתי" },
      { key: "courseNew", label: "קורס חדש נוסף לפלטפורמה" },
    ]},
    { title: "הקלטות", icon: Video, items: [
      { key: "newRecording", label: "הקלטה חדשה עלתה" },
    ]},
    { title: "קהילה", icon: MessageSquare, items: [
      { key: "postReply", label: "תגובה על הפוסט שלי" },
      { key: "mention", label: "אזכור שלי בדיון" },
      { key: "groupPost", label: "פוסט חדש בקבוצה שהצטרפתי" },
    ]},
    { title: "הזמנת חברים", icon: UserPlus, items: [
      { key: "inviteJoined", label: "חבר שהזמנתי הצטרף" },
    ]},
  ];


  const SectionCard = ({ children, index }: { children: React.ReactNode; index: number }) => (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="glass-card rounded-2xl p-5 card-shadow transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:scale-[1.01] hover:border-primary/20"
    >
      {children}
    </motion.div>
  );

  const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
        <Icon className="h-4.5 w-4.5 text-primary-foreground" />
      </div>
      <h2 className="font-display text-base font-bold">{title}</h2>
    </div>
  );

  const SettingRow = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/30 transition-colors duration-200">
      <div className="flex-1 min-w-0 ml-3">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );

  const GlowSwitch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) => (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={checked ? "shadow-[0_0_8px_-2px_hsl(var(--primary)/0.4)]" : ""}
    />
  );

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="gradient-hero rounded-2xl p-5 flex items-center gap-4 shadow-lg"
      >
        <Button variant="ghost" size="icon" className="rounded-xl text-white/80 hover:text-white hover:bg-white/10" onClick={() => router.push("/profile")}>
          <ChevronRight className="h-5 w-5" />
        </Button>
        <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-white">הגדרות חשבון</h1>
          <p className="text-xs text-white/70">ניהול פרופיל, התראות והעדפות</p>
        </div>
      </motion.div>

      {/* Account */}
      <SectionCard index={1}>
        <SectionTitle icon={Mail} title="חשבון" />
        <div className="space-y-1">
          <SettingRow label="כתובת אימייל" description="user@example.com">
            <Badge variant="secondary" className="text-[10px] glass-card border-border/30">לא ניתן לעריכה</Badge>
          </SettingRow>
          <SettingRow label="שינוי סיסמה">
            <Button variant="outline" size="sm" className="h-8 text-xs hover:border-primary/40 hover:bg-primary/5 transition-all duration-200" onClick={() => setPasswordOpen(true)}>
              <Lock className="h-3.5 w-3.5 ml-1.5" />
              שנה סיסמה
            </Button>
          </SettingRow>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard index={2}>
        <SectionTitle icon={Bell} title="התראות" />
        <div className="space-y-5">
          {notifSections.map((section) => {
            const colors = categoryColors[section.title] || { bg: "bg-muted", text: "text-muted-foreground", iconBg: "bg-muted" };
            return (
              <div key={section.title}>
                <div className={`inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg ${colors.bg}`}>
                  <section.icon className={`h-3.5 w-3.5 ${colors.text}`} />
                  <span className={`text-xs font-bold ${colors.text}`}>{section.title}</span>
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SettingRow key={item.key} label={item.label}>
                      <GlowSwitch checked={notifs[item.key]} onCheckedChange={() => toggleNotif(item.key)} />
                    </SettingRow>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Privacy */}
      <SectionCard index={3}>
        <SectionTitle icon={Eye} title="פרטיות" />
        <div className="space-y-1">
          <SettingRow label="פרופיל ציבורי" description="אפשר לאחרים לראות את הפרופיל שלי">
            <GlowSwitch checked={privacy.publicProfile} onCheckedChange={() => togglePrivacy("publicProfile")} />
          </SettingRow>
          <SettingRow label="סטטוס אונליין" description="הצג שאני מחובר כרגע">
            <GlowSwitch checked={privacy.showOnlineStatus} onCheckedChange={() => togglePrivacy("showOnlineStatus")} />
          </SettingRow>
        </div>
      </SectionCard>

      {/* Community */}
      <SectionCard index={4}>
        <SectionTitle icon={Users} title="קהילה וקבוצות" />
        <p className="text-xs text-muted-foreground mb-3">בחר מאיפה לקבל התראות על פוסטים חדשים ממנהלים</p>
        <div className="space-y-1">
          <SettingRow label="דף הקהילה" description="התראה כשמנהל מפרסם פוסט בפיד הראשי">
            <GlowSwitch
              checked={groupNotifs["community"] ?? true}
              onCheckedChange={() => {
                setGroupNotifs(p => ({ ...p, community: !(p["community"] ?? true) }));
                saved();
              }}
            />
          </SettingRow>
          <SettingRow label="קבוצות" description="התראה כשמנהלי הקבוצות מפרסמים פוסט חדש">
            <GlowSwitch
              checked={groupNotifs["all-groups"] ?? true}
              onCheckedChange={() => {
                setGroupNotifs(p => ({ ...p, "all-groups": !(p["all-groups"] ?? true) }));
                saved();
              }}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <div className="h-8" />

      {/* Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              שינוי סיסמה
            </DialogTitle>
            <DialogDescription>הזן את הסיסמה הנוכחית והסיסמה החדשה</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm">סיסמה נוכחית</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">סיסמה חדשה</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">אימות סיסמה חדשה</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>ביטול</Button>
            <Button onClick={handlePasswordChange} className="gradient-primary text-primary-foreground">שמור סיסמה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
