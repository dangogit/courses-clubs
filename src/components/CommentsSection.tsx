'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Reply, ChevronDown, ChevronUp, Pencil, Trash2, Check, X } from "lucide-react";
import CommentComposer, { type Attachment } from "@/components/CommentComposer";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NestedReply {
  id: number;
  author: string;
  avatar: string;
  date: string;
  text: string;
  attachments?: Attachment[];
  likes: number;
  replyingTo?: string;
  isEdited?: boolean;
}

export interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  attachments?: Attachment[];
  date: string;
  likes: number;
  replies?: NestedReply[];
  isEdited?: boolean;
}

interface CommentsSectionProps {
  storageKey: string;
  initialComments?: Comment[];
  notifyAdmin?: boolean;
  contextLabel?: string;
  contextTitle?: string;
}

const CURRENT_USER = "לי הרושץ׳";
const CURRENT_AVATAR = "me";
const ADMIN_USER = "עדן ביבס";

// ─── Inline edit textarea ──────────────────────────────────────────────────────

function InlineEdit({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialText);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const len = ref.current?.value.length ?? 0;
    ref.current?.setSelectionRange(len, len);
  }, []);

  return (
    <div className="flex-1">
      <textarea
        ref={ref}
        dir="rtl"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSave(value.trim()); }
          if (e.key === "Escape") onCancel();
        }}
        rows={3}
        className="w-full text-right text-sm bg-background border border-primary/40 rounded-xl resize-none p-3 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
      />
      <div className="flex justify-end gap-2 mt-1.5">
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" /> ביטול
        </button>
        <button
          onClick={() => onSave(value.trim())}
          disabled={!value.trim()}
          className="flex items-center gap-1 text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          <Check className="h-3 w-3" /> שמור
        </button>
      </div>
    </div>
  );
}

// ─── Mention text renderer ──────────────────────────────────────────────────────

function MentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@\S+)/).map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="text-primary font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Reply bubble ──────────────────────────────────────────────────────────────

