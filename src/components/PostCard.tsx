'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ImageLightbox from "@/components/ImageLightbox";
import {
  Heart,
  MessageCircle,
  Share2,
  Pin,
  MoreHorizontal,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Reply,
  HelpCircle,
  Trophy,
  Megaphone,
  Code2,
  X,
  Flag,
  UserPlus,
  Copy,
  AtSign,
  Pencil,
  Trash2,
} from "lucide-react";

import CommentComposer, { type Attachment } from "@/components/CommentComposer";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = "question" | "share" | "project" | "achievement" | "announcement";

interface Reaction {
  emoji: string;
  label: string;
  key: string;
  color: string;
}

const REACTIONS: Reaction[] = [
  { emoji: "❤️", label: "אהבתי", key: "love", color: "text-red-500" },
  { emoji: "🔥", label: "אש!", key: "fire", color: "text-orange-500" },
  { emoji: "💡", label: "רעיון", key: "idea", color: "text-yellow-500" },
  { emoji: "🤖", label: "AI!", key: "robot", color: "text-blue-500" },
  { emoji: "👏", label: "כל הכבוד", key: "clap", color: "text-green-500" },
  { emoji: "❓", label: "שאלה", key: "question", color: "text-purple-500" },
];

const POST_TYPE_CONFIG: Record<PostType, { label: string; icon: React.FC<{ className?: string }>; colors: string }> = {
  question: { label: "שאלה", icon: HelpCircle, colors: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  share: { label: "שיתוף", icon: Share2, colors: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  project: { label: "פרויקט", icon: Code2, colors: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  achievement: { label: "הישג", icon: Trophy, colors: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  announcement: { label: "הודעה", icon: Megaphone, colors: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

interface NestedReply {
  id: number;
  author: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replyingTo?: string;
  isEdited?: boolean;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies?: NestedReply[];
  isEdited?: boolean;
}

export interface PostData {
  id: string;
  authorId?: string;
  author: string;
  avatar: string;
  role: string | null;
  time: string;
  pinned: boolean;
  content: string;
  likes: number;
  comments: number;
  postType?: PostType;
  aiSummary?: string;
  tags?: string[];
  reactions?: Record<string, number>;
  userReactions?: string[];
  codeBlock?: string;
  image?: string;
  images?: string[];
  groupId?: string | null;
}

// ─── Mock likers data ────────────────────────────────────────────────────────

const mockPostLikers: Record<string, string[]> = {
  1: ["שרי רוזנוסר", "גולן", "מאיה ר.", "יובל", "הילה", "דוד לוי", "אלכס ב."],
  2: ["לי ברקוביץ", "דוד לוי", "אלכס ב."],
  3: ["מאיה ר.", "הילה"],
  4: ["שרי רוזנוסר", "גולן", "מאיה ר.", "יובל", "הילה", "אלכס ב."],
};

const mockCommentLikers: Record<string, string[]> = {
  "1-1": ["לי ברקוביץ", "גולן", "מאיה ר."],
  "1-2": ["שרי רוזנוסר", "יובל"],
  "1-3": ["גולן", "הילה", "דוד לוי", "אלכס ב.", "יובל", "מאיה ר.", "שרי רוזנוסר", "לי ברקוביץ"],
  "2-1": ["הילה"],
  "3-1": ["לי ברקוביץ", "יובל", "מאיה ר.", "גולן"],
};

// ─── LikersPopover ────────────────────────────────────────────────────────────

function LikersPopover({ names, count }: { names: string[]; count: number }) {
  if (count === 0) return <span>{count}</span>;
  return (
    <Popover>
      <PopoverTrigger
        render={<button />}
        className="hover:underline cursor-pointer"
      >
        {count}
      </PopoverTrigger>
      <PopoverContent className="w-44 p-2" align="start">
        <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold px-1">לייקים</p>
        <div className="space-y-0.5 max-h-48 overflow-y-auto">
          {names.map((name) => (
            <div key={name} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-secondary/50 transition-colors">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
                <AvatarFallback className="text-[8px]">{name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground">{name}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockComments: Record<string, Comment[]> = {
  1: [
    {
      id: 1, author: "שרי רוזנוסר", avatar: "sari", time: "לפני 20 שעות",
      text: "מרגש מאוד! מחכה לעדכונים", likes: 5,
      replies: [
        { id: 11, author: "לי ברקוביץ", avatar: "iti", time: "לפני 18 שעות", text: "תודה שרי! יש הרבה דברים טובים בדרך 🔥", likes: 3, replyingTo: "שרי רוזנוסר" },
      ],
    },
    {
      id: 2, author: "גולן", avatar: "golan", time: "לפני 18 שעות",
      text: "ברוכים הבאים לכולם! קהילה מדהימה", likes: 3,
      replies: [
        { id: 21, author: "מאיה ר.", avatar: "maya", time: "לפני 16 שעות", text: "אכן! שמחה שהצטרפתי", likes: 2, replyingTo: "גולן" },
        { id: 22, author: "יובל", avatar: "yuval", time: "לפני 14 שעות", text: "הקהילה הכי טובה ב-AI בארץ 🙌", likes: 4, replyingTo: "גולן" },
      ],
    },
    { id: 3, author: "מאיה ר.", avatar: "maya", time: "לפני 12 שעות", text: "תודה על העבודה הקשה לי! 💪", likes: 8, replies: [] },
  ],
  2: [
    {
      id: 1, author: "דוד לוי", avatar: "david", time: "לפני שעה",
      text: "גם אני סיימתי אותו! מומלץ בטירוף", likes: 2,
      replies: [{ id: 11, author: "שרי רוזנוסר", avatar: "sari", time: "לפני 50 דקות", text: "כן!! אחד הקורסים הכי שווים שעשיתי", likes: 1, replyingTo: "דוד לוי" }],
    },
    { id: 2, author: "הילה", avatar: "hila", time: "לפני 45 דקות", text: "מתחילה אותו היום, שמחה לשמוע!", likes: 1, replies: [] },
  ],
  3: [
    {
      id: 1, author: "שרי רוזנוסר", avatar: "sari", time: "לפני 4 שעות",
      text: "יש לי ניסיון עם זה — שלח לי הודעה פרטית 😊", likes: 4,
      replies: [{ id: 11, author: "דוד לוי", avatar: "david", time: "לפני 3 שעות", text: "שלחתי לך הודעה, תודה!", likes: 0, replyingTo: "שרי רוזנוסר" }],
    },
    { id: 2, author: "אלכס ב.", avatar: "alex", time: "לפני 3 שעות", text: "מצטרף לשאלה, גם אני מתעניין!", likes: 1, replies: [] },
  ],
  4: [
    {
      id: 1, author: "יובל", avatar: "yuval", time: "לפני 20 שעות",
      text: "עדכנתי! תודה על התזכורת 👍", likes: 2,
      replies: [{ id: 11, author: "מאיה רוזן", avatar: "maya", time: "לפני 18 שעות", text: "נהדר! ברוך הבא לקהילה יובל", likes: 1, replyingTo: "יובל" }],
    },
  ],
};

// ─── Content Renderer ─────────────────────────────────────────────────────────

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(@\S+|#\S+)/g);
    return (
      <span key={lineIdx}>
        {parts.map((part, i) => {
          if (part.startsWith("@")) {
            return <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">{part}</span>;
          }
          if (part.startsWith("#")) {
            return <span key={i} className="text-primary/80 font-medium cursor-pointer hover:underline">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}


// ─── Comment Item ─────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onLike: (id: number) => void;
  liked: boolean;
  onReply: (author: string, commentId: number) => void;
  onEdit: (commentId: number, newText: string) => void;
  onDelete: (commentId: number, replyId?: number) => void;
}

function CommentItem({ comment, postId, onLike, liked, onReply, onEdit, onDelete }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [replyLikes, setReplyLikes] = useState<Record<number, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | "comment" | null>(null);

  const toggleReplyLike = useCallback((replyId: number) => {
    setReplyLikes((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
  }, []);

  const startEditComment = () => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const saveEditComment = () => {
    if (editText.trim()) onEdit(comment.id, editText.trim());
    setEditingCommentId(null);
  };

  const startEditReply = (replyId: number, text: string) => {
    setEditingReplyId(replyId);
    setEditReplyText(text);
  };

  const saveEditReply = (replyId: number) => {
    if (editReplyText.trim()) onEdit(-replyId, editReplyText.trim()); // negative id signals reply edit
    setEditingReplyId(null);
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const likeTotal = comment.likes + (liked ? 1 : 0);
  const isMyComment = false;

  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="h-7 w-7 mt-0.5 shrink-0">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatar}`} />
        <AvatarFallback className="text-[9px]">{comment.author[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary/50 dark:bg-secondary/25 rounded-2xl rounded-tr-sm px-3 py-2.5 border border-border/30">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-xs">{comment.author}</span>
            <span className="text-[10px] text-muted-foreground">{comment.time}</span>
            {comment.isEdited && <span className="text-[9px] text-muted-foreground/60">· נערך</span>}
            {isMyComment && editingCommentId !== comment.id && (
              <div className="mr-auto flex items-center gap-1">
                <button onClick={startEditComment} className="text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer">
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                {confirmDeleteId === "comment" ? (
                  <>
                    <button onClick={() => onDelete(comment.id)} className="text-[9px] font-bold text-destructive hover:underline cursor-pointer">מחק</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] text-muted-foreground hover:underline cursor-pointer">לא</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDeleteId("comment")} className="text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer">
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {editingCommentId === comment.id ? (
            <div className="space-y-1.5">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditComment(); } if (e.key === "Escape") setEditingCommentId(null); }}
                autoFocus
                rows={2}
                className="w-full text-sm bg-secondary/40 rounded-lg px-2 py-1 border border-primary/30 outline-none resize-none text-right"
              />
              <div className="flex items-center gap-1.5 justify-start">
                <button onClick={saveEditComment} className="text-[10px] font-semibold text-primary hover:underline cursor-pointer">שמור</button>
                <button onClick={() => setEditingCommentId(null)} className="text-[10px] text-muted-foreground hover:underline cursor-pointer">ביטול</button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{comment.text}</p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer select-none ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
          >
            <Heart className={`h-3 w-3 transition-all duration-200 ${liked ? "fill-current scale-110" : ""}`} />
          </button>
          <LikersPopover
            names={mockCommentLikers[`${postId}-${comment.id}`] ?? []}
            count={likeTotal}
          />
          <button
            onClick={() => onReply(comment.author, comment.id)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Reply className="h-3 w-3" />
            הגב
          </button>
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer mr-auto"
            >
              {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {comment.replies!.length} {showReplies ? "הסתר" : "תגובות"}
            </button>
          )}
        </div>

        {hasReplies && showReplies && (
          <div className="mt-2.5 space-y-2.5 pr-3 border-r-2 border-primary/20 mr-1">
            {comment.replies!.map((reply) => {
              const isMyReply = false;
              return (
                <div key={reply.id} className="flex items-start gap-2">
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.avatar}`} />
                    <AvatarFallback className="text-[8px]">{reply.author[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-secondary/30 dark:bg-secondary/15 rounded-2xl rounded-tr-sm px-3 py-1.5 border border-border/20">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-[11px]">{reply.author}</span>
                        {reply.replyingTo && (
                          <span className="text-[10px] text-primary/70 font-medium">@{reply.replyingTo}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{reply.time}</span>
                        {reply.isEdited && <span className="text-[9px] text-muted-foreground/60">· נערך</span>}
                        {isMyReply && editingReplyId !== reply.id && (
                          <div className="mr-auto flex items-center gap-1">
                            <button onClick={() => startEditReply(reply.id, reply.text)} className="text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer">
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                            {confirmDeleteId === reply.id ? (
                              <>
                                <button onClick={() => onDelete(comment.id, reply.id)} className="text-[9px] font-bold text-destructive hover:underline cursor-pointer">מחק</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-[9px] text-muted-foreground hover:underline cursor-pointer">לא</button>
                              </>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(reply.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer">
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {editingReplyId === reply.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={editReplyText}
                            onChange={(e) => setEditReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditReply(reply.id); } if (e.key === "Escape") setEditingReplyId(null); }}
                            autoFocus
                            rows={2}
                            className="w-full text-xs bg-secondary/40 rounded-lg px-2 py-1 border border-primary/30 outline-none resize-none text-right"
                          />
                          <div className="flex items-center gap-1.5 justify-start">
                            <button onClick={() => saveEditReply(reply.id)} className="text-[10px] font-semibold text-primary hover:underline cursor-pointer">שמור</button>
                            <button onClick={() => setEditingReplyId(null)} className="text-[10px] text-muted-foreground hover:underline cursor-pointer">ביטול</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs leading-relaxed">{reply.text}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-1">
                      <button
                        onClick={() => toggleReplyLike(reply.id)}
                        className={`flex items-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${replyLikes[reply.id] ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
                      >
                        <Heart className={`h-2.5 w-2.5 ${replyLikes[reply.id] ? "fill-current" : ""}`} />
                      </button>
                      <LikersPopover
                        names={[]}
                        count={reply.likes + (replyLikes[reply.id] ? 1 : 0)}
                      />
                      <button
                        onClick={() => onReply(reply.author, comment.id)}
                        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <Reply className="h-2.5 w-2.5" />
                        הגב
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Post Menu ────────────────────────────────────────────────────────────────

function PostMenu({ author, postId, isOwner, onEdit, onDelete, onClose, triggerRef }: { author: string; postId: string; isOwner: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void; triggerRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, triggerRef]);

  const items = [
    ...(isOwner ? [
      { icon: Pencil, label: "ערוך פוסט", action: () => { onEdit(); onClose(); } },
      { icon: Trash2, label: "מחק פוסט", action: () => { onDelete(); onClose(); }, danger: true },
    ] : []),
    { icon: Bookmark, label: "שמור פוסט", action: () => { onClose(); } },  
    { icon: Copy, label: "העתק קישור", action: () => { navigator.clipboard.writeText(`${window.location.origin}/community?post=${postId}`); onClose(); } },
    { icon: UserPlus, label: `עקוב אחר ${author}`, action: () => { onClose(); } },
    { icon: Flag, label: "דווח על פוסט", action: () => { onClose(); }, danger: true },
  ];

  if (!pos) return null;

  return createPortal(
    <div
      ref={ref}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-48 bg-card border border-border/60 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
    >
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.action}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors cursor-pointer text-right ${item.danger
                ? "text-destructive hover:bg-destructive/10"
                : "text-foreground hover:bg-secondary/60"
              }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ─── Community members for @mention ─────────────────────────────────────────

const COMMUNITY_MEMBERS = [
  { name: "עדן ביבס", seed: "eden" },
  { name: "גבי דניאל", seed: "gabi" },
  { name: "הילי פלאוט", seed: "hili" },
  { name: "משה אילון", seed: "moshe" },
  { name: "רותי דניס", seed: "ruti" },
  { name: "מיכל תמיר", seed: "michal" },
  { name: "אורי שפירא", seed: "ori" },
  { name: "נועה כהן", seed: "noa" },
  { name: "דוד לוי", seed: "david" },
  { name: "תמר אברהם", seed: "tamar" },
];

// ─── Main PostCard ────────────────────────────────────────────────────────────

export default function PostCard({ post, index, isSaved, onToggleSave, currentUserId }: { post: PostData; index: number; isSaved?: boolean; onToggleSave?: () => void; currentUserId?: string }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const bookmarked = isSaved ?? false;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments[post.id] || []);
  const [commentLikes, setCommentLikes] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ author: string; commentId: number } | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(post.reactions ?? {});
  const [showAISummary, setShowAISummary] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postContent, setPostContent] = useState(post.content);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const totalCommentCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

  const toggleLike = () => {
    setReactionCounts((prev) => ({
      ...prev,
      love: liked ? Math.max(0, (prev.love ?? 1) - 1) : (prev.love ?? 0) + 1,
    }));
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const toggleCommentLike = useCallback((commentId: number) => {
    setCommentLikes((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }, []);

  const handleSetReply = useCallback((author: string, commentId: number) => {
    setReplyingTo({ author, commentId });
    setShowComments(true);
  }, []);

  const handleCommentSubmit = (text: string, _attachments: Attachment[]) => {
    if (!text.trim() && _attachments.length === 0) return;

    // Fire toast notifications for every @mentioned member
    const mentionMatches = text.match(/@([\u0590-\u05FF\w\s]+?)(?=\s|$)/g);
    if (mentionMatches) {
      mentionMatches.forEach((mention) => {
        const name = mention.slice(1).trim();
        toast(`תויגת בתגובה`, {
          description: `לי ברקוביץ תייג את ${name} בתגובה לפוסט`,
          icon: <AtSign className="h-4 w-4 text-primary" />,
          duration: 5000,
        });
      });
    }

    if (replyingTo) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyingTo.commentId
            ? { ...c, replies: [...(c.replies ?? []), { id: Date.now(), author: "לי ברקוביץ", avatar: "iti", time: "עכשיו", text: text.trim(), likes: 0, replyingTo: replyingTo.author }] }
            : c
        )
      );
      setReplyingTo(null);
    } else {
      setComments((prev) => [...prev, { id: Date.now(), author: "לי ברקוביץ", avatar: "iti", time: "עכשיו", text: text.trim(), likes: 0, replies: [] }]);
    }
  };

  const handleEditComment = (id: number, newText: string) => {
    if (id < 0) {
      const replyId = -id;
      setComments((prev) => prev.map((c) => ({
        ...c,
        replies: c.replies?.map((r) => r.id === replyId ? { ...r, text: newText, isEdited: true } : r),
      })));
    } else {
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, text: newText, isEdited: true } : c));
    }
  };

  const handleDeleteComment = (commentId: number, replyId?: number) => {
    if (replyId !== undefined) {
      setComments((prev) => prev.map((c) => c.id === commentId
        ? { ...c, replies: c.replies?.filter((r) => r.id !== replyId) }
        : c
      ));
      toast("התגובה נמחקה");
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast("התגובה נמחקה");
    }
  };

  const [deletingPost, setDeletingPost] = useState(false);
  const [postEdited, setPostEdited] = useState(false);
  const isMyPost = !!(currentUserId && post.authorId === currentUserId);

  const totalReactions = Object.values(reactionCounts).reduce((s, v) => s + v, 0);
  const postTypeConfig = post.postType ? POST_TYPE_CONFIG[post.postType] : null;

  if (deletingPost) {
    return (
      <article className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-destructive/40 overflow-visible">
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium">האם למחוק את הפוסט לצמיתות?</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { toast("הפוסט נמחק"); setDeletingPost(false); /* in a real app: remove from list */ }}
              className="text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              מחק
            </button>
            <button
              onClick={() => setDeletingPost(false)}
              className="text-xs text-muted-foreground hover:underline cursor-pointer"
            >
              ביטול
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`bg-card/80 backdrop-blur-sm rounded-2xl card-shadow overflow-visible ${post.role === "מנהל" ? "border-2 border-primary/60 ring-1 ring-primary/20" : "border border-border/50"}`}
    >
      {/* Pinned bar */}
      {post.pinned && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center gap-1.5 text-xs text-primary font-semibold border-b border-primary/10 rounded-t-2xl">
          <Pin className="h-3 w-3" />
          פוסט נעוץ
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.avatar}`} />
              <AvatarFallback className="text-xs font-bold">{post.author[0]}</AvatarFallback>
            </Avatar>
            {post.role === "מנהל" && (
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 gradient-primary rounded-full flex items-center justify-center ring-2 ring-card shadow-sm">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm leading-none">{post.author}</span>
              {post.role && (
                <Badge className="text-[10px] h-5 px-1.5 gradient-primary border-0 font-semibold rounded-full">
                  {post.role}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">· {post.time}</span>
              {postEdited && <span className="text-[10px] text-muted-foreground/60">· נערך</span>}
            </div>

            {/* Content */}
            {editingPost ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingPost(false); }}
                  autoFocus
                  rows={4}
                  className="w-full text-sm bg-secondary/40 rounded-xl px-3 py-2 border border-primary/30 outline-none resize-none text-right"
                />
                <div className="flex items-center gap-2 justify-start">
                  <button
                    onClick={() => { setEditingPost(false); setPostEdited(true); }}
                    className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full cursor-pointer transition-colors"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => { setPostContent(post.content); setEditingPost(false); }}
                    className="text-xs text-muted-foreground hover:underline cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {renderContent(postContent)}
              </p>
            )}

            {/* Code block */}
            {post.codeBlock && (
              <pre className="mt-3 bg-secondary/70 dark:bg-secondary/40 border border-border/50 rounded-xl px-4 py-3 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed">
                <code>{post.codeBlock}</code>
              </pre>
            )}

            {/* Post images grid */}
            {(() => {
              const allImages = post.images ?? (post.image ? [post.image] : []);
              if (allImages.length === 0) return null;
              const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true); };
              const imgClass = "w-full object-cover cursor-pointer hover:brightness-90 transition-all duration-200";
              return (
                <>
                  {allImages.length === 1 && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-border/40">
                      <img src={allImages[0]} alt="תמונה מצורפת לפוסט" className={`${imgClass} max-h-96`} onClick={() => openLightbox(0)} />
                    </div>
                  )}
                  {allImages.length === 2 && (
                    <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden border border-border/40">
                      {allImages.map((img, i) => (
                        <img key={i} src={img} alt={`תמונה ${i + 1}`} className={`${imgClass} h-64`} onClick={() => openLightbox(i)} />
                      ))}
                    </div>
                  )}
                  {allImages.length === 3 && (
                    <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden border border-border/40">
                      <img src={allImages[0]} alt="תמונה 1" className={`${imgClass} h-64 row-span-2`} onClick={() => openLightbox(0)} />
                      <img src={allImages[1]} alt="תמונה 2" className={`${imgClass} h-[calc(8rem-1px)]`} onClick={() => openLightbox(1)} />
                      <img src={allImages[2]} alt="תמונה 3" className={`${imgClass} h-[calc(8rem-1px)]`} onClick={() => openLightbox(2)} />
                    </div>
                  )}
                  {allImages.length >= 4 && (
                    <div className="mt-3 grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden border border-border/40">
                      {allImages.slice(0, 4).map((img, i) => (
                        <div key={i} className="relative cursor-pointer" onClick={() => openLightbox(i)}>
                          <img src={img} alt={`תמונה ${i + 1}`} className={`${imgClass} h-40`} />
                          {i === 3 && allImages.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{allImages.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <ImageLightbox images={allImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
                </>
              );
            })()}

            {/* Tags hidden */}
            {false && post.tags && (post.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {post.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold text-primary/80 bg-primary/8 hover:bg-primary/15 px-2 py-0.5 rounded-full cursor-pointer transition-colors border border-primary/15"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Options menu */}
          <div className="shrink-0">
            <button
              ref={menuTriggerRef}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer"
              aria-label="אפשרויות"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
            {showMenu && (
              <PostMenu author={post.author} postId={post.id} isOwner={isMyPost} onEdit={() => setEditingPost(true)} onDelete={() => setDeletingPost(true)} onClose={() => setShowMenu(false)} triggerRef={menuTriggerRef} />
            )}
          </div>
        </div>


        {/* Action bar */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
          {/* Like */}
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer select-none text-sm font-medium ${liked
                ? "text-red-500 font-semibold"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
              }`}
          >
            <Heart className={`h-5 w-5 transition-all duration-200 ${liked ? "fill-current scale-110" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${liked ? "text-red-500" : "text-muted-foreground"}`}>
            <LikersPopover names={[...(mockPostLikers[post.id] ?? [])]} count={likeCount} />
          </span>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-sm font-medium ${showComments ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
          >
            <MessageCircle className={`h-5 w-5 ${showComments ? "fill-primary/20" : ""}`} />
            {totalCommentCount > 0 && <span>{totalCommentCount}</span>}
          </button>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${copied ? "text-green-600 font-semibold" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
          >
            {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copied && <span>הועתק!</span>}
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleSave?.()}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            aria-label="שמור"
          >
            <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-border/40 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                onLike={toggleCommentLike}
                liked={!!commentLikes[comment.id]}
                onReply={handleSetReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            ))}

            {/* Compose reply */}
            <div className="mt-3 pt-1">
              <CommentComposer
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onSubmit={handleCommentSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
