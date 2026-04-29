import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const REGIONS = {
  National: { start: 1, end: 649 },
  Kanto: { start: 1, end: 151 },
  Johto: { start: 152, end: 251 },
  Hoenn: { start: 252, end: 386 },
  Sinnoh: { start: 387, end: 493 },
  Unova: { start: 494, end: 649 },
} as const;

const SHOWDOWN_NAME_MAP: Record<string, string> = {
  "farfetchd": "farfetchd",
  "farfetchd-galar": "farfetchdgalar",
  "ho-oh": "hooh",
  "mime-jr": "mimejr",
  "mr-mime": "mrmime",
  "nidoran-f": "nidoranf",
  "nidoran-m": "nidoranm",
  "porygon-z": "porygonz",
};

type RegionKey = keyof typeof REGIONS;
type SpeciesEntry = { id: number; name: string; apiName: string };

function formatPokemonName(name: string) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toShowdownSpriteName(name: string) {
  const normalized = name.toLowerCase();
  if (SHOWDOWN_NAME_MAP[normalized]) return SHOWDOWN_NAME_MAP[normalized];
  return normalized.replace(/[^a-z0-9]/g, "");
}

function getAnimatedSpriteUrl(name: string) {
  return `https://play.pokemonshowdown.com/sprites/ani-shiny/${toShowdownSpriteName(name)}.gif`;
}

function getStaticSpriteUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
}

