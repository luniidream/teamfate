import { useMemo, useState } from "react";
import { useListShinies } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

export default function Showcase() {
  const [search, setSearch] = useState("");
  const { data: shiniesData, isLoading } = useListShinies({
    query: {
      queryKey: ["shinies-showcase"],
    },
  });

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = (shiniesData?.shinies ?? []).filter((s) => {
      if (!query) return true;
      return (
        s.pokemonName.toLowerCase().includes(query) ||
        s.memberDisplayName.toLowerCase().includes(query)
      );
    });

    const byPlayer = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = row.memberDisplayName || "Unknown";
      if (!byPlayer.has(key)) byPlayer.set(key, []);
      byPlayer.get(key)!.push(row);
    }

    return Array.from(byPlayer.entries())
      .map(([player, shinies]) => ({ player, shinies }))
      .sort((a, b) => b.shinies.length - a.shinies.length);
  }, [shiniesData?.shinies, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            SHINY SHOWCASE
          </h1>
          <p className="text-muted-foreground">
            Player grouped catches like your showcase board.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search player or Pokemon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse glass-panel" />
          ))}
        </div>
      ) : grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.player} className="space-y-4">
              <h2 className="text-xl font-mono font-bold text-white text-center">
                <span className="text-primary">✦</span> {group.player} ({group.shinies.length}){" "}
                <span className="text-primary">✦</span>
              </h2>
              <div className="glass-panel p-4 rounded-xl">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Shiny Pokemons Caught
                </p>
                <div className="flex flex-wrap gap-4">
                  {group.shinies.map((shiny) => (
                    <img
                      key={shiny.id}
                      src={shiny.pokemonSpriteUrl}
                      alt={shiny.pokemonName}
                      title={`${shiny.pokemonName} • ${group.player}`}
                      className="w-12 h-12 object-contain pixel-sprite drop-shadow-[0_0_8px_rgba(255,110,180,0.45)]"
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-xl flex flex-col items-center justify-center text-muted-foreground space-y-4">
          <Sparkles className="w-12 h-12 opacity-20" />
          <p className="text-lg">No shinies found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
