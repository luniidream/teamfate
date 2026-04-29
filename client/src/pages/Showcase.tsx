import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Eye, EyeOff, Calendar, MapPin, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const SHOWCASE_BG = "#0a0e14";

export default function Showcase() {
  const [, setLocation] = useLocation();
  const { data: shinies = [], isLoading } = trpc.shinies.list.useQuery();
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "count">("count");

  const memberNames = useMemo(() => {
    const set = new Set<string>();
    shinies.forEach((s) => set.add(s.memberDisplayName));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [shinies]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof shinies>();
    for (const s of shinies) {
      const key = s.memberDisplayName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    
    const entries = Array.from(map.entries());
    
    if (sortBy === "count") {
      return entries.sort((a, b) => b[1].length - a[1].length);
    } else {
      return entries.sort((a, b) => a[0].localeCompare(b[0]));
    }
  }, [shinies, sortBy]);

  const toggleMemberExpansion = (memberName: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberName)) {
        newSet.delete(memberName);
      } else {
        newSet.add(memberName);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SHOWCASE_BG, color: "#e2e8f0" }}>
        <Loader2 className="animate-spin text-sky-400" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e2e8f0]" style={{ background: SHOWCASE_BG }}>
      <div className="container py-10 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-sans tracking-tight text-white">Shiny Showcase</h1>
            <p className="text-slate-400 text-sm">Collections by member</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              <Button
                variant={sortBy === "count" ? "default" : "outline"}
                onClick={() => setSortBy("count")}
                className="text-sm"
                style={{
                  background: sortBy === "count" ? "#ec4899" : "transparent",
                  color: sortBy === "count" ? "white" : "#e2e8f0",
                  border: "1px solid rgba(236, 72, 153, 0.3)",
                  boxShadow: sortBy === "count" ? "0 0 10px rgba(236, 72, 153, 0.5)" : "none"
                }}
              >
                Sort by count
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "outline"}
                onClick={() => setSortBy("name")}
                className="text-sm"
                style={{
                  background: sortBy === "name" ? "#ec4899" : "transparent",
                  color: sortBy === "name" ? "white" : "#e2e8f0",
                  border: "1px solid rgba(236, 72, 153, 0.3)",
                  boxShadow: sortBy === "name" ? "0 0 10px rgba(236, 72, 153, 0.5)" : "none"
                }}
              >
                Sort by name
              </Button>
            </div>
            
            <Button
              onClick={() => setLocation("/member-login")}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white font-bold"
              style={{ boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)" }}
            >
              <Plus size={18} />
              Add/Edit Shinies
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {grouped.map(([memberName, memberShinies]) => {
            const isExpanded = expandedMembers.has(memberName);
            const visibleShinies = isExpanded ? memberShinies : memberShinies.slice(0, 12);

            return (
              <section key={memberName} className="border border-slate-700 rounded-lg p-6 bg-slate-800/50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-amber-300 font-bold text-xl md:text-2xl">✨ {memberName} ✨</span>
                    <span className="text-slate-300 text-base md:text-lg font-medium bg-slate-700 px-3 py-1 rounded-full">
                      {memberShinies.length} {memberShinies.length === 1 ? "Shiny" : "Shinies"}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleMemberExpansion(memberName)}
                    className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <EyeOff size={20} />
                        <span>Hide details</span>
                      </>
                    ) : (
                      <>
                        <Eye size={20} />
                        <span>View all ({memberShinies.length})</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {visibleShinies.map((shiny) => {
                    const showSparkle = shiny.isSecret || (shiny.shinyTypeName?.toLowerCase().includes("secret") ?? false);
                    return (
                      <div key={shiny.id} className="group relative bg-slate-900 rounded-lg p-4 hover:bg-slate-800 transition-colors">
                        {showSparkle && (
                          <span className="absolute top-2 left-2 text-amber-300 text-sm select-none" aria-hidden>
                            ✦
                          </span>
                        )}
                        
                        <div className="flex justify-center mb-3">
                          <img
                            src={
                              shiny.pokemonSpriteUrl ||
                              `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${shiny.pokemonId}.png`
                            }
                            alt={shiny.pokemonName}
                            className="w-16 h-16 md:w-20 md:h-20 object-contain"
                            style={{ imageRendering: "pixelated" }}
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="text-center space-y-2">
                          <div className="font-semibold text-white text-sm">{shiny.pokemonName}</div>
                          {shiny.nickname && (
                            <div className="text-xs text-slate-400 italic">"{shiny.nickname}"</div>
                          )}
                          
                          <div className="space-y-1 text-xs text-slate-400">
                            {shiny.shinyTypeName && (
                              <div className="flex items-center gap-1">
                                <Tag size={12} />
                                <span>{shiny.shinyTypeName}</span>
                              </div>
                            )}
                            {shiny.shinyMethodName && (
                              <div className="flex items-center gap-1">
                                <span className="px-2 py-1 bg-slate-700 rounded text-xs">{shiny.shinyMethodName}</span>
                              </div>
                            )}
                            {shiny.caughtAt && (
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(shiny.caughtAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {shiny.location && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{shiny.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {!isExpanded && memberShinies.length > 12 && (
                    <div className="flex items-center justify-center bg-slate-900 rounded-lg p-4">
                      <div className="text-center text-slate-400">
                        <div className="text-2xl font-bold text-white mb-1">+{memberShinies.length - 12}</div>
                        <div className="text-xs">more shinies</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {grouped.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-6">No shinies logged yet.</p>
            <Button
              onClick={() => setLocation("/member-login")}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
              style={{ boxShadow: "0 0 10px rgba(236, 72, 153, 0.5)" }}
            >
              <Plus size={18} />
              Be the first to add a shiny!
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
