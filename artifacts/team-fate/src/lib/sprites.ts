/** Gen 5 Black/White animated shiny sprites (GIF) via [PokeAPI/sprites](https://github.com/PokeAPI/sprites). */
export function gen5AnimatedShinyGifUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/shiny/${pokemonId}.gif`;
}

/** Regular B&W animated sprite — used as base for uncaught silhouette styling. */
export function gen5AnimatedFrontGifUrl(pokemonId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`;
}
