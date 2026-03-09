'use client';

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Users, Bell, BellOff, MessageCircle, Globe, Lock,
  Heart, Share2, Pin, MoreHorizontal, Image, Link as LinkIcon, Bookmark, Crown,
  X, Send, ImagePlus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { groups, groupPosts } from "@/data/groups";
import { toast } from "sonner";

type Post = {
  id: number;
  author: string;
  avatar: string;
  role: string | null;
  time: string;
  pinned: boolean;
  content: string;
  likes: number;
  comments: number;
  image?: string;
};

export default function GroupDetail() {
  const { groupId } = useParams() as { groupId: string };
  const group = groups.find((g) => g.id === groupId);
  const initialPosts = groupPosts[groupId || ""] || [];
  const [joined, setJoined] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>(initialPosts);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-muted-foreground">הקבוצה לא נמצאה</p>
        <Link href="/groups" className="text-primary underline mt-2 block">חזרה לקבוצות</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back link */}
      <Link href="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
        <ArrowRight className="h-4 w-4" /> חזרה לכל הקבוצות
      </Link>

      {/* Hero Cover */}
      <div className="relative rounded-2xl overflow-hidden card-shadow border border-border/50">
        <img src={group.cover} alt={group.name} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-4 right-5 left-5">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] mb-2">
                {group.type === "private" ? <><Lock className="h-3 w-3 ml-1" /> פרטית</> : <><Globe className="h-3 w-3 ml-1" /> ציבורית</>}
              </Badge>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{group.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.members} חברים</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {group.posts} פוסטים</span>
              </div>
            </div>
            <Button
              size="sm"
              variant={joined ? "outline" : "default"}
              className={`rounded-full text-xs h-9 px-5 ${joined ? "bg-background/80 backdrop-blur-sm border-white/30 text-white hover:bg-background/60" : "gradient-primary shadow-lg"}`}
              onClick={() => setJoined(!joined)}
            >
              {joined ? <><BellOff className="h-3.5 w-3.5 ml-1" /> בטל התראות</> : <><Bell className="h-3.5 w-3.5 ml-1" /> הצטרפות לקבוצה</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Group info card: description + leader */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 space-y-4">
        <div>
          <h2 className="font-bold text-sm mb-1.5">אודות הקבוצה</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{group.longDescription}</p>
        </div>
        <div className="border-t border-border/40 pt-4">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-primary" /> מוביל/ת הקבוצה
          </h2>
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${group.leader.avatar}`} />
              <AvatarFallback>{group.leader.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm">{group.leader.name}</p>
              <p className="text-xs text-muted-foreground">{group.leader.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
        {!composerOpen ? (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
                <AvatarFallback>אני</AvatarFallback>
              </Avatar>
              <button
                onClick={() => setComposerOpen(true)}
                className="flex-1 text-right px-4 py-2.5 rounded-full bg-secondary/60 text-muted-foreground text-sm hover:bg-secondary transition-colors"
              >
                שתפו משהו בקבוצה...
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-xs rounded-xl" onClick={() => { setComposerOpen(true); setTimeout(() => fileInputRef.current?.click(), 100); }}>
                <Image className="h-4 w-4 text-success" /> תמונה
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 text-xs rounded-xl" onClick={() => setComposerOpen(true)}>
                <LinkIcon className="h-4 w-4 text-info" /> קישור
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 mt-1">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
                <AvatarFallback>אני</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Textarea
                  autoFocus
                  placeholder="מה תרצו לשתף עם הקבוצה?"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="min-h-[80px] bg-secondary/40 border-0 resize-none text-sm rounded-xl focus-visible:ring-primary/30"
                />
              </div>
            </div>

            {/* Image preview */}
            {previewImage && (
              <div className="relative mr-[52px]">
                <img src={previewImage} alt="תצוגה מקדימה" className="w-full max-h-64 object-cover rounded-xl border border-border/50" />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 left-2 p-1 rounded-full bg-foreground/60 text-background hover:bg-foreground/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
            />

            <div className="flex items-center justify-between mr-[52px]">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs rounded-xl h-8" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 text-success" /> תמונה
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs rounded-xl h-8 text-muted-foreground" onClick={() => { setComposerOpen(false); setNewPostText(""); setPreviewImage(null); }}>
                  ביטול
                </Button>
                <Button
                  size="sm"
                  disabled={!newPostText.trim()}
                  className="rounded-full text-xs h-8 px-5 gradient-primary shadow-md gap-1.5"
                  onClick={() => {
                    const newPost: Post = {
                      id: Date.now(),
                      author: "אני",
                      avatar: "you",
                      role: null,
                      time: "עכשיו",
                      pinned: false,
                      content: newPostText.trim(),
                      likes: 0,
                      comments: 0,
                      image: previewImage || undefined,
                    };
                    setAllPosts((prev) => [newPost, ...prev]);
                    setNewPostText("");
                    setPreviewImage(null);
                    setComposerOpen(false);
                    toast.success("הפוסט פורסם! 🎉", { description: "הפוסט שלך פורסם בהצלחה בקבוצה" });
                  }}
                >
                  <Send className="h-3.5 w-3.5" /> פרסום
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sorting */}
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" className="rounded-full text-xs font-medium h-8">חדשים</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium text-muted-foreground h-8">הכי רלוונטי</Button>
      </div>

      {/* Posts */}
      {allPosts.map((post) => (
        <article
          key={post.id}
          className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden"
        >
          {post.pinned && (
            <div className="px-4 py-1.5 bg-accent/60 flex items-center gap-1.5 text-xs text-accent-foreground font-medium">
              <Pin className="h-3 w-3" /> פוסט נעוץ
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.avatar}`} />
                <AvatarFallback>{post.author[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{post.author}</span>
                  {post.role && (
                    <Badge className="text-[10px] h-5 gradient-primary border-0 font-bold">{post.role}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">· {post.time}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                {post.image && (
                  <img src={post.image} alt="תמונה מצורפת" className="mt-3 w-full max-h-80 object-cover rounded-xl border border-border/30" />
                )}
              </div>
              <button className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-4 pt-3 border-t">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                <Heart className="h-4 w-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                <MessageCircle className="h-4 w-4" /> {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                <Share2 className="h-4 w-4" /> שיתוף
              </button>
              <button className="mr-auto flex items-center text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-xl hover:bg-accent">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
