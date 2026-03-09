'use client';

import { AlertTriangle, Clock, UserX, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Alert {
  name: string;
  avatar: string;
  reason: string;
  days: number;
  severity: "warning" | "critical";
}

const alerts: Alert[] = [
  { name: "יובל כ.", avatar: "yuval", reason: "לא התחבר", days: 8, severity: "warning" },
  { name: "נועם ד.", avatar: "noam", reason: "לא התחבר", days: 12, severity: "critical" },
  { name: "ליאור א.", avatar: "lior", reason: "לא התחבר", days: 15, severity: "critical" },
  { name: "עדי ג.", avatar: "adi", reason: "לא השלים קורס", days: 20, severity: "warning" },
  { name: "אורי ת.", avatar: "ori", reason: "לא התחבר", days: 30, severity: "critical" },
];

export default function InactiveAlerts() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <div>
          <h3 className="font-display font-bold">התראות חברים לא פעילים</h3>
          <p className="text-xs text-muted-foreground mt-0.5">חברים שלא היו פעילים לאחרונה</p>
        </div>
        <span className="mr-auto bg-destructive/10 text-destructive text-[10px] font-bold px-2.5 py-1 rounded-full">
          {alerts.length} התראות
        </span>
      </div>
      <div className="divide-y">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/20 transition-colors">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.avatar}`} />
                <AvatarFallback>{a.name[0]}</AvatarFallback>
              </Avatar>
              <span className={`absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-card ${a.severity === "critical" ? "bg-destructive" : "bg-warning"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {a.reason} מזה {a.days} ימים
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1 shrink-0">
              <UserX className="h-3 w-3" /> שלח תזכורת
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
