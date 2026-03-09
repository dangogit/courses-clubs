'use client';

import { Users, TrendingUp, TrendingDown, Eye, MessageSquare, BookOpen, AlertTriangle, Clock } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}

function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 hover:elevated-shadow transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend === "up" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change}
          </div>
        </div>
      <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