function parsePokemonIdFromSpeciesUrl(url: string) {
  const match = url.match(/\/pokemon-species\/(\d+)\/?$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function collectEvolutionFamilyIds(chain: {
  species: { url: string };
  evolves_to: Array<any>;
}) {
  const ids = new Set<number>();
  const stack = [chain];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const id = parsePokemonIdFromSpeciesUrl(current.species.url);
    if (id) ids.add(id);
    current.evolves_to.forEach((next: any) => stack.push(next));
  }

  return Array.from(ids);
}

export default function Dex() {
  const { data: allShinies = [], isLoading: sLoading } = trpc.shinies.list.useQuery();
  const { data: researchTargets = [], isLoading: rLoading } = trpc.dexResearch.list.useQuery();

  const [species, setSpecies] = useState<SpeciesEntry[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>("National");
  const [searchTerm, setSearchTerm] = useState("");
  const [researchOnly, setResearchOnly] = useState(false);
  const [typeById, setTypeById] = useState<Record<number, string[]>>({});
  const [familyOwnedIds, setFamilyOwnedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon-species?limit=649");
        const json = await response.json();
        if (cancelled || !json.results) return;

        const nextSpecies: SpeciesEntry[] = json.results.map(
          (entry: { name: string }, index: number) => ({
            id: index + 1,
            name: formatPokemonName(entry.name),
            apiName: entry.name,
          })
        );

        setSpecies(nextSpecies);
      } catch {
        if (!cancelled) {
          setSpecies(
            Array.from({ length: 649 }, (_, index) => ({
              id: index + 1,
              name: `Pokemon ${index + 1}`,
              apiName: `pokemon-${index + 1}`,
            }))
          );
        }
      } finally {
        if (!cancelled) setSpeciesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const caughtById = useMemo(() => {
    const map = new Map<number, string[]>();

    for (const shiny of allShinies) {
      const owners = map.get(shiny.pokemonId) ?? [];
      if (!owners.includes(shiny.memberDisplayName)) owners.push(shiny.memberDisplayName);
      map.set(shiny.pokemonId, owners);
    }

    return map;
  }, [allShinies]);

  const researchById = useMemo(() => {
    const map = new Map<number, (typeof researchTargets)[0]>();
    for (const target of researchTargets) {
      map.set(target.pokemonId, target);
    }
    return map;
  }, [researchTargets]);

  useEffect(() => {
    const visibleEntries =
      selectedRegion === "National" && !searchTerm.trim()
        ? species.slice(0, 151)
        : species.filter((entry) => {
            const region = REGIONS[selectedRegion];
            return entry.id >= region.start && entry.id <= region.end;
          });

    const missingTypeIds = visibleEntries
      .map((entry) => entry.id)
      .filter((id) => !(id in typeById))
      .slice(0, selectedRegion === "National" ? 60 : 180);

    if (missingTypeIds.length === 0) return;

    let cancelled = false;
    const concurrency = 8;

    async function worker(ids: number[]) {
      for (const id of ids) {
        try {
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
          const json = await response.json();
          const labels = Array.isArray(json.types)
            ? json.types
                .slice()
                .sort((a: any, b: any) => a.slot - b.slot)
                .map((type: any) => formatPokemonName(type.type.name))
            : [];

          if (!cancelled) {
            setTypeById((current) => (id in current ? current : { ...current, [id]: labels }));
          }
        } catch {
          if (!cancelled) {
            setTypeById((current) => (id in current ? current : { ...current, [id]: [] }));
          }
        }
      }
    }

    const buckets = Array.from({ length: concurrency }, () => [] as number[]);
    missingTypeIds.forEach((id, index) => buckets[index % concurrency].push(id));
    buckets.forEach((bucket) => {
      void worker(bucket);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion, searchTerm, species, typeById]);

  useEffect(() => {
    const ownedIds = Array.from(caughtById.keys());
    if (ownedIds.length === 0) {
      setFamilyOwnedIds(new Set());
      return;
    }

    let cancelled = false;
    const seenChains = new Set<string>();

    (async () => {
      const nextFamilyOwned = new Set<number>(ownedIds);

      for (const id of ownedIds) {
        try {
          const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
          const speciesJson = await speciesResponse.json();
          const chainUrl = speciesJson.evolution_chain?.url as string | undefined;
          if (!chainUrl || seenChains.has(chainUrl)) continue;

          seenChains.add(chainUrl);
          const chainResponse = await fetch(chainUrl);
          const chainJson = await chainResponse.json();
          const ids = collectEvolutionFamilyIds(chainJson.chain);
          ids.forEach((familyId) => nextFamilyOwned.add(familyId));
        } catch {
          nextFamilyOwned.add(id);
        }
      }

      if (!cancelled) setFamilyOwnedIds(nextFamilyOwned);
    })();

    return () => {
      cancelled = true;
    };
  }, [caughtById]);

  const region = REGIONS[selectedRegion];
  const entries = useMemo(() => {
    return species.filter((entry) => entry.id >= region.start && entry.id <= region.end);
  }, [region, species]);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      if (researchOnly && !researchById.has(entry.id)) return false;
      if (!query) return true;
      return entry.name.toLowerCase().includes(query) || entry.id.toString().includes(query);
    });
  }, [entries, researchById, researchOnly, searchTerm]);

  const exactOwnedCount = filteredEntries.filter((entry) => caughtById.has(entry.id)).length;
  const familyOwnedCount = filteredEntries.filter(
    (entry) => !caughtById.has(entry.id) && familyOwnedIds.has(entry.id)
  ).length;
  const totalCount = filteredEntries.length;
  const percentage = totalCount > 0 ? Math.round((exactOwnedCount / totalCount) * 100) : 0;

  const loading = sLoading || rLoading || speciesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-400" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h1
            className="mb-3 text-center text-3xl md:text-4xl"
            style={{ color: "#facc15", textShadow: "0 0 16px rgba(250, 204, 21, 0.35)" }}
          >
            Shiny Dex
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-muted-foreground">
            National Dex 1-649 with team ownership states. Gray means uncaught, bright gold means directly owned, and pink
            means another stage in that evolution line is owned.
          </p>

          <div
            className="mb-6 grid gap-3 rounded-3xl p-4 md:grid-cols-3"
            style={{
              background: "linear-gradient(180deg, rgba(24, 27, 40, 0.92), rgba(17, 20, 31, 0.92))",
              border: "1px solid rgba(250, 204, 21, 0.14)",
              boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div className="rounded-2xl border border-yellow-400/20 bg-black/20 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Direct catches</div>
              <div className="mt-2 text-2xl font-bold text-yellow-300">{exactOwnedCount}</div>
            </div>
            <div className="rounded-2xl border border-pink-400/20 bg-black/20 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owned evo line</div>
              <div className="mt-2 text-2xl font-bold text-pink-400">{familyOwnedCount}</div>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-black/20 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completion</div>
              <div className="mt-2 text-2xl font-bold text-sky-300">{percentage}%</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-yellow-300 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/8 bg-slate-950/50 p-4">
            <div className="flex flex-wrap justify-center gap-2">
              {(Object.keys(REGIONS) as RegionKey[]).map((regionKey) => (
                <button
                  key={regionKey}
                  type="button"
                  onClick={() => setSelectedRegion(regionKey)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    selectedRegion === regionKey
                      ? "bg-yellow-400 text-slate-950 shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {regionKey}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={researchOnly} onChange={(e) => setResearchOnly(e.target.checked)} />
                Show only research targets
              </label>

              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or Dex number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-full border border-yellow-400/20 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredEntries.map((entry) => {
              const owners = caughtById.get(entry.id) ?? [];
              const isOwned = owners.length > 0;
              const isFamilyOwned = !isOwned && familyOwnedIds.has(entry.id);
              const research = researchById.get(entry.id);
              const types = typeById[entry.id] ?? [];

              let cardBackground = "linear-gradient(180deg, rgba(39, 39, 49, 0.96), rgba(26, 26, 35, 0.96))";
              let cardBorder = "1px solid rgba(148, 163, 184, 0.18)";
              let cardShadow = "0 10px 24px rgba(0, 0, 0, 0.35)";

              if (isOwned) {
                cardBackground = "linear-gradient(180deg, rgba(44, 40, 54, 0.98), rgba(30, 28, 39, 0.98))";
                cardBorder = "1px solid rgba(250, 204, 21, 0.28)";
                cardShadow = "0 12px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(250, 204, 21, 0.08)";
              } else if (isFamilyOwned) {
                cardBackground = "linear-gradient(180deg, rgba(49, 34, 50, 0.96), rgba(30, 23, 37, 0.96))";
                cardBorder = "1px solid rgba(244, 114, 182, 0.36)";
                cardShadow = "0 12px 28px rgba(0, 0, 0, 0.4), 0 0 24px rgba(244, 114, 182, 0.12)";
              } else if (research) {
                cardBackground = "linear-gradient(180deg, rgba(30, 42, 60, 0.96), rgba(24, 33, 49, 0.96))";
                cardBorder = "1px solid rgba(56, 189, 248, 0.28)";
              }

              const title = isOwned
                ? `Owners: ${owners.join(", ")}`
                : isFamilyOwned
                  ? "Owned in this evolution line"
                  : "Not caught yet";

              return (
                <div
                  key={entry.id}
                  className="group rounded-3xl p-3 transition-transform duration-200 hover:-translate-y-1"
                  style={{
                    background: cardBackground,
                    border: cardBorder,
                    boxShadow: cardShadow,
                  }}
                  title={title}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-yellow-500">#{entry.id}</span>
                    {research ? (
                      <span className="rounded-full bg-sky-400/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-300">
                        Target
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex min-h-[74px] items-center justify-center">
                    <img
                      src={getAnimatedSpriteUrl(entry.apiName)}
                      alt={entry.name}
                      className="h-16 w-16 object-contain"
                      style={{
                        imageRendering: "pixelated",
                        filter: isOwned ? "none" : isFamilyOwned ? "saturate(0.6) brightness(0.95)" : "grayscale(1) brightness(0.7)",
                      }}
                      loading="lazy"
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (image.dataset.fallbackApplied === "true") return;
                        image.dataset.fallbackApplied = "true";
                        image.src = getStaticSpriteUrl(entry.id);
                      }}
                    />
                  </div>

                  <div className="mt-1 text-center">
                    <div className={`line-clamp-1 text-lg font-bold ${isOwned ? "text-yellow-300" : isFamilyOwned ? "text-pink-300" : "text-slate-300"}`}>
                      {entry.name}
                    </div>
                    <div className="mt-1 min-h-[20px] text-xs text-slate-400">
                      {types.length > 0 ? types.join(", ") : " "}
                    </div>
                  </div>

                  <div className="mt-2 min-h-[34px] text-center">
                    {isOwned ? (
                      <>
                        <div className="text-sm font-bold text-yellow-300">Owned by: {owners.length}</div>
                        <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-violet-300">
                          <Users size={12} />
                          <span className="line-clamp-1">{owners.join(", ")}</span>
                        </div>
                      </>
                    ) : isFamilyOwned ? (
                      <div className="text-sm font-bold text-pink-300">Evo line owned</div>
                    ) : (
                      <div className="text-sm text-slate-500">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-slate-500">No Pokemon match this filter.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