function ReplyBubble({
  reply,
  onReply,
  onDeleteReply,
  onEditReply,
}: {
  reply: NestedReply;
  onReply: (author: string) => void;
  onDeleteReply: (replyId: number) => void;
  onEditReply: (replyId: number, text: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [editing, setEditing] = useState(false);
  const isOwn = reply.author === CURRENT_USER;

  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.avatar}`} />
        <AvatarFallback className="text-[9px]">{reply.author[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 group/reply">
        <div className="bg-secondary/30 dark:bg-secondary/15 rounded-2xl rounded-tr-sm px-3 py-2.5 border border-border/20">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2 flex-row-reverse justify-end">
              <span className="font-semibold text-xs">{reply.author}</span>
              {reply.replyingTo && (
                <span className="text-[10px] text-primary/70 font-medium">@{reply.replyingTo}</span>
              )}
              <span className="text-[10px] text-muted-foreground mr-auto">{reply.date}</span>
              {reply.isEdited && <span className="text-[9px] text-muted-foreground/60">(נערך)</span>}
            </div>
            {isOwn && !editing && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  title="ערוך"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDeleteReply(reply.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title="מחק"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <InlineEdit
              initialText={reply.text}
              onSave={(text) => { onEditReply(reply.id, text); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <p className="text-xs leading-relaxed text-foreground/90">
              <MentionText text={reply.text} />
            </p>
          )}

          {!editing && reply.attachments && reply.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {reply.attachments.map((att, i) =>
                att.type === "image" ? (
                  <img key={i} src={att.url} alt={att.name} className="h-14 w-14 rounded-xl object-cover border border-border/50" />
                ) : null
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={() => setLiked((p) => !p)}
            className={`flex items-center gap-1 text-[11px] font-medium transition-all cursor-pointer ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
          >
            <Heart className={`h-3 w-3 ${liked ? "fill-current scale-110" : ""}`} />
            {(reply.likes + (liked ? 1 : 0)) > 0 && (reply.likes + (liked ? 1 : 0))}
          </button>
          <button
            onClick={() => onReply(reply.author)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Reply className="h-3 w-3" />
            הגב
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comment item ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  liked,
  onLike,
  onReply,
  onDelete,
  onEdit,
  onDeleteReply,
  onEditReply,
}: {
  comment: Comment;
  liked: boolean;
  onLike: (id: number) => void;
  onReply: (author: string, commentId: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, text: string) => void;
  onDeleteReply: (commentId: number, replyId: number) => void;
  onEditReply: (commentId: number, replyId: number, text: string) => void;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const [editing, setEditing] = useState(false);
  const isOwn = comment.author === CURRENT_USER;
  const hasReplies = (comment.replies?.length ?? 0) > 0;

  return (
    <div className="flex items-start gap-3 group/comment">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatar}`} />
        <AvatarFallback className="text-[10px] font-bold">{comment.author[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-secondary/40 dark:bg-secondary/20 rounded-2xl rounded-tr-sm px-4 py-3 border border-border/30">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 flex-row-reverse justify-end">
              <span className="font-semibold text-sm">{comment.author}</span>
              <span className="text-xs text-muted-foreground mr-auto">{comment.date}</span>
              {comment.isEdited && <span className="text-[9px] text-muted-foreground/60">(נערך)</span>}
            </div>
            {/* Edit / Delete — own comment only */}
            {isOwn && !editing && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  title="ערוך תגובה"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  title="מחק תגובה"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <InlineEdit
              initialText={comment.text}
              onSave={(text) => { onEdit(comment.id, text); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <p className="text-sm leading-relaxed text-foreground/90">
                <MentionText text={comment.text} />
              </p>
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {comment.attachments.map((att, i) =>
                    att.type === "image" ? (
                      <img key={i} src={att.url} alt={att.name} className="h-20 w-20 rounded-xl object-cover border border-border/50" />
                    ) : att.type === "link" ? (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer"
                        className="text-xs text-primary underline flex items-center gap-1">
                        {att.name}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions row */}
        {!editing && (
          <div className="flex items-center gap-4 mt-1.5 px-1">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-all cursor-pointer ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
            >
              <Heart className={`h-3.5 w-3.5 transition-transform ${liked ? "fill-current scale-110" : ""}`} />
              {(comment.likes + (liked ? 1 : 0)) > 0 && (comment.likes + (liked ? 1 : 0))}
            </button>
            <button
              onClick={() => onReply(comment.author, comment.id)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Reply className="h-3.5 w-3.5" />
              הגב
            </button>
            {hasReplies && (
              <button
                onClick={() => setShowReplies((p) => !p)}
                className="flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary transition-colors cursor-pointer mr-auto"
              >
                {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {comment.replies!.length} תגובות
              </button>
            )}
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && showReplies && (
          <div className="mt-3 space-y-3 pr-3 border-r-2 border-primary/20 mr-1">
            {comment.replies!.map((reply) => (
              <ReplyBubble
                key={reply.id}
                reply={reply}
                onReply={(author) => onReply(author, comment.id)}
                onDeleteReply={(rid) => onDeleteReply(comment.id, rid)}
                onEditReply={(rid, text) => onEditReply(comment.id, rid, text)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main CommentsSection ──────────────────────────────────────────────────────

export default function CommentsSection({
  storageKey,
  initialComments = [],
  notifyAdmin = false,
  contextLabel = "תוכן",
  contextTitle = "",
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ author: string; commentId: number } | null>(null);

  const totalCommentCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0
  );

  const handleReply = useCallback((author: string, commentId: number) => {
    setReplyingTo({ author, commentId });
    setTimeout(() => {
      document.getElementById(`comment-composer-${storageKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, [storageKey]);

  const handleCancelReply = useCallback(() => setReplyingTo(null), []);

  const handleSubmit = useCallback((text: string, attachments: Attachment[]) => {
    if (!text.trim() && attachments.length === 0) return;
    const mentionMatches = text.match(/@(\S+)/g) ?? [];
    const mentionedNames = mentionMatches.map((m) => m.slice(1));

    if (replyingTo) {
      const replyAuthorIsMe = comments.find(c => c.id === replyingTo.commentId)?.author !== CURRENT_USER;
      setComments((prev) =>
        prev.map((c) =>
          c.id === replyingTo.commentId
            ? { ...c, replies: [...(c.replies ?? []), { id: Date.now(), author: CURRENT_USER, avatar: CURRENT_AVATAR, date: "עכשיו", text, attachments, likes: 0, replyingTo: replyingTo.author }] }
            : c
        )
      );
      setReplyingTo(null);
      if (replyAuthorIsMe) toast.success(`${replyingTo.author} קיבל/ה התראה על התגובה שלך`, { duration: 3500 });
    } else {
      setComments((prev) => [{ id: Date.now(), author: CURRENT_USER, avatar: CURRENT_AVATAR, text, attachments, date: "עכשיו", likes: 0, replies: [] }, ...prev]);
      if (notifyAdmin) toast.message(`${ADMIN_USER} קיבל/ה התראה`, { description: `תגובה חדשה על ${contextLabel}: "${contextTitle}"`, duration: 4000 });
    }

    mentionedNames.forEach((name) => { if (name) toast.success(`${name} תויג/ה בתגובתך`, { duration: 3000 }); });
  }, [replyingTo, comments, notifyAdmin, contextLabel, contextTitle]);

  const toggleLike = useCallback((commentId: number) => {
    setLikedComments((prev) => { const next = new Set(prev); if (next.has(commentId)) next.delete(commentId); else next.add(commentId); return next; });
  }, []);

  // ── Edit / Delete handlers ──
  const handleEdit = useCallback((id: number, text: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, text, isEdited: true } : c));
    toast.success("התגובה עודכנה", { duration: 2000 });
  }, []);

  const handleDelete = useCallback((id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success("התגובה נמחקה", { duration: 2000 });
  }, []);

  const handleEditReply = useCallback((commentId: number, replyId: number, text: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies?.map((r) => r.id === replyId ? { ...r, text, isEdited: true } : r) }
          : c
      )
    );
    toast.success("התגובה עודכנה", { duration: 2000 });
  }, []);

  const handleDeleteReply = useCallback((commentId: number, replyId: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: c.replies?.filter((r) => r.id !== replyId) }
          : c
      )
    );
    toast.success("התגובה נמחקה", { duration: 2000 });
  }, []);

  return (
    <div dir="rtl">
      {/* Header */}
      <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        תגובות
        {totalCommentCount > 0 && (
          <Badge variant="secondary" className="text-xs rounded-full font-medium">{totalCommentCount}</Badge>
        )}
        {notifyAdmin && (
          <span className="text-[10px] text-muted-foreground font-normal mr-1">· תגובות חדשות יישלחו למנהל</span>
        )}
      </h2>

      {/* Composer */}
      <div id={`comment-composer-${storageKey}`} className="mb-7">
        <CommentComposer
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onSubmit={handleSubmit}
          placeholder={replyingTo ? `הגב ל-${replyingTo.author}... (@ לתיוג)` : "כתוב תגובה... (@ לתיוג)"}
        />
      </div>

      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border border-dashed border-border/50">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">היו הראשונים להגיב!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              liked={likedComments.has(c.id)}
              onLike={toggleLike}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDeleteReply={handleDeleteReply}
              onEditReply={handleEditReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
