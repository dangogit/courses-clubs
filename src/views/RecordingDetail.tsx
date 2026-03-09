'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  Play,
  Share2,
  Bookmark,
  CheckCircle2,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import WatchedButton from "@/components/WatchedButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { initialRecordings } from "@/data/recordings";
import CommentsSection, { type Comment } from "@/components/CommentsSection";


const mockComments: Comment[] = [
  {
    id: 1,
    author: "שי לי אמנון",
    avatar: "shai",
    text: "הרצאה מעולה! למדתי המון דברים חדשים. תודה רבה",
    date: "לפני 3 ימים",
    likes: 12,
    replies: [
      { id: 11, author: "עדן ביבס", avatar: "eden", date: "לפני יומיים", text: "תודה רבה! שמח שעזר לך. אם יש שאלות — אשמח לעזור 🙌", likes: 5, replyingTo: "שי לי אמנון" },
    ],
  },
  {
    id: 2,
    author: "מיכל כהן",
    avatar: "michal2",
    text: "אפשר לקבל את הקישורים שהוזכרו בהרצאה?",
    date: "לפני 5 ימים",
    likes: 4,
    replies: [
      { id: 21, author: "עדן ביבס", avatar: "eden", date: "לפני 4 ימים", text: "הוספתי את כל הקישורים בתיאור! תסתכלי בקטע 'קישורים וחומרים' 👇", likes: 8, replyingTo: "מיכל כהן" },
      { id: 22, author: "דני ברק", avatar: "dani", date: "לפני 4 ימים", text: "תודה! גם אני חיפשתי אותם", likes: 2, replyingTo: "מיכל כהן" },
    ],
  },
  { id: 3, author: "דני ברק", avatar: "dani", text: "מחכה לחלק הבא! 🔥", date: "לפני שבוע", likes: 7, replies: [] },
];

const categoryColors: Record<string, string> = {
  "למתחילים": "bg-emerald-500/10 text-emerald-600",
  "ליוצרי תוכן": "bg-purple-500/10 text-purple-600",
  "לבעלי עסקים": "bg-blue-500/10 text-blue-600",
  "אוטומציות": "bg-orange-500/10 text-orange-600",
  "וייב קודינג": "bg-pink-500/10 text-pink-600",
};
export default function RecordingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const recordingIndex = parseInt(id || "0");
  const recording = initialRecordings[recordingIndex];

  const { isWatched, toggleWatched, watchedCount, totalCount } = useWatchedProgress("recording");
  const watched = isWatched(recordingIndex);
  const remaining = totalCount - (watchedCount + (watched ? 0 : 1));

  const [bookmarked, setBookmarked] = useState(false);

  const prevRecording = recordingIndex > 0 ? recordingIndex - 1 : null;
  const nextRecording = recordingIndex < initialRecordings.length - 1 ? recordingIndex + 1 : null;

  if (!recording) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">ההקלטה לא נמצאה</p>
        <Button variant="link" onClick={() => router.push("/recordings")}>חזרה להקלטות</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link href="/recordings" className="hover:text-primary transition-colors font-medium">
          הקלטות
        </Link>
        <ChevronRight className="h-3 w-3 rotate-180 shrink-0" />
        <span className="text-foreground font-semibold truncate max-w-[250px]">{recording.title}</span>
      </nav>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between mb-5 bg-card/60 rounded-xl border border-border/40 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={prevRecording === null}
          onClick={() => prevRecording !== null && router.push(`/recordings/${prevRecording}`)}
          className="text-xs gap-1.5 cursor-pointer"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          הקודמת
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {recordingIndex + 1} / {initialRecordings.length}
          <span className="mx-1.5 text-border">·</span>
          <span className="text-emerald-600 font-medium">{watchedCount} נצפו</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={nextRecording === null}
          onClick={() => nextRecording !== null && router.push(`/recordings/${nextRecording}`)}
          className="text-xs gap-1.5 cursor-pointer"
        >
          הבאה
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        </Button>
      </div>

      {/* Title & meta */}
      <div className="mb-4">
        <h1 className="font-display text-xl md:text-2xl font-bold leading-tight mb-3">
          {recording.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {recording.categories.map((cat) => (
            <span
              key={cat}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                categoryColors[cat] ?? "bg-primary/10 text-primary"
              }`}
            >
              {cat}
            </span>
          ))}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mr-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {recording.date}</span>
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {recording.views.toLocaleString()} צפיות</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recording.duration}</span>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div
        className={`w-full aspect-video rounded-2xl bg-gradient-to-br ${recording.gradient} relative flex items-center justify-center overflow-hidden mb-4 group cursor-pointer shadow-lg`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,hsla(0,0%,100%,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Play button */}
        <div className="relative h-20 w-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all duration-300 shadow-2xl">
          <Play className="h-9 w-9 text-white mr-[-3px]" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {recording.duration}
          </span>
        </div>

        {/* Watch label */}
        <div className="absolute bottom-4 right-4">
          <span className="bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5">
            <Play className="h-3 w-3 fill-current" />
            לחצו לצפייה
          </span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 mb-5">
        <WatchedButton
          watched={watched}
          onToggle={() => toggleWatched(recordingIndex)}
          remaining={remaining}
        />
        <div className="flex items-center gap-1 mr-auto">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              bookmarked
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
            שמור
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            שתף
          </button>
        </div>
      </div>

      {/* Speaker Info */}
      <div className="flex items-center gap-3 bg-card/60 rounded-2xl border border-border/40 p-4 mb-5">
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${recording.avatar}`} />
          <AvatarFallback className="font-bold">{recording.speaker[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{recording.speaker}</p>
          <p className="text-xs text-muted-foreground">מרצה ומנחה · מועדון Brain AI</p>
        </div>
        <Badge variant="secondary" className="text-xs">מרצה</Badge>
      </div>

      {/* Description */}
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-5 mb-5">
        <h2 className="font-bold text-sm mb-3">על ההרצאה</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          <strong>{recording.description}</strong>
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          {recording.speaker} מרצה על {recording.title}. בהרצאה זו תלמדו על הכלים, השיטות והטכניקות החדשות ביותר בתחום. ההרצאה כוללת דוגמאות מעשיות, טיפים מהשטח ותובנות שיעזרו לכם ליישם את מה שלמדתם מיד.
        </p>
        <p className="text-sm font-semibold mb-2">מה תלמדו בהרצאה:</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {["מבוא ורקע על הנושא", "הדגמה מעשית של הכלים המרכזיים", "טיפים וטריקים מהניסיון", "שאלות ותשובות מהקהילה"].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-px">+</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Related Links */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          קישורים וחומרים
        </h3>
        <ul className="space-y-2.5">
          {[
            "לינק לפרזנטציה של ההרצאה",
            "כלים שהוזכרו בהרצאה — כל הלינקים והשלבים",
            "לינק למאמר המלא",
          ].map((link, i) => (
            <li key={i}>
              <a
                href="#"
                className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Watched status summary */}
      {watched && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 mb-6">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            צפית בהקלטה הזו · {remaining > 0 ? `עוד ${remaining} הקלטות לצפייה` : "כל ההקלטות נצפו!"}
          </p>
        </div>
      )}

      <Separator className="mb-6" />

      <CommentsSection
        storageKey={`recording-${recordingIndex}`}
        initialComments={mockComments}
        notifyAdmin={true}
        contextLabel="הקלטה"
        contextTitle={recording.title}
      />
    </div>
  );
}
