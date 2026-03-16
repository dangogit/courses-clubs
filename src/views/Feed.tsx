'use client';

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Image,
  Link as LinkIcon,
  BarChart3,
  TrendingUp,
  Clock,
  Bookmark,
  HelpCircle,
  Trophy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WelcomeBanner from "@/components/WelcomeBanner";
import VideoRecommendations from "@/components/VideoRecommendations";
import CreatePostDialog from "@/components/CreatePostDialog";
import PostCard, { type PostData } from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import LeftSidebar from "@/components/LeftSidebar";
import { useFeed, type FeedPost } from "@/hooks/useFeed";
import { useFeedRealtime } from "@/hooks/useFeedRealtime";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

// ─── Role label mapping ──────────────────────────────────────────────────────

function roleLabel(role: string | null): string | null {
  if (role === "admin") return "מנהל";
  if (role === "moderator") return "מנחה";
  return null;
}

// ─── Map FeedPost → PostData for PostCard ─────────────────────────────────────

function feedPostToPostData(fp: FeedPost): PostData {
  const totalReactions = Object.values(fp.reactionCounts).reduce((s, v) => s + v, 0);
  return {
    id: fp.id,
    authorId: fp.author.id,
    author: fp.author.display_name ?? "משתמש",
    avatar: fp.author.avatar_url ?? fp.author.id,
    role: roleLabel(fp.author.role),
    time: formatRelativeTime(fp.created_at),
    pinned: fp.is_pinned,
    content: fp.content,
    likes: totalReactions,
    comments: fp.commentCount,
    postType: fp.post_type as PostData["postType"],
    reactions: fp.reactionCounts,
    userReactions: fp.userReactions,
    images: fp.images ?? [],
    groupId: fp.group_id,
  };
}

// ─── Post type filters ────────────────────────────────────────────────────────

const sortOptions = [
  { id: "new", label: "חדשים", icon: Clock },
  { id: "recent", label: "פעילות אחרונה", icon: TrendingUp },
  { id: "saved", label: "נשמרו", icon: Bookmark },
];

// ─── Main Feed ────────────────────────────────────────────────────────────────

export default function Feed() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [activeSort, setActiveSort] = useState("new");
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Fetch current user for ownership checks
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Real-time Supabase feed for main feed (group_id = null)
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(null);
  useFeedRealtime(null);

  const toggleSavePost = (postId: string) => {
    setSavedPostIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  // Flatten all pages into a single post list
  const allPosts: PostData[] = data?.pages.flatMap((page) =>
    page.posts.map(feedPostToPostData)
  ) ?? [];

  const filteredPosts = allPosts.filter((p) => {
    if (activeSort === "saved" && !savedPostIds.has(p.id)) return false;
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-12 bg-card/40 rounded-2xl border border-destructive/40">
            <p className="text-muted-foreground text-sm">שגיאה בטעינת הפוסטים</p>
          </div>
        )}

        {/* Posts */}
        {!isLoading && !isError && filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-card/40 rounded-2xl border border-border/40">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {activeSort === "saved" ? "עדיין לא שמרת פוסטים" : "אין פוסטים עדיין"}
            </p>
            {activeSort !== "new" && (
              <button
                onClick={() => setActiveSort("new")}
                className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                הצג הכל
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                isSaved={savedPostIds.has(post.id)}
                onToggleSave={() => toggleSavePost(post.id)}
                currentUserId={currentUserId}
              />
            ))}

            {/* Load more */}
            {hasNextPage && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <><Loader2 className="h-4 w-4 animate-spin ml-2" /> טוען...</>
                  ) : (
                    "טען עוד"
                  )}
                </Button>
              </div>
            )}
          </>
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
