'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Clock, Play, Plus, Tag, Maximize2, Minimize2 } from "lucide-react";
import BunnyPlayer from "@/components/BunnyPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { videoTutorials } from "@/data/tutorials";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import WatchedButton from "@/components/WatchedButton";

export default function VideoTutorialDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const tutorial = videoTutorials.find((v) => v.id === Number(id));

  if (!tutorial) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" dir="rtl">
        <p className="text-muted-foreground">ההדרכה לא נמצאה.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/tutorials")}>
          חזרה להדרכות
        </Button>
      </div>
    );
  }

  const { isWatched, toggleWatched } = useWatchedProgress("tutorial");
  const watched = isWatched(tutorial.id);
  const [theaterMode, setTheaterMode] = useState(false);

  const popular = videoTutorials.filter((v) => v.id !== tutorial.id).slice(0, 3);

  return (
    <div className={theaterMode ? "w-full px-4 py-8" : "max-w-3xl mx-auto px-4 py-8"} dir="rtl">
      {/* Back */}
      <button
        onClick={() => router.push("/tutorials")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        חזרה להדרכות
      </button>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Tag className="h-3.5 w-3.5 ml-1" />
          {tutorial.tag}
        </Badge>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {tutorial.duration}
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl font-bold leading-snug mb-2">{tutorial.title}</h1>
      <p className="text-base leading-relaxed text-muted-foreground mb-8">{tutorial.description}</p>

      {/* Video Player */}
      <BunnyPlayer
        videoUrl={tutorial.videoUrl}
        thumbnailUrl={tutorial.thumbnail}
        theaterMode={theaterMode}
        durationLabel={tutorial.duration}
      />

      {/* Watched Button + Theater toggle */}
      <div className="flex items-center gap-2 mb-5">
        <WatchedButton
          watched={watched}
          onToggle={() => toggleWatched(tutorial.id)}
        />
        <button
          onClick={() => setTheaterMode(t => !t)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            theaterMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
          title={theaterMode ? "יציאה ממצב תיאטרון" : "מצב תיאטרון"}
        >
          {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* What you'll learn */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3 text-foreground">מה תלמד:</h2>
        <ul className="space-y-2">
          {tutorial.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <Plus className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span className="text-sm leading-relaxed text-foreground/80">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular */}
      {popular.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4">הדרכות פופולריות</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popular.map((item) => (
              <div
                key={item.id}
                onClick={() => router.push(`/tutorials/video/${item.id}`)}
                className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Play className="h-4 w-4 text-foreground fill-foreground me-[-1px]" />
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 start-1.5 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.duration}
                  </div>
                </div>
                <div className="p-3">
                  <Badge variant="secondary" className="text-xs mb-1.5">{item.tag}</Badge>
                  <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
