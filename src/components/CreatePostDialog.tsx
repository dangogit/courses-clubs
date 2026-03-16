'use client';

import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Image, AtSign, Globe, ChevronDown, Video, Link as LinkIcon, Trash2 } from "lucide-react";
import { useCreatePost } from "@/hooks/useCreatePost";
import { toast } from "sonner";

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

interface Attachment {
  type: "image" | "video" | "link";
  url: string;
  name?: string;
  file?: File;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string | null;
}

export default function CreatePostDialog({ open, onOpenChange, groupId }: CreatePostDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [taggedMembers, setTaggedMembers] = useState<typeof COMMUNITY_MEMBERS>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createPost = useCreatePost();

  const handlePost = () => {
    if (!content.trim() && attachments.length === 0) return;

    createPost.mutate(
      {
        content: content.trim(),
        group_id: groupId ?? null,
        post_type: null,
        images: attachments.filter(a => a.type === "image").map(a => a.url),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitle("");
          setContent("");
          setAttachments([]);
          setShowLinkInput(false);
          setLinkInput("");
          setTaggedMembers([]);
          setShowMentions(false);
          toast.success("הפוסט פורסם!", { description: "הפוסט שלך פורסם בהצלחה" });
        },
        onError: () => {
          toast.error("שגיאה", { description: "לא הצלחנו לפרסם את הפוסט. נסה שוב." });
        },
      }
    );
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    // detect @mention typing
    const match = val.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member: typeof COMMUNITY_MEMBERS[0]) => {
    setContent((prev) => prev.replace(/@\w*$/, `@${member.name} `));
    if (!taggedMembers.find((m) => m.seed === member.seed)) {
      setTaggedMembers((prev) => [...prev, member]);
    }
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const removeTag = (seed: string) => {
    setTaggedMembers((prev) => prev.filter((m) => m.seed !== seed));
  };

  const filteredMembers = COMMUNITY_MEMBERS.filter((m) =>
    m.name.includes(mentionQuery) || mentionQuery === ""
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      type,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    let url = linkInput.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setAttachments((prev) => [...prev, { type: "link", url, name: url }]);
    setLinkInput("");
    setShowLinkInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <Image className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <h2 className="font-display font-bold text-lg">צור פוסט</h2>
        </div>

        {/* User info */}
        <div className="px-5 pt-4">
          <div className="flex items-start gap-3 justify-end">
            <div className="text-right">
              <p className="font-bold text-sm text-primary">לי ברקוביץ</p>
              <button className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full border text-xs text-muted-foreground hover:bg-secondary transition-colors">
                <Globe className="h-3 w-3" />
                <span>ציבורי</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=iti" />
              <AvatarFallback>לב</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Title */}
        <div className="px-5 pt-3">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-right text-sm text-muted-foreground placeholder:text-muted-foreground/50 bg-transparent border-none outline-none"
          />
        </div>

        {/* Content */}
        <div className="px-5 pt-2 pb-2 relative">
          <textarea
            ref={textareaRef}
            placeholder="שתף מה שעל ליבך... השתמש ב-@ לתיוג חברים"
            value={content}
            onChange={handleContentChange}
            className="w-full min-h-[140px] text-right text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/50"
          />
          {/* Mention dropdown */}
          {showMentions && (
            <div className="absolute right-5 top-full -mt-2 z-50 w-56 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
              {filteredMembers.slice(0, 6).map((member) => (
                <button
                  key={member.seed}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(member); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary transition-colors text-right"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`} />
                    <AvatarFallback className="text-[9px]">{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tagged members chips */}
        {taggedMembers.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-1.5">
            {taggedMembers.map((m) => (
              <span key={m.seed} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.seed}`} />
                </Avatar>
                @{m.name}
                <button onClick={() => removeTag(m.seed)} className="hover:text-destructive ml-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.type === "image" && (
                  <img src={att.url} alt={att.name} className="h-20 w-20 rounded-xl object-cover border border-border" />
                )}
                {att.type === "video" && (
                  <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center border border-border">
                    <Video className="h-6 w-6 text-muted-foreground" />
                    <span className="absolute bottom-1 text-[8px] text-muted-foreground truncate max-w-[72px] px-1">{att.name}</span>
                  </div>
                )}
                {att.type === "link" && (
                  <div className="h-20 px-3 rounded-xl bg-secondary flex items-center gap-2 border border-border">
                    <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Link input */}
        {showLinkInput && (
          <div className="px-5 pb-3 flex items-center gap-2">
            <Button size="sm" variant="default" className="rounded-full text-xs shrink-0" onClick={handleAddLink}>
              הוסף
            </Button>
            <input
              type="url"
              placeholder="הכנס קישור..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
              className="flex-1 text-right text-sm bg-secondary/60 rounded-full px-4 py-2 border-none outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        )}

        <div className="border-t" />

        {/* Bottom bar */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="תמונה"
            >
              <Image className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="סרטון"
            >
              <Video className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={`p-2 rounded-lg hover:bg-secondary transition-colors ${showLinkInput ? "bg-secondary" : ""}`}
              title="קישור"
            >
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => { setContent((c) => c + "@"); setShowMentions(true); setMentionQuery(""); textareaRef.current?.focus(); }}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="תייג חבר"
            >
              <AtSign className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePost}
              disabled={(!content.trim() && attachments.length === 0) || createPost.isPending}
              size="sm"
              className="rounded-full px-5 font-bold"
            >
              {createPost.isPending ? "מפרסם..." : "פוסט"}
            </Button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "video")}
        />
      </DialogContent>
    </Dialog>
  );
}
