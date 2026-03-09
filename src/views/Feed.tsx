'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Image,
  Link as LinkIcon,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Bookmark,
  HelpCircle,
  Trophy,
  Megaphone,
  Code2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WelcomeBanner from "@/components/WelcomeBanner";
import VideoRecommendations from "@/components/VideoRecommendations";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostCard, { type PostData } from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import LeftSidebar from "@/components/LeftSidebar";

const brainersCharacter = "/assets/brainers-character.jpeg";
const brainersLogo = "/assets/brainers-hero-logo.png";
const monthlySchedule = "/assets/monthly-schedule.jpeg";

// ─── Posts data ───────────────────────────────────────────────────────────────

const posts: PostData[] = [
  {
    id: 1,
    author: "לי ברקוביץ",
    avatar: "iti",
    role: "מנהל",
    time: "לפני יום",
    pinned: true,
    postType: "announcement",
    content:
      "חברים וחברות יקרים שלום לכל המצטרפים החדשים והחדשות! 🎉\nאני חייב לשתף אתכם באופן אישי שזה סופר מרגש אותי לראות משהו שעבדתי עליו כל כך הרבה זמן קורם עור וגידים והופך למציאות.\nבימים הקרובים יהיו פה מספר עדכונים חשובים לגבי המועדון + וידאו הסבר איך להשתמש בפלטפורמה.",
    likes: 42,
    comments: 12,
    aiSummary: "הפלטפורמה הושקה. בקרוב יגיעו עדכוני מוצר וסרטון הסבר. מייסד מתרגש ומודה לחברים.",
    tags: ["עדכון", "קהילה", "פלטפורמה"],
    reactions: { love: 28, clap: 12, fire: 8 },
    images: [brainersCharacter, brainersLogo, monthlySchedule],
  },
  {
    id: 2,
    author: "שרי רוזנוסר",
    avatar: "sari",
    role: null,
    time: "לפני 3 שעות",
    pinned: false,
    postType: "achievement",
    content:
      "סיימתי עכשיו את הקורס של Prompt Engineering — פשוט מדהים! למדתי כל כך הרבה טכניקות שלא הכרתי. ממליצה בחום לכולם 🙌",
    likes: 18,
    comments: 5,
    aiSummary: "שרי השלימה קורס Prompt Engineering ומדרגת אותו גבוה. ממליצה לשאר החברים.",
    tags: ["Prompt Engineering", "קורסים"],
    reactions: { clap: 14, love: 8, fire: 5 },
  },
  {
    id: 3,
    author: "דוד לוי",
    avatar: "david",
    role: null,
    time: "לפני 5 שעות",
    pinned: false,
    postType: "question",
    content:
      "מישהו מכיר ויש לו ניסיון עם אינטגרציה של צ׳אטבוטים עם Sendpulse?\nמחפש שיטות עבודה מומלצות וטיפים.\nכל עזרה תתקבל בברכה!",
    likes: 7,
    comments: 8,
    aiSummary: "שאלה טכנית על חיבור צ׳אטבוט ל-Sendpulse. מחפש best practices ממי שעשה זאת.",
    tags: ["Sendpulse", "אינטגרציה", "צ׳אטבוטים"],
    reactions: { idea: 5, question: 4 },
  },
  {
    id: 4,
    author: "מאיה רוזן",
    avatar: "maya",
    role: "מנחה",
    time: "לפני יום",
    pinned: false,
    postType: "share",
    content:
      "תזכורת: אל תשכחו לעדכן את תמונת הפרופיל שלכם ולכתוב Intro קצר! זה עוזר לקהילה להכיר אתכם יותר טוב 😊",
    likes: 31,
    comments: 3,
    tags: ["טיפ", "קהילה"],
    reactions: { clap: 22, love: 10, fire: 4 },
  },
];

// ─── Trending topics (derived from post tags) ────────────────────────────────

function deriveTrendingTopics(postList: PostData[]) {
  const tagCounts: Record<string, number> = {};
  postList.forEach((p) => {
    p.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ label: tag, count, hot: count >= 3 }));
}

// ─── Post type filters ────────────────────────────────────────────────────────

