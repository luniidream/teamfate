import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetPokedex } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Grid as GridIcon,
  Filter,
  Info,
  Star,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { fetchNationalDexNational649 } from "@/lib/national-dex";
import { gen5AnimatedFrontGifUrl, gen5AnimatedShinyGifUrl } from "@/lib/sprites";

const REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Paldea",
  "Hisui",
];

type DexEntry = {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  hoverSpriteUrl: string;
  types: string[];
  generation: number;
  region: string;
  ownedBy: Array<{
    id: number;
    memberDisplayName?: string | null;
    caughtAt: string;
    shinyTypeName?: string | null;
    isAlpha?: boolean | null;
    isSecret?: boolean | null;
  }>;
  ownershipStatus: "owned" | "missing";
  evolutionLineStatus: string;
};

export default function ShinyDex() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [alphaOnly, setAlphaOnly] = useState(false);
  const [secretOnly, setSecretOnly] = useState(false);

  const { data: pokedexData, isLoading: pokedexLoading } = useGetPokedex(
    undefined,
    {
      query: { queryKey: ["pokedex"] },
    },
  );

  const nationalDexQuery = useQuery({
    queryKey: ["national-dex-649-shiny-dex"],
    queryFn: fetchNationalDexNational649,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const entries = useMemo<DexEntry[]>(() => {
    const ownedEntries = pokedexData?.entries ?? [];
    const ownedByPokemonId = new Map(
      ownedEntries.map((entry) => [entry.pokemonId, entry]),
    );

    return (nationalDexQuery.data ?? []).map((pokemon) => {
      const ownedEntry = ownedByPokemonId.get(pokemon.id);
      const ownedBy = ownedEntry?.ownedBy ?? [];
      const isOwned = ownedBy.length > 0;

      return {
        pokemonId: pokemon.id,
        name: pokemon.name,
        spriteUrl: isOwned
          ? ownedEntry?.spriteUrl || gen5AnimatedShinyGifUrl(pokemon.id)
          : gen5AnimatedFrontGifUrl(pokemon.id),
        hoverSpriteUrl: isOwned
          ? ownedEntry?.spriteUrl || gen5AnimatedShinyGifUrl(pokemon.id)
          : gen5AnimatedFrontGifUrl(pokemon.id),
        types: ownedEntry?.types ?? [],
        generation: ownedEntry?.generation ?? 1,
        region: ownedEntry?.region ?? "Unknown",
        ownedBy,
        ownershipStatus: isOwned ? "owned" : "missing",
        evolutionLineStatus: ownedEntry?.evolutionLineStatus ?? "missing",
      };
    });
  }, [nationalDexQuery.data, pokedexData?.entries]);

  const filteredEntries = entries.filter((entry) => {
    if (
      search &&
      !entry.name.toLowerCase().includes(search.toLowerCase()) &&
      entry.pokemonId.toString() !== search
    ) {
      return false;
    }
    if (
      region !== "all" &&
      entry.region.toLowerCase() !== region.toLowerCase()
    ) {
      return false;
    }
    if (alphaOnly && !entry.ownedBy.some((record) => record.isAlpha)) {
      return false;
    }
    if (secretOnly && !entry.ownedBy.some((record) => record.isSecret)) {
      return false;
    }
    return true;
  });

  const totalOwned = entries.filter(
    (entry) => entry.ownershipStatus === "owned",
  ).length;
  const totalPokemon = entries.length;
  const percent = totalPokemon > 0 ? (totalOwned / totalPokemon) * 100 : 0;
  const isLoading = pokedexLoading || nationalDexQuery.isLoading;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)]">
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6">
        <div className="glass-panel p-5 rounded-xl border-primary/20 space-y-6">
          <div>
            <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
              <GridIcon className="w-5 h-5 text-primary" />
              SHINY DEX
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Guild completion
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm font-mono">
                <span className="text-secondary">{totalOwned}</span>
                <span className="text-muted-foreground">/ {totalPokemon}</span>
              </div>
              <Progress value={percent} className="h-2 bg-white/10" />
              <div className="text-right text-xs text-primary font-mono">
                {percent.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4" /> FILTERS
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-white"
              />
            </div>

            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white">
                <SelectItem value="all">All regions</SelectItem>
                {REGIONS.map((value) => (
                  <SelectItem key={value} value={value.toLowerCase()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="alpha-toggle"
                  className="text-sm cursor-pointer text-muted-foreground hover:text-white transition-colors"
                >
                  Alpha found
                </Label>
                <Switch
                  id="alpha-toggle"
                  checked={alphaOnly}
                  onCheckedChange={setAlphaOnly}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="secret-toggle"
                  className="text-sm cursor-pointer text-muted-foreground hover:text-white transition-colors"
                >
                  Secret found
                </Label>
                <Switch
                  id="secret-toggle"
                  checked={secretOnly}
                  onCheckedChange={setSecretOnly}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2">
            <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4" /> LEGEND
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded bg-primary/20 border border-primary/50" />
              <span>Owned (glowing)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded bg-black/40 border border-white/10" />
              <span>Missing (silhouette)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-xl border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <span className="text-sm font-mono text-muted-foreground">
            Showing {filteredEntries.length} Pokemon
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {filteredEntries.map((entry) => {
                const isOwned = entry.ownershipStatus === "owned";
                const hasAlpha = entry.ownedBy.some((record) => record.isAlpha);
                const hasSecret = entry.ownedBy.some(
                  (record) => record.isSecret,
                );

                return (
                  <HoverCard key={entry.pokemonId} openDelay={100}>
                    <HoverCardTrigger asChild>
                      <div
                        className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-300 ${
                          isOwned
                            ? "bg-primary/5 border-primary/30 neon-border-pink hover:bg-primary/10 hover:border-primary/60"
                            : "bg-black/40 border-white/5 hover:opacity-90"
                        }`}
                      >
                        <span className="absolute top-1 left-1.5 text-[10px] font-mono text-white/50">
                          {entry.pokemonId}
                        </span>

                        <img
                          src={entry.spriteUrl}
                          alt={entry.name}
                          className={`w-full h-full object-contain pixel-sprite transition-transform duration-300 ${
                            isOwned
                              ? "scale-110 drop-shadow-[0_0_8px_rgba(255,110,180,0.4)]"
                              : "brightness-0 contrast-150 opacity-80"
                          }`}
                        />

                        <div className="absolute bottom-1 right-1 flex gap-1">
                          {hasAlpha && (
                            <div
                              className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                              title="Alpha owned"
                            />
                          )}
                          {hasSecret && (
                            <div
                              className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"
                              title="Secret owned"
                            />
                          )}
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-72 glass-panel border-primary/30 p-0 overflow-hidden"
                      side="right"
                    >
                      <div className="bg-gradient-to-b from-primary/20 to-black/40 p-4 border-b border-white/10 flex items-center justify-between">
                        <div>
                          <h4 className="font-mono font-bold text-lg text-white capitalize">
                            {entry.name}
                          </h4>
                          <p className="text-xs text-muted-foreground font-mono">
                            #{entry.pokemonId.toString().padStart(4, "0")} •{" "}
                            {entry.region}
                          </p>
                        </div>
                        <img
                          src={entry.hoverSpriteUrl}
                          className={`w-16 h-16 pixel-sprite ${
                            isOwned
                              ? "drop-shadow-[0_0_10px_rgba(255,110,180,0.6)]"
                              : "brightness-0 contrast-150 opacity-80"
                          }`}
                          alt=""
                        />
                      </div>

                      <div className="p-4 bg-black/60 max-h-60 overflow-y-auto custom-scrollbar">
                        {isOwned ? (
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold text-secondary flex items-center gap-1 uppercase">
                              <Star className="w-3 h-3" /> Captured by
                            </h5>
                            <div className="space-y-2">
                              {entry.ownedBy.map((record) => (
                                <div
                                  key={record.id}
                                  className="bg-white/5 p-2 rounded text-sm space-y-1"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-white">
                                      {record.memberDisplayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(record.caughtAt),
                                        "MM/dd/yy",
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {record.shinyTypeName && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0 h-4 bg-white/10"
                                      >
                                        {record.shinyTypeName}
                                      </Badge>
                                    )}
                                    {record.isAlpha && (
                                      <Badge className="text-[10px] px-1 py-0 h-4 bg-red-500/20 text-red-400">
                                        Alpha
                                      </Badge>
                                    )}
                                    {record.isSecret && (
                                      <Badge className="text-[10px] px-1 py-0 h-4 bg-purple-500/20 text-purple-400">
                                        Secret
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            Not yet captured by the guild.
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
