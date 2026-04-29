import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2, LogOut, Search, Calendar, MapPin, Tag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function capitalizeSpecies(name: string) {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function MyShinies() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading: meLoading, isError: meError } = trpc.memberAuth.me.useQuery();
  const utils = trpc.useUtils();

  const { data: shinies = [], isLoading: listLoading } = trpc.shinies.getMine.useQuery(undefined, {
    enabled: !!me,
  });
  const { data: shinyTypes = [] } = trpc.shinyTypes.list.useQuery();
  const { data: shinyMethods = [] } = trpc.shinyMethods.list.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pokemonIdInput, setPokemonIdInput] = useState("");
  const [previewName, setPreviewName] = useState("");
  const [previewSprite, setPreviewSprite] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [shinyTypeId, setShinyTypeId] = useState<string>("");
  const [shinyMethodId, setShinyMethodId] = useState<string>("");
  const [caughtAt, setCaughtAt] = useState("");
  const [location, setLocationField] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!meLoading && (meError || !me)) {
      setLocation("/member-login");
    }
  }, [me, meLoading, meError, setLocation]);

  const createMut = trpc.shinies.create.useMutation({
    onSuccess: async () => {
      await utils.shinies.getMine.invalidate();
      toast.success("Shiny logged");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.shinies.update.useMutation({
    onSuccess: async () => {
      await utils.shinies.getMine.invalidate();
      toast.success("Updated");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.shinies.delete.useMutation({
    onSuccess: async () => {
      await utils.shinies.getMine.invalidate();
      toast.success("Removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const logoutMut = trpc.memberAuth.logout.useMutation({
    onSuccess: () => {
      setLocation("/");
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setPokemonIdInput("");
    setPreviewName("");
    setPreviewSprite("");
    setNickname("");
    setShinyTypeId("");
    setShinyMethodId("");
    setCaughtAt("");
    setLocationField("");
    setNotes("");
  }

  async function fetchPokemonPreview() {
    const id = parseInt(pokemonIdInput.trim(), 10);
    if (!Number.isFinite(id) || id < 1) {
      toast.error("Enter a valid Pokédex number");
      return;
    }
    if (id > 649) {
      toast.error("Only Pokémon from generations 1-5 (ID 1-649) are supported");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error("Pokémon not found");
      const data = await res.json();
      const name = capitalizeSpecies(data.name as string);
      const shiny =
        data.sprites?.other?.["official-artwork"]?.front_shiny ||
        data.sprites?.front_shiny ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
      setPreviewName(name);
      setPreviewSprite(shiny);
    } catch {
      toast.error("Could not load that ID from PokéAPI");
      setPreviewName("");
      setPreviewSprite("");
    } finally {
      setPreviewLoading(false);
    }
  }

  function openEdit(shiny: (typeof shinies)[0]) {
    setEditingId(shiny.id);
    setPokemonIdInput(String(shiny.pokemonId));
    setPreviewName(shiny.pokemonName);
    setPreviewSprite(
      shiny.pokemonSpriteUrl ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${shiny.pokemonId}.png`
    );
    setNickname(shiny.nickname ?? "");
    setShinyTypeId(shiny.shinyTypeId != null ? String(shiny.shinyTypeId) : "");
    setShinyMethodId(shiny.shinyMethodId != null ? String(shiny.shinyMethodId) : "");
    setCaughtAt(shiny.caughtAt ? String(shiny.caughtAt).slice(0, 10) : "");
    setLocationField(shiny.location ?? "");
    setNotes(shiny.notes ?? "");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(pokemonIdInput.trim(), 10);
    if (!Number.isFinite(id) || !previewName) {
      toast.error("Look up a Pokémon first (search)");
      return;
    }
    if (id > 649) {
      toast.error("Only Pokémon from generations 1-5 (ID 1-649) are supported");
      return;
    }
    const typeId = shinyTypeId ? parseInt(shinyTypeId, 10) : undefined;
    const methodId = shinyMethodId ? parseInt(shinyMethodId, 10) : undefined;

    if (editingId != null) {
      updateMut.mutate({
        id: editingId,
        data: {
          pokemonId: id,
          pokemonName: previewName,
          pokemonSpriteUrl: previewSprite || undefined,
          nickname: nickname || null,
          shinyTypeId: typeId ?? null,
          shinyMethodId: methodId ?? null,
          caughtAt: caughtAt || null,
          location: location || null,
          notes: notes || null,
        },
      });
      return;
    }

    createMut.mutate({
      pokemonId: id,
      pokemonName: previewName,
      pokemonSpriteUrl: previewSprite || undefined,
      nickname: nickname || undefined,
      shinyTypeId: typeId,
      shinyMethodId: methodId,
      caughtAt: caughtAt || undefined,
      location: location || undefined,
      notes: notes || undefined,
    });
  }

  if (meLoading || !me) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-400" size={48} />
      </div>
    );
  }

  const busy = listLoading;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-12 px-4 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4">
          <div>
            <h1
              className="text-3xl md:text-4xl mb-2"
              style={{
                color: "#ec4899",
                textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
              }}
            >
              My shinies
            </h1>
            <p className="text-gray-400">
              Logged in as <span className="text-white font-medium">{me.displayName}</span> ({me.username})
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
                setEditingId(null);
              }}
              className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 flex items-center gap-2"
            >
              <Plus size={20} />
              Add shiny
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => logoutMut.mutate()}
              className="px-6 py-3 flex items-center gap-2"
            >
              <LogOut size={20} />
              Logout
            </Button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="p-8 rounded-lg mb-10 space-y-6"
            style={{
              background: "rgba(20, 20, 20, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(236, 72, 153, 0.3)",
            }}
          >
            <h2 className="text-xl font-bold text-pink-400">{editingId ? "Edit shiny" : "Log new shiny"}</h2>
            <p className="text-sm text-muted-foreground">
              Enter a National Dex number, hit search, then set type and method from the lists your admin configured.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Pokédex #</label>
                <input
                  type="number"
                  min={1}
                  value={pokemonIdInput}
                  onChange={(e) => setPokemonIdInput(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-pink-500/30 rounded-lg text-foreground"
                  placeholder="e.g. 448"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void fetchPokemonPreview()}
                disabled={previewLoading}
                className="flex items-center gap-2"
              >
                {previewLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>

            {previewName && (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={previewSprite}
                  alt=""
                  className="w-28 h-28 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
                <div>
                  <div className="text-lg font-bold text-teal-400">{previewName}</div>
                  <div className="text-xs text-muted-foreground">#{pokemonIdInput}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Pokémon</label>
                  <div className="flex items-center gap-3 p-3 bg-background border border-pink-500/30 rounded-lg">
                    <img
                      src={previewSprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonIdInput}.png`}
                      alt=""
                      className="w-12 h-12 object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                    <div>
                      <div className="font-bold text-foreground">{previewName || "Select a Pokémon"}</div>
                      <div className="text-xs text-muted-foreground">#{pokemonIdInput || "—"}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Nickname</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-pink-500"
                    placeholder="Optional nickname"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Shiny type</label>
                    <select
                      value={shinyTypeId}
                      onChange={(e) => setShinyTypeId(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground focus:outline-none focus:border-pink-500"
                    >
                      <option value="">Select type</option>
                      {shinyTypes
                        .filter((t) => t.isEnabled)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.emoji ? `${t.emoji} ` : ""}
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Method</label>
                    <select
                      value={shinyMethodId}
                      onChange={(e) => setShinyMethodId(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground focus:outline-none focus:border-pink-500"
                    >
                      <option value="">Select method</option>
                      {shinyMethods
                        .filter((m) => m.isEnabled)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.emoji ? `${m.emoji} ` : ""}
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Date caught</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      type="date"
                      value={caughtAt}
                      onChange={(e) => setCaughtAt(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                      value={location}
                      onChange={(e) => setLocationField(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-pink-500"
                      placeholder="Where did you catch it?"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-pink-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-pink-500 resize-none"
                    placeholder="Any additional details..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editingId ? "Save changes" : "Add shiny"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => resetForm()}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {busy ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-pink-400" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shinies.map((shiny) => (
              <div
                key={shiny.id}
                className="p-6 rounded-lg"
                style={{
                  background: "rgba(20, 20, 20, 0.8)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(236, 72, 153, 0.3)",
                }}
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-pink-400">{shiny.pokemonName}</h3>
                    {shiny.nickname && <p className="text-sm text-teal-400 italic">&ldquo;{shiny.nickname}&rdquo;</p>}
                  </div>
                  <img
                    src={
                      shiny.pokemonSpriteUrl ||
                      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${shiny.pokemonId}.png`
                    }
                    alt=""
                    className="w-16 h-16 shrink-0"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <div className="space-y-1 text-sm text-gray-400 mb-4 border-t border-pink-500/20 pt-4">
                  {shiny.shinyTypeName && (
                    <div>
                      <strong className="text-white">Type:</strong> {shiny.shinyTypeName}
                    </div>
                  )}
                  {shiny.shinyMethodName && (
                    <div>
                      <strong className="text-white">Method:</strong> {shiny.shinyMethodName}
                    </div>
                  )}
                  {shiny.location && (
                    <div>
                      <strong className="text-white">Where:</strong> {shiny.location}
                    </div>
                  )}
                  {shiny.caughtAt && (
                    <div>
                      <strong className="text-white">When:</strong> {String(shiny.caughtAt).slice(0, 10)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="flex-1 gap-2" onClick={() => openEdit(shiny)}>
                    <Edit2 size={16} />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => {
                      if (confirm("Delete this shiny?")) deleteMut.mutate(shiny.id);
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!busy && shinies.length === 0 && !showForm && (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-6">You have not logged any shinies yet.</p>
            <Button onClick={() => setShowForm(true)}>Log your first shiny</Button>
          </div>
        )}
      </div>
    </div>
  );
}
