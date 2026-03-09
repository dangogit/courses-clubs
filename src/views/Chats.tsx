'use client';

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowRight, MoreVertical, Check, CheckCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Mock Data ── */

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  from: "me" | "them";
  time: string;
  read: boolean;
}

const mockConversations: Conversation[] = [
  { id: 1, name: "רותי דניס", avatar: "ruti", lastMsg: "היי, ראית את ההקלטה החדשה?", time: "עכשיו", unread: 2, online: true },
  { id: 2, name: "משה אילון", avatar: "moshe", lastMsg: "תודה רבה על השיתוף!", time: "לפני 5 דק׳", unread: 0, online: true },
  { id: 3, name: "גבי דניאל", avatar: "gabi", lastMsg: "מתי יוצא הקורס הבא?", time: "לפני 20 דק׳", unread: 1, online: false },
  { id: 4, name: "הילי פלאוט", avatar: "hili", lastMsg: "הפרומפט שלך עבד מעולה 🎉", time: "לפני שעה", unread: 0, online: true },
  { id: 5, name: "עדן ביבס", avatar: "eden", lastMsg: "נדבר מחר על הפרויקט", time: "אתמול", unread: 0, online: false },
  { id: 6, name: "יובל כהן", avatar: "yuval", lastMsg: "ראיתי את הפוסט שלך, מדהים!", time: "אתמול", unread: 0, online: false },
  { id: 7, name: "נועה לוי", avatar: "noa", lastMsg: "שלחתי לך את הקובץ", time: "לפני יומיים", unread: 0, online: true },
];

const mockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, text: "היי! מה שלומך?", from: "them", time: "10:00", read: true },
    { id: 2, text: "הכל טוב, תודה! ואתך?", from: "me", time: "10:02", read: true },
    { id: 3, text: "מעולה! ראית את ההקלטה החדשה על ChatGPT?", from: "them", time: "10:05", read: true },
    { id: 4, text: "עוד לא, על מה מדובר?", from: "me", time: "10:06", read: true },
    { id: 5, text: "זה סשן שלם על prompt engineering מתקדם. שווה מאוד לצפות!", from: "them", time: "10:08", read: true },
    { id: 6, text: "היי, ראית את ההקלטה החדשה?", from: "them", time: "עכשיו", read: false },
  ],
  2: [
    { id: 1, text: "שיתפת ממש תוכן מעולה בקהילה!", from: "them", time: "09:30", read: true },
    { id: 2, text: "תודה רבה על השיתוף!", from: "them", time: "09:31", read: true },
  ],
  3: [
    { id: 1, text: "מתי יוצא הקורס הבא על AI?", from: "them", time: "09:00", read: false },
  ],
  4: [
    { id: 1, text: "ניסיתי את הפרומפט שהמלצת עליו", from: "them", time: "08:45", read: true },
    { id: 2, text: "הפרומפט שלך עבד מעולה 🎉", from: "them", time: "08:46", read: true },
  ],
  5: [{ id: 1, text: "נדבר מחר על הפרויקט", from: "them", time: "אתמול", read: true }],
  6: [{ id: 1, text: "ראיתי את הפוסט שלך, מדהים!", from: "them", time: "אתמול", read: true }],
  7: [{ id: 1, text: "שלחתי לך את הקובץ", from: "them", time: "לפני יומיים", read: true }],
};

/* ── Components ── */

