'use client';

import { DollarSign, TrendingUp, TrendingDown, UserMinus, UserCheck, Percent, Calculator } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

const TOTAL_MEMBERS = 5247;
const PRICE = 49;
const MRR = TOTAL_MEMBERS * PRICE;
const CHURN_RATE = 4.2;
const RETENTION = 78;
const ARPU = PRICE;
const AVG_LIFETIME_MONTHS = 100 / CHURN_RATE;
const LTV = Math.round(ARPU * AVG_LIFETIME_MONTHS);
const RETENTION_OFFER_ACCEPTANCE = 62;

const mrrTrend = [
  { month: "ספט", mrr: 156800 },
  { month: "אוק", mrr: 176400 },
  { month: "נוב", mrr: 200900 },
  { month: "דצמ", mrr: 220500 },
  { month: "ינו", mrr: 235200 },
  { month: "פבר", mrr: MRR },
];

const churnReasons = [
  { reason: "חוסר זמן", count: 38 },
  { reason: "המחיר גבוה", count: 27 },
  { reason: "לא מספיק ערך", count: 18 },
  { reason: "סיבה אחרת", count: 12 },
];

const memberStatus = [
  { name: "פעילים", value: 3812, fill: "hsl(142, 71%, 45%)" },
  { name: "חדשים", value: 487, fill: "hsl(195, 100%, 42%)" },
  { name: "לא פעילים", value: 948, fill: "hsl(0, 84%, 60%)" },
];

const stats = [
  { title: "הכנסה חודשית (MRR)", value: `₪${(MRR).toLocaleString()}`, icon: DollarSign, change: "+12.3% מהחודש שעבר", trend: "up" as const },
  { title: "שיעור ביטולים (Churn)", value: `${CHURN_RATE}%`, icon: UserMinus, change: "-0.3% מהחודש שעבר", trend: "down" as const },
  { title: "שיעור שימור", value: `${RETENTION}%`, icon: UserCheck, change: "+2.1% מהחודש שעבר", trend: "up" as const },
  { title: "ARPU", value: `₪${ARPU}`, icon: Calculator, change: "ללא שינוי", trend: "up" as const },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

export default function RevenueSection() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.title} custom={i} variants={fadeUp} initial="hidden" animate="visible"
            className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.title}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${s.trend === "up" ? "text-success" : "text-destructive"}`}>
                  {s.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {s.change}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MRR Trend + Member Status Pie */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
          <h3 className="font-display font-bold mb-1">מגמת MRR</h3>
          <p className="text-xs text-muted-foreground mb-4">הכנסה חודשית חוזרת ב-6 חודשים אחרונים</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrTrend}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 90%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(225, 14%, 90%)", boxShadow: "0 4px 16px -2px rgba(0,0,0,0.06)", fontSize: "12px", direction: "rtl" }}
                formatter={(v: number) => [`₪${v.toLocaleString()}`, "MRR"]} />
              <Area type="monotone" dataKey="mrr" stroke="hsl(142, 71%, 45%)" strokeWidth={2.5} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
          <h3 className="font-display font-bold mb-1">חלוקת חברים לפי סטטוס</h3>
          <p className="text-xs text-muted-foreground mb-4">פעילים, חדשים ולא פעילים</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={memberStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {memberStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(225, 14%, 90%)", fontSize: "12px", direction: "rtl" }}
                formatter={(v: number) => [v.toLocaleString(), "חברים"]} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Churn Reasons + Extra Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50">
          <h3 className="font-display font-bold mb-1">סיבות ביטול</h3>
          <p className="text-xs text-muted-foreground mb-4">התפלגות סיבות ביטול מנויים</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={churnReasons} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 14%, 90%)" vertical={false} />
              <XAxis dataKey="reason" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(225, 14%, 90%)", fontSize: "12px", direction: "rtl" }}
                formatter={(v: number) => [v, "ביטולים"]} />
              <Bar dataKey="count" name="ביטולים" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible"
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 space-y-5">
          <h3 className="font-display font-bold">מדדי שימור נוספים</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">LTV משוער (חיי לקוח)</p>
                <p className="text-xs text-muted-foreground">ערך ממוצע לכל חבר לאורך חייו</p>
              </div>
              <p className="text-xl font-bold text-primary">₪{LTV.toLocaleString()}</p>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">קבלת הצעת שימור</p>
                <p className="text-xs text-muted-foreground">אחוז מי שקיבל הצעת "1 ש״ח לחודש"</p>
              </div>
              <p className="text-xl font-bold text-success">{RETENTION_OFFER_ACCEPTANCE}%</p>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">חיי לקוח ממוצע</p>
                <p className="text-xs text-muted-foreground">כמה חודשים חבר נשאר בממוצע</p>
              </div>
              <p className="text-xl font-bold">{AVG_LIFETIME_MONTHS.toFixed(1)} חודשים</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
