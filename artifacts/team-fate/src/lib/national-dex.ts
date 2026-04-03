/** National Pokédex #1–649 (Gen 1–5) names from PokéAPI. Cached in-memory after first fetch. */
const MAX_ID = 649;

let cache: { id: number; name: string }[] | null = null;

export async function fetchNationalDexNational649(): Promise<{ id: number; name: string }[]> {
  if (cache) return cache;

  const res = await fetch("https://pokeapi.co/api/v2/pokedex/national");
  if (!res.ok) {
    throw new Error(`Pokédex request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    pokemon_entries: {
      entry_number: number;
      pokemon_species: { name: string };
    }[];
  };

  cache = data.pokemon_entries
    .filter((e) => e.entry_number <= MAX_ID)
    .map((e) => ({
      id: e.entry_number,
      name: e.pokemon_species.name,
    }));

  return cache;
}