function ConversationCard({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      dir="rtl"
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 text-right transition-all duration-200 cursor-pointer border-b border-border/30 last:border-0",
        active
          ? "bg-primary/8 border-r-2 border-r-primary"
          : "hover:bg-accent/40"
      )}
    >
      {/* Avatar + online dot */}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.avatar}`} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">{conv.name[0]}</AvatarFallback>
        </Avatar>
        {conv.online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn("text-sm font-semibold truncate", active && "text-primary")}>{conv.name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0 mr-2">{conv.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn("text-xs truncate", conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
            {conv.lastMsg}
          </p>
          {conv.unread > 0 && (
            <Badge className="h-4 min-w-4 px-1 text-[10px] gradient-primary text-primary-foreground border-0 rounded-full shrink-0 mr-2">
              {conv.unread}
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function MessageBubble({ msg, prevFrom }: { msg: Message; prevFrom?: "me" | "them" }) {
  const isMe = msg.from === "me";
  const showAvatar = !isMe && prevFrom !== "them";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-end gap-2 mb-1.5", isMe ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar placeholder for alignment */}
      {!isMe && (
        <div className="w-7 shrink-0">
          {showAvatar && (
            <Avatar className="h-7 w-7">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=them`} />
              <AvatarFallback className="text-[10px]">ר</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[70%]", isMe && "items-end")}>
        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
            isMe
              ? "bg-primary text-primary-foreground rounded-tl-sm"
              : "bg-secondary text-foreground rounded-tr-sm"
          )}
        >
          {msg.text}
        </div>
        <div className={cn("flex items-center gap-1 mt-1", isMe ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-muted-foreground">{msg.time}</span>
          {isMe && (
            msg.read
              ? <CheckCheck className="h-3 w-3 text-primary" />
              : <Check className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */

export default function ChatsPage() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const [showChat, setShowChat] = useState(false); // mobile: show chat panel
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const convParam = searchParams.get("conv");
    if (convParam) {
      setSelectedId(Number(convParam));
      setShowChat(true);
    }
  }, [searchParams]);

  const filteredConvs = mockConversations.filter((c) => {
    const matchSearch = c.name.includes(search) || c.lastMsg.includes(search);
    const matchFilter = filter === "all" || c.unread > 0;
    return matchSearch && matchFilter;
  });

  const selectedConv = mockConversations.find((c) => c.id === selectedId);
  const currentMessages = selectedId ? (messages[selectedId] ?? []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const sendMessage = () => {
    if (!inputText.trim() || !selectedId) return;
    const newMsg: Message = {
      id: Date.now(),
      text: inputText.trim(),
      from: "me",
      time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), newMsg] }));
    setInputText("");
  };

  const handleSelectConv = (id: number) => {
    setSelectedId(id);
    setShowChat(true);
  };

  return (
    <div dir="rtl" className="flex h-[calc(100vh-5rem)] rounded-2xl overflow-hidden border border-border/40 bg-background shadow-sm">

      {/* ── Conversations List ── */}
      <div
        className={cn(
          "flex flex-col border-l border-border/40 bg-card",
          "w-full md:w-80 lg:w-96 shrink-0",
          showChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* List Header */}
        <div className="p-4 border-b border-border/40">
          <h2 className="font-bold text-lg mb-3">הודעות</h2>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="חפש שיחה..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 h-9 bg-secondary/50 border-border/30 rounded-xl text-sm"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-lg transition-all duration-200",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary"
                )}
              >
                {f === "all" ? "כל השיחות" : "לא נקראו"}
              </button>
            ))}
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence>
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">לא נמצאו שיחות</div>
            ) : (
              filteredConvs.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conv={conv}
                  active={conv.id === selectedId}
                  onClick={() => handleSelectConv(conv.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showChat && "hidden md:flex",
          showChat && "flex"
        )}
      >
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 flex items-center gap-3 border-b border-border/40 bg-card shrink-0">
              {/* Back button — mobile */}
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConv.avatar}`} />
                  <AvatarFallback className="text-xs">{selectedConv.name[0]}</AvatarFallback>
                </Avatar>
                {selectedConv.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{selectedConv.name}</p>
                <p className="text-xs text-emerald-500">{selectedConv.online ? "מחובר/ת עכשיו" : "לא מחובר/ת"}</p>
              </div>

              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<button />}
                    className="p-2 rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl w-48">
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => {
                        const hasUnread = (messages[selectedId!] ?? []).some(m => !m.read && m.from === "them");
                        setMessages(prev => ({
                          ...prev,
                          [selectedId!]: (prev[selectedId!] ?? []).map(m => ({ ...m, read: !hasUnread ? false : true }))
                        }));
                        toast.success(hasUnread ? "השיחה סומנה כנקראה" : "השיחה סומנה כלא נקראה");
                      }}
                    >
                      <CheckCheck className="h-4 w-4" />
                      סמן כנקרא / לא נקרא
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => toast.error(`${selectedConv?.name} נחסם/ה`, { description: "ניתן לבטל חסימה בהגדרות" })}
                    >
                      <UserX className="h-4 w-4" />
                      חסום משתמש
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-0.5">
              {currentMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  prevFrom={i > 0 ? currentMessages[i - 1].from : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-border/40 bg-card shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="כתוב הודעה..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-secondary/50 border-border/30 rounded-xl h-10 text-sm"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="h-10 w-10 rounded-xl gradient-primary border-0 shadow-sm shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">הודעות</h3>
            <p className="text-sm text-muted-foreground max-w-xs">בחר שיחה מהרשימה כדי להתחיל לצ׳אט</p>
          </div>
        )}
      </div>
    </div>
  );
}