const postTypeFilters = [
  { id: "all", label: "הכל", icon: null },
  { id: "question", label: "שאלות", icon: HelpCircle },
  { id: "achievement", label: "הישגים", icon: Trophy },
  { id: "project", label: "פרויקטים", icon: Code2 },
  { id: "announcement", label: "הודעות", icon: Megaphone },
  { id: "share", label: "שיתופים", icon: Share2 },
];

const sortOptions = [
  { id: "new", label: "חדשים", icon: Clock },
  { id: "recent", label: "פעילות אחרונה", icon: TrendingUp },
  { id: "saved", label: "נשמרו", icon: Bookmark },
];

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [activeSort, setActiveSort] = useState("new");
  const [activePostType, setActivePostType] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Set<number>>(new Set());

  const toggleSavePost = (postId: number) => {
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const trendingTopics = deriveTrendingTopics(posts);

  const filteredPosts = posts.filter((p) => {
    if (activeSort === "saved" && !savedPostIds.has(p.id)) return false;
    if (activePostType !== "all" && p.postType !== activePostType) return false;
    if (activeTag && !(p.tags ?? []).includes(activeTag)) return false;
    return true;
  });

  return (
    <div className="flex gap-5 w-full max-w-6xl mx-auto">


      {/* Main content fills remaining space */}
      <div className="flex-1 min-w-0 space-y-4">
        <WelcomeBanner />

        <VideoRecommendations />

        {/* Create Post */}
        <div
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 card-shadow border border-border/50 cursor-pointer hover:border-primary/30 transition-all duration-200 group"
          onClick={() => setCreatePostOpen(true)}
        >
          <div className="flex items-center gap-3 flex-row-reverse">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-primary/10 shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
              <AvatarFallback>אני</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-secondary/40 text-muted-foreground text-sm group-hover:bg-secondary/60 transition-colors">
              שתף שאלה, פרויקט, הישג או תובנה עם הקהילה...
            </div>
          </div>
          <div className="flex items-center mt-3 pt-3 border-t border-border/30 gap-0.5 sm:gap-1">
            {[
              { icon: Image, label: "מדיה", color: "hover:bg-green-500/10 hover:text-green-600" },
              { icon: BarChart3, label: "סקר", color: "hover:bg-red-500/10 hover:text-red-600" },
              { icon: LinkIcon, label: "קישור", color: "hover:bg-blue-500/10 hover:text-blue-600" },
              { icon: HelpCircle, label: "שאלה", color: "hover:bg-blue-500/10 hover:text-blue-600" },
              { icon: Trophy, label: "הישג", color: "hover:bg-amber-500/10 hover:text-amber-600" },
            ].map(({ icon: Icon, label, color }) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className={`flex-1 justify-center text-muted-foreground gap-1 sm:gap-1.5 text-xs rounded-xl transition-colors min-w-0 px-1 sm:px-2 ${color}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <CreatePostDialog open={createPostOpen} onOpenChange={setCreatePostOpen} />

        {/* Sort + count row */}
        <div className="flex items-center gap-1.5">
          {sortOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveSort(opt.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activeSort === opt.id
                    ? "bg-secondary text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="h-3 w-3" />
                {opt.label}
              </button>
            );
          })}
          <div className="mr-auto">
            <Badge variant="secondary" className="text-[10px] font-medium h-5 rounded-full">
              {filteredPosts.length} פוסטים
            </Badge>
          </div>
        </div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-card/40 rounded-2xl border border-border/40">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {activeSort === "saved" ? "עדיין לא שמרת פוסטים" : "אין פוסטים בקטגוריה זו עדיין"}
            </p>
            <button
              onClick={() => { setActiveSort("new"); setActivePostType("all"); }}
              className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              הצג הכל
            </button>
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              isSaved={savedPostIds.has(post.id)}
              onToggleSave={() => toggleSavePost(post.id)}
            />
          ))
        )}
      </div>

      {/* Inner left sidebar — sticky on the left */}
      <aside className="hidden md:block w-[260px] 2xl:w-[280px] shrink-0">
      {/* max-h-[calc(100vh-6.5rem)]  */}
        <div className="sticky overflow-y-auto scrollbar-none">
          <LeftSidebar />
        </div>
      </aside>
    </div>
  );
}
