'use client';

import { Shield, Users, Eye, Heart } from "lucide-react";
import { club } from "@/config/club";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatCard from "@/components/admin/StatCard";
import FilterableStatCard from "@/components/admin/FilterableStatCard";
import UserActivityTable from "@/components/admin/UserActivityTable";
import InactiveAlerts from "@/components/admin/InactiveAlerts";
import ActivityCharts from "@/components/admin/ActivityCharts";
import ContentStats from "@/components/admin/ContentStats";
import RevenueSection from "@/components/admin/RevenueSection";
import MembershipCards from "@/components/admin/MembershipCards";
import { motion } from "framer-motion";

const snapshotStats = [
  { title: "סה״כ חברים", value: "5,247", change: "+127 החודש", trend: "up" as const, icon: Users },
];

const activeUsersStatData = {
  title: "משתמשים פעילים",
  icon: Eye,
  periodData: {
    day: { value: "1,240", change: "+5.2% מאתמול", trend: "up" as const },
    week: { value: "3,812", change: "+8.3% מהשבוע שעבר", trend: "up" as const },
    month: { value: "4,650", change: "+11% מהחודש שעבר", trend: "up" as const },
    year: { value: "5,100", change: "+24% מהשנה שעברה", trend: "up" as const },
  },
};

const invitesStatData = {
  title: "הזמנות חברים",
  icon: Heart,
  periodData: {
    day: { value: "7", change: "+2 מאתמול", trend: "up" as const },
    week: { value: "34", change: "+21% מהשבוע שעבר", trend: "up" as const },
    month: { value: "89", change: "+34% מהחודש שעבר", trend: "up" as const },
    year: { value: "820", change: "+56% מהשנה שעברה", trend: "up" as const },
  },
};

const topInviters = [
  { name: "שרי רוזנוסר", invites: 23, avatar: "sari" },
  { name: "רון ד.", invites: 18, avatar: "ron" },
  { name: "מאיה רוזן", invites: 15, avatar: "maya" },
  { name: "דוד לוי", invites: 12, avatar: "david" },
  { name: "אלכס ב.", invites: 9, avatar: "alex" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-hero p-6 glow-shadow"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.1),transparent_50%)]" />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">פאנל ניהול</h1>
            <p className="text-primary-foreground/70 text-sm">{`דאשבורד מקיף לניהול מועדון ${club.name}`}</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className="bg-card/60 backdrop-blur-sm border border-border/50 p-1 rounded-xl w-full justify-start gap-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            📊 סקירה כללית
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            🎬 צפייה בתוכן
          </TabsTrigger>
          <TabsTrigger value="revenue" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            💰 הכנסות ושימור
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2">
            👥 חברים
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {snapshotStats.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <StatCard {...s} />
              </motion.div>
            ))}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <FilterableStatCard {...activeUsersStatData} />
            </motion.div>
            <MembershipCards />
          </div>
          <ActivityCharts />
        </TabsContent>

        {/* Tab 2: Content */}
        <TabsContent value="content" className="mt-6">
          <ContentStats />
        </TabsContent>

        {/* Tab 3: Revenue */}
        <TabsContent value="revenue" className="mt-6">
          <RevenueSection />
        </TabsContent>

        {/* Tab 4: Members */}
        <TabsContent value="members" className="space-y-6 mt-6">
          <FilterableStatCard {...invitesStatData} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <UserActivityTable />
            </div>
            <div className="space-y-4">
              <InactiveAlerts />

              {/* Top Inviters */}
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-display font-bold">🏆 Top 5 מזמינים</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">החברים שהזמינו הכי הרבה</p>
                </div>
                <div className="divide-y">
                  {topInviters.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/20 transition-colors">
                      <span className="text-lg font-bold text-muted-foreground/50 w-6 text-center">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{u.name}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">{u.invites} הזמנות</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
