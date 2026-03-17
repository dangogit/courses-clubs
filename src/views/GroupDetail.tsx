'use client';

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Users, Bell, BellOff, MessageCircle, Globe, Lock,
  Heart, Share2, Pin, MoreHorizontal, Image, Link as LinkIcon, Bookmark,
  X, Send, ImagePlus, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useGroup } from "@/hooks/useGroup";
import { useFeed, type FeedPost } from "@/hooks/useFeed";
import { useFeedRealtime } from "@/hooks/useFeedRealtime";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useJoinGroup } from "@/hooks/useJoinGroup";
import { useLeaveGroup } from "@/hooks/useLeaveGroup";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { TierBadge } from "@/components/TierBadge";
import { LockOverlay } from "@/components/LockOverlay";
import { AdminTierSelector } from "@/components/AdminTierSelector";
import { useUserTier } from "@/hooks/useUserTier";
import { useAdminSetContentTier } from "@/hooks/useAdminSetContentTier";
import { canAccess } from "@/lib/tiers";
import { useAdmin } from "@/contexts/AdminContext";

export default function GroupDetail() {
  const { groupId } = useParams() as { groupId: string };

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: feedData, isLoading: feedLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(groupId);
  useFeedRealtime(groupId);
  const createPost = useCreatePost();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const { data: userTier = 0 } = useUserTier();
  const { isAdmin } = useAdmin();
  const setContentTier = useAdminSetContentTier();

  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const posts: FeedPost[] = feedData?.pages.flatMap((p) => p.posts) ?? [];

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-muted-foreground">הקבוצה לא נמצאה</p>
        <Link href="/groups" className="text-primary underline mt-2 block">חזרה לקבוצות</Link>
      </div>
    );
  }

  const coverImage = group.banner_url ?? group.thumbnail_url ?? "/assets/groups/default.jpg";
  const isLocked = !canAccess(userTier, group.min_tier_level);

  const handlePublish = () => {
    if (!newPostText.trim()) return;
    createPost.mutate(
      { content: newPostText.trim(), group_id: groupId },
      {
        onSuccess: () => {
          setNewPostText("");
          setPreviewImage(null);
          setComposerOpen(false);
          toast.success("הפוסט פורסם!", { description: "הפוסט שלך פורסם בהצלחה בקבוצה" });
        },
        onError: () => {
          toast.error("שגיאה", { description: "לא הצלחנו לפרסם את הפוסט" });
        },
      }
    );
  };

  const handleToggleMembership = () => {
    if (group.isMember) {
      leaveGroup.mutate(groupId);
    } else {
      joinGroup.mutate(groupId);
    }
  };

  const getPostRoleBadge = (post: FeedPost): string | null => {
    if (post.author.role === "admin") return "מנהל";
    if (post.author.role === "moderator") return "מנחה";
    return null;
  };

  const getPostReactionTotal = (post: FeedPost): number =>
    Object.values(post.reactionCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back link */}
      <Link href="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
        <ArrowRight className="h-4 w-4" /> חזרה לכל הקבוצות
      </Link>

      {/* Hero Cover */}
      <div className="relative rounded-2xl overflow-hidden card-shadow border border-border/50">
        <img src={coverImage} alt={group.name} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="absolute bottom-4 right-5 left-5">
          <div className="flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-[10px] mb-2">
                {group.is_private ? <><Lock className="h-3 w-3 ms-1" /> פרטית</> : <><Globe className="h-3 w-3 ms-1" /> ציבורית</>}
              </Badge>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">{group.name}</h1>
                <TierBadge tierLevel={group.min_tier_level} size="md" />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {group.memberCount} חברים</span>
              </div>
            </div>
            {isLocked ? (
              <Button
                size="sm"
                className="rounded-full text-xs h-9 px-5 bg-muted text-muted-foreground cursor-not-allowed"
                disabled
              >
                <Lock className="h-3.5 w-3.5 ms-1" /> שדרגו כדי להצטרף
              </Button>
            ) : (
              <Button
                size="sm"
                variant={group.isMember ? "outline" : "default"}
                className={`rounded-full text-xs h-9 px-5 ${group.isMember ? "bg-background/80 backdrop-blur-sm border-white/30 text-white hover:bg-background/60" : "gradient-primary shadow-lg"}`}
                onClick={handleToggleMembership}
                disabled={joinGroup.isPending || leaveGroup.isPending}
              >
                {group.isMember ? <><BellOff className="h-3.5 w-3.5 ms-1" /> עזיבת קבוצה</> : <><Bell className="h-3.5 w-3.5 ms-1" /> הצטרפות לקבוצה</>}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lock overlay banner */}
      {isLocked && (
        <LockOverlay variant="detail" requiredTierLevel={group.min_tier_level} userTierLevel={userTier} />
      )}

      {/* Admin tier selector */}
      {isAdmin && group && (
        <div className="mt-4">
          <AdminTierSelector
            currentTierLevel={group.min_tier_level}
            onTierChange={(level) => setContentTier.mutate({ table: "groups", contentId: group.id, tierLevel: level })}
            disabled={setContentTier.isPending}
          />
        </div>
      )}

      {/* Group info card: description */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 card-shadow border border-border/50 space-y-4">
        <div>
          <h2 className="font-bold text-sm mb-1.5">אודות הקבוצה</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
        </div>
      </div>

      {/* Create Post — hidden when locked */}
      {!isLocked && <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden">
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
              <div className="relative me-[52px]">
                <img src={previewImage} alt="תצוגה מקדימה" className="w-full max-h-64 object-cover rounded-xl border border-border/50" />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 start-2 p-1 rounded-full bg-foreground/60 text-background hover:bg-foreground/80 transition-colors"
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

            <div className="flex items-center justify-between me-[52px]">
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
                  disabled={!newPostText.trim() || createPost.isPending}
                  className="rounded-full text-xs h-8 px-5 gradient-primary shadow-md gap-1.5"
                  onClick={handlePublish}
                >
                  {createPost.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  פרסום
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>}

      {/* Sorting */}
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" className="rounded-full text-xs font-medium h-8">חדשים</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium text-muted-foreground h-8">הכי רלוונטי</Button>
      </div>

      {/* Posts */}
      {feedLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          אין פוסטים בקבוצה עדיין. היו הראשונים לפרסם!
        </div>
      ) : (
        posts.map((post) => {
          const roleBadge = getPostRoleBadge(post);
          const reactionTotal = getPostReactionTotal(post);
          const authorName = post.author.display_name ?? "משתמש";
          const avatarSeed = post.author.avatar_url ?? post.author.id;

          return (
            <article
              key={post.id}
              className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden"
            >
              {post.is_pinned && (
                <div className="px-4 py-1.5 bg-accent/60 flex items-center gap-1.5 text-xs text-accent-foreground font-medium">
                  <Pin className="h-3 w-3" /> פוסט נעוץ
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                    <AvatarFallback>{authorName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{authorName}</span>
                      {roleBadge && (
                        <Badge className="text-[10px] h-5 gradient-primary border-0 font-bold">{roleBadge}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">· {formatRelativeTime(post.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {post.images.map((img, idx) => (
                          <img key={idx} src={img} alt="תמונה מצורפת" className="w-full max-h-80 object-cover rounded-xl border border-border/30" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                    <Heart className="h-4 w-4" /> {reactionTotal}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                    <MessageCircle className="h-4 w-4" /> {post.commentCount}
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-accent">
                    <Share2 className="h-4 w-4" /> שיתוף
                  </button>
                  <button className="ms-auto flex items-center text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-xl hover:bg-accent">
                    <Bookmark className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" /> טוען...</>
            ) : (
              "טען עוד פוסטים"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
