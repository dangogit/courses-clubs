'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Play, Clock, Heart, MessageSquare, Send, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { agents } from "@/data/agents";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  date: string;
  likes: number;
}

const mockComments: Comment[] = [
  { id: 1, author: "שי לי אמנון", avatar: "shai", text: "סוכן מעולה! חסך לי שעות עבודה ביום", date: "לפני 3 ימים", likes: 12 },
  { id: 2, author: "מיכל כהן", avatar: "michal2", text: "איך מחברים אותו ל-CRM שלנו?", date: "לפני 5 ימים", likes: 4 },
  { id: 3, author: "דני ברק", avatar: "dani", text: "עובד מצוין! ממליץ בחום", date: "לפני שבוע", likes: 7 },
];

export default function AgentDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const agent = agents.find(a => a.id === id);

  const AgentIcon = agent?.icon;

  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());

  if (!agent || !AgentIcon) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">הסוכן לא נמצא</p>
        <Button variant="link" onClick={() => router.push("/ai-agents")}>חזרה לסוכני AI</Button>
      </div>
    );
  }

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      {
        id: Date.now(),
        author: "לי ברקוביץ",
        avatar: "iti",
        text: newComment.trim(),
        date: "עכשיו",
        likes: 0,
      },
      ...prev,
    ]);
    setNewComment("");
  };

  const toggleLike = (commentId: number) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
        <Link href="/ai-agents" className="hover:text-primary transition-colors">סוכני AI</Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        <span className="text-foreground font-medium truncate max-w-[250px]">{agent.name}</span>
      </nav>

      {/* Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center shadow-lg`}>
          <AgentIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold leading-tight">{agent.name}</h1>
          <p className="text-xs text-muted-foreground">{agent.category}</p>
        </div>
      </div>

      {/* Video Player */}
      <div className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${agent.gradient} relative flex items-center justify-center overflow-hidden mb-6 group cursor-pointer`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
        <div className="relative h-20 w-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
          <Play className="h-10 w-10 text-primary-foreground mr-[-3px]" />
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="bg-foreground/60 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1">
            <Clock className="h-3 w-3" /> 07:19
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 mb-6">
        <h2 className="font-bold text-sm mb-3">על הסוכן</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{agent.description}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          סוכן {agent.name} הוא כלי חכם שעוזר לכם לייעל את תהליכי העבודה שלכם. הסוכן פועל 24/7, לומד מהאינטראקציות שלכם ומשתפר עם הזמן.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            `ביצוע משימות אוטומטיות בתחום ${agent.category}`,
            "התאמה אישית לצרכים העסקיים שלכם",
            "עבודה רציפה ללא הפסקה",
            "למידה והשתפרות מתמדת",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
              <span className="text-primary font-bold mt-px">+</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Related Links */}
      <div className="bg-accent/30 rounded-2xl p-5 mb-6 border border-border/50">
        <h3 className="font-bold text-sm mb-3">קישורים וחומרים</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="#" className="text-primary hover:underline flex items-center gap-1">
              לחצו כאן לקבל את הפרומפט המלא שמודגם בסרטון
            </a>
          </li>
          <li>
            <a href="#" className="text-primary hover:underline flex items-center gap-1">
              לסוכן לחצו — כל הלינקים והשלבים מכאן בפנים
            </a>
          </li>
          <li>
            <a href="#" className="text-primary hover:underline flex items-center gap-1">
              לינק למאמר המלא
            </a>
          </li>
        </ul>
      </div>

      <Separator className="mb-8" />

      {/* Comments Section */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          תגובות ({comments.length})
        </h2>

        {/* New Comment */}
        <div className="flex gap-3 mb-6">
          <Avatar className="h-8 w-8 shrink-0 mt-1">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=iti" />
            <AvatarFallback className="text-[9px]">לב</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex gap-2">
              <input
                placeholder="כתבו תגובה..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
                className="flex-1 text-sm bg-secondary/30 border border-border/40 rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors"
              />
              <Button size="sm" className="rounded-xl gap-1 shrink-0" onClick={addComment} disabled={!newComment.trim()}>
                <Send className="h-3 w-3" /> שלח
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`} />
                <AvatarFallback className="text-[9px]">{c.author[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-secondary/30 rounded-2xl rounded-tr-sm px-3 py-2 border border-border/20">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-xs">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">{c.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.text}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <button
                    onClick={() => toggleLike(c.id)}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer ${
                      likedComments.has(c.id) ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                    }`}
                  >
                    <Heart className={`h-3 w-3 ${likedComments.has(c.id) ? "fill-current" : ""}`} />
                    {c.likes + (likedComments.has(c.id) ? 1 : 0) > 0 && (c.likes + (likedComments.has(c.id) ? 1 : 0))}
                  </button>
                  <button className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <Reply className="h-3 w-3" />
                    הגב
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
