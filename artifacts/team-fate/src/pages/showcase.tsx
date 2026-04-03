import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListMembers, useListShinies, type ShinyRecord } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, Sparkles } from "lucide-react";
import { fetchNationalDexNational649 } from "@/lib/national-dex";
import { gen5AnimatedShinyGifUrl, gen5AnimatedFrontGifUrl } from "@/lib/sprites";

const NATIONAL_MAX = 649;

function isEggVariant(s: ShinyRecord): boolean {
  const code = (s.shinyTypeCode || "").toLowerCase();
  const name = (s.shinyTypeName || "").toLowerCase();
  return code === "egg" || name.includes("egg");
}

export default function Showcase() {
  const [search, setSearch] = useState("");

  const dexQuery = useQuery({
    queryKey: ["national-dex-649"],
    queryFn: fetchNationalDexNational649,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const { data: members, isLoading: membersLoading } = useListMembers();
  const { data: shiniesData, isLoading: shiniesLoading } = useListShinies({
    limit: 10000,
    offset: 0,
  });

  const shinyByMemberPokemon = useMemo(() => {
    const map = new Map<string, ShinyRecord>();
    for (const s of shiniesData?.shinies ?? []) {
      map.set(`${s.memberId}:${s.pokemonId}`, s);
    }
    return map;
  }, [shiniesData?.shinies]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(members ?? [])].sort(
      (a, b) => (b.shinyCount ?? 0) - (a.shinyCount ?? 0),
    );
    if (!q) return list;
    return list.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q),
    );
  }, [members, search]);

  const dexIds = useMemo(
    () => Array.from({ length: NATIONAL_MAX }, (_, i) => i + 1),
    [],
  );

  const isLoading = dexQuery.isLoading || membersLoading || shiniesLoading;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              SHINY SHOWCASE
            </h1>
            <p className="text-muted-foreground">
              Gen 1–5 living dex per member — animated Gen 5 shiny sprites (
              <a
                href="https://github.com/PokeAPI/sprites"
                className="text-secondary underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                PokeAPI/sprites
              </a>
              ).
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
        </header>

        {dexQuery.isError && (
          <p className="text-destructive text-sm">
            Could not load Pokédex metadata. Refresh to retry.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-white/10 rounded-xl">
            No members yet. Add members in Admin.
          </div>
        ) : (
          <div className="space-y-12">
            {filteredMembers.map((member) => (
              <section key={member.id} className="space-y-3">
                <h2 className="text-xl font-mono font-bold text-white text-center">
                  <span className="text-primary">✦</span> {member.displayName} (
                  {member.shinyCount ?? 0} / {NATIONAL_MAX}){" "}
                  <span className="text-primary">✦</span>
                </h2>

                <div
                  className="rounded-lg px-2 py-4"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(56, 189, 248, 0.12) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(56, 189, 248, 0.12) 1px, transparent 1px)
                    `,
                    backgroundSize: "28px 28px",
                    backgroundColor: "rgba(0, 8, 24, 0.35)",
                  }}
                >
                  <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                    {dexIds.map((pokemonId) => {
                      const shiny = shinyByMemberPokemon.get(
                        `${member.id}:${pokemonId}`,
                      );
                      const caught = Boolean(shiny);
                      const name =
                        dexQuery.data?.find((e) => e.id === pokemonId)?.name ??
                        `#${pokemonId}`;

                      const shinyUrl = gen5AnimatedShinyGifUrl(pokemonId);
                      const frontUrl = gen5AnimatedFrontGifUrl(pokemonId);
                      const src = caught ? shiny?.pokemonSpriteUrl || shinyUrl : shinyUrl;
                      const silhouetteSrc = caught ? src : frontUrl;

                      const egg = shiny && isEggVariant(shiny);

                      const img = (
                        <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0">
                          <img
                            src={silhouetteSrc}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className={`w-full h-full object-contain pixel-sprite select-none ${
                              caught
                                ? "drop-shadow-[0_0_6px_rgba(255,110,180,0.45)]"
                                : "brightness-0 opacity-[0.42] contrast-125"
                            }`}
                          />
                          {egg && (
                            <span
                              className="absolute -right-0.5 -top-0.5 text-[11px] leading-none drop-shadow-md pointer-events-none"
                              title="Egg shiny"
                            >
                              🥚✨
                            </span>
                          )}
                        </div>
                      );

                      return (
                        <Tooltip key={`${member.id}-${pokemonId}`}>
                          <TooltipTrigger asChild>{img}</TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="bg-black/90 border border-cyan-500/40 text-white text-xs capitalize max-w-[220px]"
                          >
                            <p className="font-mono font-semibold">
                              {name.replace(/-/g, " ")} · #{pokemonId}
                            </p>
                            {caught && shiny ? (
                              <>
                                {shiny.catchMethod && (
                                  <p className="text-white/70 mt-1">
                                    Method: {shiny.catchMethod}
                                  </p>
                                )}
                                {shiny.location && (
                                  <p className="text-white/70">
                                    {shiny.location}
                                  </p>
                                )}
                                <p className="text-white/50 text-[10px] mt-1">
                                  {new Date(shiny.caughtAt).toLocaleString()}
                                </p>
                              </>
                            ) : (
                              <p className="text-white/50 mt-1">Not caught</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
