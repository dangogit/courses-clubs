'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { X, Image, Video, Link as LinkIcon, AtSign, Send } from "lucide-react";

export interface Attachment {
  type: "image" | "video" | "link";
  url: string;
  name?: string;
  file?: File;
}

interface CommentComposerProps {
  replyingTo: { author: string; commentId: number } | null;
  onCancelReply: () => void;
  onSubmit: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
}

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

export default function CommentComposer({ replyingTo, onCancelReply, onSubmit, placeholder }: CommentComposerProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (replyingTo) {
      const prefix = `@${replyingTo.author} `;
      setText(prefix);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(prefix.length, prefix.length);
        }
      }, 50);
    }
  }, [replyingTo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    const mentionMatch = val.match(/@([^\s]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = useCallback((member: { name: string; seed: string }) => {
    setText((prev) => prev.replace(/@[^\s]*$/, `@${member.name} `));
    setShowMentions(false);
    textareaRef.current?.focus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: Attachment[] = Array.from(files).map((file) => ({
      type,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    setAttachments((prev) => [...prev, ...newAtts]);
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

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSubmit(text.trim(), attachments);
    setText("");
    setAttachments([]);
    setShowLinkInput(false);
    setLinkInput("");
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") setShowMentions(false);
  };

  const filteredMembers = COMMUNITY_MEMBERS.filter(
    (m) => mentionQuery === "" || m.name.includes(mentionQuery)
  );

  const canSubmit = text.trim().length > 0 || attachments.length > 0;

  return (
    <div ref={composerRef} className="flex items-start gap-2.5">
      <Avatar className="h-7 w-7 mt-1 shrink-0">
        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=iti" />
        <AvatarFallback className="text-[9px]">לב</AvatarFallback>
      </Avatar>

      <div className="flex-1 relative">
        <div className="rounded-2xl border border-border/60 bg-secondary/20 overflow-hidden focus-within:border-primary/50 focus-within:bg-card transition-all duration-200">
          {replyingTo && (
            <div className="flex items-center justify-between px-3 pt-2 pb-1 bg-primary/5 border-b border-primary/10">
              <span className="text-[11px] text-primary font-semibold">מגיב ל-{replyingTo.author}</span>
              <button onClick={onCancelReply} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            dir="rtl"
            placeholder={placeholder ?? (replyingTo ? `הגב ל-${replyingTo.author}... (@ לתיוג)` : "כתוב תגובה... (@ לתיוג)")}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full text-right text-sm bg-transparent border-none outline-none resize-none px-3 pt-2.5 pb-1 placeholder:text-muted-foreground/50"
          />

          {attachments.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {att.type === "image" && (
                    <img src={att.url} alt={att.name} className="h-16 w-16 rounded-xl object-cover border border-border" />
                  )}
                  {att.type === "video" && (
                    <div className="h-16 w-16 rounded-xl bg-secondary flex flex-col items-center justify-center border border-border">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[8px] text-muted-foreground truncate max-w-[60px] px-1 mt-0.5">{att.name}</span>
                    </div>
                  )}
                  {att.type === "link" && (
                    <div className="h-10 px-2 rounded-xl bg-secondary flex items-center gap-1.5 border border-border">
                      <LinkIcon className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showLinkInput && (
            <div className="px-3 pb-2 flex items-center gap-2">
              <Button size="sm" variant="default" className="rounded-full text-xs shrink-0 h-7 px-3" onClick={handleAddLink}>
                הוסף
              </Button>
              <input
                type="url"
                placeholder="הכנס קישור..."
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                className="flex-1 text-right text-xs bg-secondary/60 rounded-full px-3 py-1.5 border-none outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
          )}

          <div className="flex items-center justify-between px-2 pb-1.5 border-t border-border/30 pt-1.5 mt-1">
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="שלח"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  setText((c) => c + "@");
                  setShowMentions(true);
                  setMentionQuery("");
                  textareaRef.current?.focus();
                }}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="תייג חבר"
              >
                <AtSign className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowLinkInput(!showLinkInput)}
                className={`p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground ${showLinkInput ? "bg-secondary" : ""}`}
                title="קישור"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="סרטון"
              >
                <Video className="h-4 w-4" />
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="תמונה"
              >
                <Image className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full mb-1 right-0 z-50 w-52 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
            {filteredMembers.slice(0, 6).map((member) => (
              <button
                key={member.seed}
                onMouseDown={(e) => { e.preventDefault(); insertMention(member); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary transition-colors text-right"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`} />
                  <AvatarFallback className="text-[8px]">{member.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{member.name}</span>
              </button>
            ))}
          </div>
        )}

        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, "video")} />
      </div>
    </div>
  );
}
