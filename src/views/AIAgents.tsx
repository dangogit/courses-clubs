'use client';

import { useState } from "react";
import Link from "next/link";
import { Bot, Sparkles, ExternalLink, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agents as initialAgents } from "@/data/agents";

const categories = ["הכל", ...Array.from(new Set(initialAgents.map((a) => a.category)))];

const topAgent = initialAgents.reduce((top, a) => a.name === "סוכן שיווק דיגיטלי" ? a : top, initialAgents[0]);

export default function AIAgents() {
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [search, setSearch] = useState("");

  const filtered = initialAgents.filter((agent) => {
    if (activeCategory !== "הכל" && agent.category !== activeCategory) return false;
    if (search && !agent.name.includes(search) && !agent.description.includes(search) && !agent.category.includes(search)) return false;
    return true;
  });

  const handleActivateAgent = (e: React.MouseEvent, externalUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header — matches Recordings / Courses pattern */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">סוכני AI</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {initialAgents.length} סוכנים מוכנים לשימוש — בלי קוד, בלי מאמץ
            </p>
          </div>
        </div>
      </div>

      {/* Search + Category filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש סוכן..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 rounded-xl bg-secondary/30 border-border/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card/40 rounded-2xl border border-border/40">
          <Bot className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">לא נמצאו סוכנים</p>
          <p className="text-xs text-muted-foreground/60 mt-1">נסו לשנות את החיפוש או הפילטר</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const isTop = agent.name === topAgent.name;
            return (
              <Link key={agent.name} href={`/ai-agents/${agent.id}`} className="block h-full">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl card-shadow border border-border/50 overflow-hidden hover:elevated-shadow hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
                  {/* Header with gradient */}
                  <div className={`h-28 bg-gradient-to-br ${agent.gradient} relative flex items-center px-5 gap-4 overflow-hidden`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,hsla(0,0%,100%,0.1),transparent_50%)]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    {isTop && (
                      <div className="absolute top-2.5 left-2.5">
                        <Badge className="bg-warning/90 text-warning-foreground border-0 text-[10px] font-bold gap-1">
                          <Sparkles className="h-3 w-3" />
                          מומלץ
                        </Badge>
                      </div>
                    )}
                    <div className="relative h-14 w-14 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-primary-foreground/30 transition-all duration-300 shadow-lg">
                      <agent.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="relative">
                      <h3 className="font-bold text-primary-foreground text-base leading-snug">{agent.name}</h3>
                      <p className="text-primary-foreground/60 text-[11px] mt-0.5">{agent.category}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">{agent.description}</p>

                    <Button
                      size="sm"
                      className="mt-3 w-full rounded-xl gap-1.5 text-xs font-bold gradient-primary hover:opacity-90 transition-opacity"
                      onClick={(e) => handleActivateAgent(e, agent.externalUrl)}
                      disabled={!agent.externalUrl}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      הפעל סוכן
                    </Button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
