'use client';

import { useState } from "react";
import Link from "next/link";
import { Users, Lock, Globe, Bell, BellOff, Search, Filter, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGroups } from "@/hooks/useGroups";
import { useJoinGroup } from "@/hooks/useJoinGroup";
import { useLeaveGroup } from "@/hooks/useLeaveGroup";
import { useMyGroupIds } from "@/hooks/useMyGroupIds";
import { toast } from "sonner";

const sortOptions = [
  { id: "popular", label: "פופולריים" },
  { id: "newest", label: "חדשים" },
  { id: "active", label: "פעילים" },
];

export default function Groups() {
  const { data: groups, isLoading, isError } = useGroups();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const { data: myGroupIds } = useMyGroupIds();
  const [search, setSearch] = useState("");
  const [activeSort, setActiveSort] = useState("popular");
  const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");

  const toggleJoin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const isMember = myGroupIds?.has(id) ?? false;
    if (isMember) {
      leaveGroup.mutate(id, {
        onError: () => {
          toast.error("שגיאה", { description: "לא הצלחנו לעזוב את הקבוצה. נסו שוב." });
        },
      });
    } else {
      joinGroup.mutate(id, {
        onError: () => {
          toast.error("שגיאה", { description: "לא הצלחנו להצטרף לקבוצה. נסו שוב." });
        },
      });
    }
  };

  const isMutating = joinGroup.isPending || leaveGroup.isPending;

  const filtered = (groups ?? [])
    .filter((g) => {
      if (search && !g.name.includes(search) && !(g.description ?? "").includes(search)) return false;
      if (filterType === "public" && g.is_private) return false;
      if (filterType === "private" && !g.is_private) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeSort === "popular") return b.memberCount - a.memberCount;
      if (activeSort === "active") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (activeSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
            <Users className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none">קבוצות</h1>
            <p className="text-xs text-muted-foreground mt-0.5">הצטרפו לקהילות משנה שמתאימות לתחומי העניין שלכם</p>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש קבוצה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9 rounded-xl bg-secondary/30 border-border/50"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "public", "private"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                filterType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
              }`}
            >
              {type === "all" && "הכל"}
              {type === "public" && <><Globe className="h-3 w-3" /> ציבוריות</>}
              {type === "private" && <><Lock className="h-3 w-3" /> פרטיות</>}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {sortOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveSort(opt.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeSort === opt.id
                ? "bg-secondary text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <Badge variant="secondary" className="mr-auto text-[10px] h-5 rounded-full">
          {filtered.length} קבוצות
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-card/40 rounded-2xl border border-border/40">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">שגיאה בטעינת הקבוצות</p>
          <p className="text-xs text-muted-foreground mt-1">נסו לרענן את הדף</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card/40 rounded-2xl border border-border/40">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-muted-foreground">לא נמצאו קבוצות</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((g) => {
            const isMember = myGroupIds?.has(g.id) ?? false;
            const coverImage = g.banner_url ?? g.thumbnail_url ?? "/assets/groups/default.jpg";
            return (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden card-shadow border border-border/50 hover:elevated-shadow hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group block"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={coverImage}
                    alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <Badge variant="secondary" className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-[10px]">
                    {g.is_private ? <><Lock className="h-3 w-3 ml-1" /> פרטית</> : <><Globe className="h-3 w-3 ml-1" /> ציבורית</>}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-2">{g.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {g.memberCount} חברים</span>
                    </div>
                    <Button size="sm" variant={isMember ? "outline" : "default"} className={`rounded-full text-xs h-8 px-4 ${isMember ? "" : "gradient-primary shadow-md"}`} disabled={isMutating} onClick={(e) => toggleJoin(g.id, e)}>
                      {isMember ? <><BellOff className="h-3.5 w-3.5 ml-1" /> עוזב/ת</> : <><Bell className="h-3.5 w-3.5 ml-1" /> הצטרפות</>}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                    <div className="flex -space-x-2 space-x-reverse">
                      {[1, 2, 3, 4].map((ii) => (
                        <Avatar key={ii} className="h-6 w-6 border-2 border-card">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${g.id}${ii}`} />
                          <AvatarFallback className="text-[8px]">U</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {g.memberCount > 4 ? `ו-${g.memberCount - 4} חברים נוספים` : `${g.memberCount} חברים`}
                    </span>
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
