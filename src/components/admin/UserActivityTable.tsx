'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  name: string;
  avatar: string;
  email: string;
  lastActive: string;
  posts: number;
  courses: number;
  xp: number;
  rank: string;
  status: "פעיל" | "לא פעיל" | "חדש";
}

const users: UserRow[] = [
  { name: "שרי רוזנוסר", avatar: "sari", email: "sari@email.com", lastActive: "לפני 2 שעות", posts: 34, courses: 3, xp: 1450, rank: "מנטור 🎓", status: "פעיל" },
  { name: "דוד לוי", avatar: "david", email: "david@email.com", lastActive: "לפני 5 שעות", posts: 21, courses: 2, xp: 680, rank: "מומחה מוכר 🧠", status: "פעיל" },
  { name: "מאיה רוזן", avatar: "maya", email: "maya@email.com", lastActive: "היום", posts: 56, courses: 5, xp: 2100, rank: "מאסטר 💎", status: "פעיל" },
  { name: "אלכס ב.", avatar: "alex", email: "alex@email.com", lastActive: "לפני 3 ימים", posts: 8, courses: 1, xp: 280, rank: "כוכב עולה ⭐", status: "פעיל" },
  { name: "יובל כ.", avatar: "yuval", email: "yuval@email.com", lastActive: "לפני 8 ימים", posts: 2, courses: 0, xp: 60, rank: "חבר פעיל 💪", status: "לא פעיל" },
  { name: "נועם ד.", avatar: "noam", email: "noam@email.com", lastActive: "לפני 12 ימים", posts: 0, courses: 0, xp: 15, rank: "חבר חדש 🌱", status: "לא פעיל" },
  { name: "רון מ.", avatar: "ron", email: "ron@email.com", lastActive: "לפני שעה", posts: 15, courses: 4, xp: 950, rank: "אלוף קהילה 🏆", status: "פעיל" },
  { name: "תמר ש.", avatar: "tamar", email: "tamar@email.com", lastActive: "היום", posts: 0, courses: 1, xp: 30, rank: "חבר חדש 🌱", status: "חדש" },
];

const statusStyles: Record<string, string> = {
  "פעיל": "bg-success/10 text-success border-success/20",
  "לא פעיל": "bg-destructive/10 text-destructive border-destructive/20",
  "חדש": "bg-info/10 text-info border-info/20",
};

export default function UserActivityTable() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h3 className="font-display font-bold">פעילות משתמשים</h3>
        <p className="text-xs text-muted-foreground mt-0.5">סקירת הפעילות של חברי המועדון</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-secondary/30">
              <th className="text-right text-xs font-bold text-muted-foreground px-5 py-3">משתמש</th>
              <th className="text-right text-xs font-bold text-muted-foreground px-4 py-3">דרגה</th>
              <th className="text-center text-xs font-bold text-muted-foreground px-4 py-3">XP</th>
              <th className="text-right text-xs font-bold text-muted-foreground px-4 py-3">פעילות אחרונה</th>
              <th className="text-center text-xs font-bold text-muted-foreground px-4 py-3">פוסטים</th>
              <th className="text-center text-xs font-bold text-muted-foreground px-4 py-3">קורסים</th>
              <th className="text-center text-xs font-bold text-muted-foreground px-4 py-3">סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-accent/20 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.avatar}`} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground" dir="ltr">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-medium">{u.rank}</td>
                <td className="px-4 py-3 text-sm text-center font-bold text-primary">{u.xp.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{u.lastActive}</td>
                <td className="px-4 py-3 text-sm text-center font-medium">{u.posts}</td>
                <td className="px-4 py-3 text-sm text-center font-medium">{u.courses}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className={`text-[10px] font-bold ${statusStyles[u.status]}`}>
                    {u.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
