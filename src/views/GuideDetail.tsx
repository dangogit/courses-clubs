'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Clock, Tag, Lightbulb, BookOpen, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { writtenGuides } from "@/data/tutorials";
import ReadButton from "@/components/ReadButton";
import { useWatchedProgress } from "@/hooks/useWatchedProgress";
import { getTagColor } from "@/lib/tagColors";

export default function GuideDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [tocOpen, setTocOpen] = useState(true);
  const { isWatched, toggleWatched } = useWatchedProgress("guide");
  const guideId = Number(id);

  const guide = writtenGuides.find((g) => g.id === guideId);

  if (!guide) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" dir="rtl">
        <p className="text-muted-foreground">המדריך לא נמצא.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/tutorials")}>
          חזרה להדרכות
        </Button>
      </div>
    );
  }

  const related = writtenGuides.filter((g) => guide.relatedIds.includes(g.id));

  return (
    <div dir="rtl">
      {/* -- Hero -- */}
      {guide.coverImage ? (
        <div className="relative w-full h-72 overflow-hidden">
          <img src={guide.coverImage} alt={guide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-7 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`border-0 text-xs px-2.5 py-0.5 ${getTagColor(guide.tag)}`}>
                <Tag className="h-3 w-3 ml-1" />{guide.tag}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" />{guide.readTime}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight drop-shadow-lg">
              {guide.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-b border-border/40 px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 border-0 ${getTagColor(guide.tag)}`}>
                <Tag className="h-3 w-3 ml-1" />{guide.tag}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{guide.readTime}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{guide.title}</h1>
          </div>
        </div>
      )}

      {/* -- Content area -- */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => router.push("/tutorials")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          חזרה להדרכות
        </button>

        {/* -- Two-column layout -- */}
        <div className="flex gap-8 items-start">

          {/* -- Right: Sticky ToC -- */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-6 self-start">
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-foreground/70 hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  תוכן עניינים
                </span>
                {tocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {tocOpen && (
                <nav className="px-4 pb-4 pt-1 border-t border-border/40">
                  <ol className="space-y-1">
                    {guide.sections.map((section, i) => (
                      <li key={i}>
                        <a
                          href={`#section-${i}`}
                          className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-emerald-700 hover:bg-emerald-500/5 rounded-lg px-2 py-1.5 transition-all duration-150 group"
                        >
                          <span className="h-5 w-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-emerald-500/15 group-hover:text-emerald-700 transition-colors">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{section.title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>
          </aside>

          {/* -- Left: Main content -- */}
          <main className="flex-1 min-w-0">
            {/* Mobile ToC */}
            <div className="lg:hidden mb-6 rounded-2xl border border-border/50 bg-card overflow-hidden">
              <button
                onClick={() => setTocOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-foreground/70"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  תוכן עניינים
                </span>
                {tocOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {tocOpen && (
                <nav className="px-4 pb-4 pt-1 border-t border-border/40">
                  <ol className="space-y-1">
                    {guide.sections.map((section, i) => (
                      <li key={i}>
                        <a href={`#section-${i}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-emerald-700 rounded-lg px-2 py-1.5 transition-colors">
                          <span className="h-5 w-5 rounded-full bg-muted text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>

            {/* Lead paragraph */}
            <p className="text-base sm:text-lg leading-8 text-muted-foreground border-r-4 border-emerald-500/60 pr-4 mb-10">
              {guide.description}
            </p>

            {/* Sections */}
            <div className="space-y-12">
              {guide.sections.map((section, i) => (
                <article key={i} id={`section-${i}`} className="scroll-mt-6">
                  {/* Section heading */}
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl font-black text-emerald-500/25 leading-none select-none shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold leading-snug">{section.title}</h2>
                  </div>

                  <div className="h-px bg-border/50 mb-5" />

                  {/* Content */}
                  <p className="text-base sm:text-[17px] leading-[1.9] text-foreground/85 mb-5">
                    {section.content}
                  </p>

                  {/* Tip box */}
                  {section.tip && (
                    <div className="flex gap-4 bg-amber-500/5 border border-amber-500/20 border-r-4 border-r-amber-500 rounded-xl rounded-r-none p-4">
                      <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-700 mb-1">טיפ מקצועי</p>
                        <p className="text-sm leading-relaxed text-foreground/80">{section.tip}</p>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Read button */}
            <div className="mt-10 pt-8 border-t border-border/50 flex items-center gap-4">
              <ReadButton
                read={isWatched(guideId)}
                onToggle={() => toggleWatched(guideId)}
              />
              {isWatched(guideId) && (
                <span className="text-sm text-muted-foreground">המדריך הזה מסומן כנקרא</span>
              )}
            </div>

            {/* Related Guides */}
            {related.length > 0 && (
              <div className="mt-14 pt-8 border-t border-border/50">
                <h2 className="text-base font-bold mb-5 text-muted-foreground uppercase tracking-wider text-xs">מדריכים נוספים שיעניינו אותך</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/tutorials/guide/${item.id}`)}
                      className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
                    >
                      {item.coverImage ? (
                        <div className="relative h-28 overflow-hidden">
                          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-28 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-emerald-500/40" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs border-0 ${getTagColor(item.tag)}`}>{item.tag}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />{item.readTime}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
