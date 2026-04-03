import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useListShinies,
  useDeleteShiny,
  useCreateShiny,
  getListShiniesQueryKey,
  useListMembers,
  useListShinyTypes,
  useUpdateShiny,
  type ShinyRecord,
  type ShinyType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil } from "lucide-react";
import { format } from "date-fns";
import { fetchNationalDexNational649 } from "@/lib/national-dex";
import { gen5AnimatedShinyGifUrl } from "@/lib/sprites";

type HuntVariant =
  | "standard"
  | "shalpha"
  | "secret"
  | "egg"
  | "safari"
  | "fled_safari"
  | "fossil"
  | "mysterious_ball";

const VARIANT_LABELS: { value: HuntVariant; label: string }[] = [
  { value: "standard", label: "Standard shiny" },
  { value: "shalpha", label: "Shalpha" },
  { value: "secret", label: "Secret shiny" },
  { value: "egg", label: "Egg shiny" },
  { value: "safari", label: "Safari shiny" },
  { value: "fled_safari", label: "Fled safari shiny" },
  { value: "fossil", label: "Fossil shiny" },
  { value: "mysterious_ball", label: "Mysterious Ball shiny" },
];

function resolveVariant(
  v: HuntVariant,
  types: ShinyType[] | undefined,
): { isAlpha: boolean; isSecret: boolean; shinyTypeId: number | null } {
  if (v === "shalpha")
    return { isAlpha: true, isSecret: false, shinyTypeId: null };
  if (v === "secret")
    return { isAlpha: false, isSecret: true, shinyTypeId: null };
  if (v === "standard")
    return { isAlpha: false, isSecret: false, shinyTypeId: null };
  const code =
    v === "egg"
      ? "egg"
      : v === "safari"
        ? "safari"
        : v === "fled_safari"
          ? "fled_safari"
          : v === "fossil"
            ? "fossil"
            : "mysterious_ball";
  const t = types?.find((x) => x.code === code);
  return { isAlpha: false, isSecret: false, shinyTypeId: t?.id ?? null };
}

function inferVariant(s: ShinyRecord, types: ShinyType[]): HuntVariant {
  if (s.isAlpha) return "shalpha";
  if (s.isSecret) return "secret";
  const t = types.find((x) => x.id === s.shinyTypeId);
  if (t?.code === "egg") return "egg";
  if (t?.code === "safari") return "safari";
  if (t?.code === "fled_safari") return "fled_safari";
  if (t?.code === "fossil") return "fossil";
  if (t?.code === "mysterious_ball") return "mysterious_ball";
  return "standard";
}

export default function ShiniesTab() {
  const { data: shiniesData, isLoading } = useListShinies({
    limit: 10000,
    offset: 0,
  });
  const { data: members } = useListMembers();
  const { data: shinyTypes } = useListShinyTypes();
  const deleteMutation = useDeleteShiny();
  const createMutation = useCreateShiny();
  const updateMutation = useUpdateShiny();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dexQuery = useQuery({
    queryKey: ["national-dex-admin"],
    queryFn: fetchNationalDexNational649,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [pokeSearch, setPokeSearch] = useState("");
  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [pokemonName, setPokemonName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [variant, setVariant] = useState<HuntVariant>("standard");
  const [caughtAt, setCaughtAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [catchMethod, setCatchMethod] = useState("");
  const [location, setLocation] = useState("");

  const filteredDex = useMemo(() => {
    const q = pokeSearch.trim().toLowerCase();
    const rows = dexQuery.data ?? [];
    if (!q) return rows.slice(0, 40);
    return rows
      .filter(
        (r) =>
          r.name.includes(q) || String(r.id) === q || `#${r.id}`.includes(q),
      )
      .slice(0, 40);
  }, [dexQuery.data, pokeSearch]);

  const resetForm = () => {
    setPokeSearch("");
    setPokemonId(null);
    setPokemonName("");
    setMemberId("");
    setVariant("standard");
    setCaughtAt(new Date().toISOString().split("T")[0]);
    setCatchMethod("");
    setLocation("");
  };

  const openEdit = (s: ShinyRecord) => {
    setEditId(s.id);
    setPokemonId(s.pokemonId);
    setPokemonName(s.pokemonName);
    setPokeSearch(s.pokemonName.replace(/-/g, " "));
    setMemberId(String(s.memberId));
    setVariant(inferVariant(s, shinyTypes ?? []));
    setCaughtAt(new Date(s.caughtAt).toISOString().split("T")[0]);
    setCatchMethod(s.catchMethod ?? "");
    setLocation(s.location ?? "");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pokemonId || !pokemonName || !memberId) return;

    const { isAlpha, isSecret, shinyTypeId } = resolveVariant(
      variant,
      shinyTypes,
    );
    const spriteUrl = gen5AnimatedShinyGifUrl(pokemonId);

    createMutation.mutate(
      {
        data: {
          pokemonId,
          pokemonName: pokemonName.toLowerCase(),
          pokemonSpriteUrl: spriteUrl,
          memberId: parseInt(memberId, 10),
          shinyTypeId,
          caughtAt: new Date(caughtAt).toISOString(),
          catchMethod: catchMethod || null,
          location: location || null,
          isAlpha,
          isSecret,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
          toast({ title: "Shiny logged" });
          setIsOpen(false);
          resetForm();
        },
      },
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId == null || !pokemonId || !pokemonName || !memberId) return;
    const { isAlpha, isSecret, shinyTypeId } = resolveVariant(
      variant,
      shinyTypes,
    );
    const spriteUrl = gen5AnimatedShinyGifUrl(pokemonId);

    updateMutation.mutate(
      {
        id: editId,
        data: {
          pokemonId,
          pokemonName: pokemonName.toLowerCase(),
          pokemonSpriteUrl: spriteUrl,
          memberId: parseInt(memberId, 10),
          shinyTypeId,
          caughtAt: new Date(caughtAt).toISOString(),
          catchMethod: catchMethod || null,
          location: location || null,
          isAlpha,
          isSecret,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
          toast({ title: "Shiny updated" });
          setEditId(null);
          resetForm();
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this shiny record?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
            toast({ title: "Deleted" });
          },
        },
      );
    }
  };

  const pickPokemon = (id: number, name: string) => {
    setPokemonId(id);
    setPokemonName(name);
    setPokeSearch(name.replace(/-/g, " "));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-mono text-white">Manage shinies</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              onClick={() => resetForm()}
            >
              <Plus className="w-4 h-4 mr-2" /> Log shiny
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-primary/30 text-white max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono text-xl text-primary">
                Log catch
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Pokémon (search national dex — no manual ID)
                </Label>
                <Input
                  value={pokeSearch}
                  onChange={(e) => setPokeSearch(e.target.value.toLowerCase())}
                  className="bg-black/40 border-white/10"
                  placeholder="e.g. pikachu or 25"
                />
                {pokemonId != null && (
                  <p className="text-xs text-secondary font-mono">
                    Selected #{pokemonId} · {pokemonName}
                  </p>
                )}
                <div className="max-h-40 overflow-y-auto rounded border border-white/10 bg-black/30 text-sm">
                  {filteredDex.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      className="w-full text-left px-2 py-1.5 hover:bg-white/10 capitalize"
                      onClick={() => pickPokemon(row.id, row.name)}
                    >
                      #{row.id} — {row.name.replace(/-/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Hunter
                </Label>
                <Select required value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Member" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {members?.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Shiny type
                </Label>
                <Select
                  value={variant}
                  onValueChange={(v) => setVariant(v as HuntVariant)}
                >
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white max-h-72">
                    {VARIANT_LABELS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-mono">
                    Date
                  </Label>
                  <Input
                    required
                    type="date"
                    value={caughtAt}
                    onChange={(e) => setCaughtAt(e.target.value)}
                    className="bg-black/40 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-mono">
                    Method
                  </Label>
                  <Input
                    value={catchMethod}
                    onChange={(e) => setCatchMethod(e.target.value)}
                    className="bg-black/40 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Location
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-black/40 border-white/10"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/80"
              >
                Save
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editId != null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="glass-panel border-primary/30 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-primary">
              Edit shiny
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">
                Pokémon
              </Label>
              <Input
                value={pokeSearch || pokemonName}
                onChange={(e) => setPokeSearch(e.target.value.toLowerCase())}
                className="bg-black/40 border-white/10"
              />
              <div className="max-h-32 overflow-y-auto rounded border border-white/10 bg-black/30 text-sm">
                {filteredDex.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="w-full text-left px-2 py-1.5 hover:bg-white/10 capitalize"
                    onClick={() => pickPokemon(row.id, row.name)}
                  >
                    #{row.id} — {row.name.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
              {pokemonId != null && (
                <p className="text-xs text-secondary font-mono">#{pokemonId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">
                Hunter
              </Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">
                Shiny type
              </Label>
              <Select
                value={variant}
                onValueChange={(v) => setVariant(v as HuntVariant)}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white max-h-72">
                  {VARIANT_LABELS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Date
                </Label>
                <Input
                  type="date"
                  value={caughtAt}
                  onChange={(e) => setCaughtAt(e.target.value)}
                  className="bg-black/40 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-mono">
                  Method
                </Label>
                <Input
                  value={catchMethod}
                  onChange={(e) => setCatchMethod(e.target.value)}
                  className="bg-black/40 border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-mono">
                Location
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-black/40 border-white/10"
              />
            </div>

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
            >
              Update
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Pokémon</TableHead>
              <TableHead className="text-muted-foreground">Hunter</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              shiniesData?.shinies?.map((shiny) => (
                <TableRow
                  key={shiny.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={shiny.pokemonSpriteUrl}
                        className="w-8 h-8 pixel-sprite"
                        alt=""
                      />
                      <span className="font-bold text-white capitalize">
                        {shiny.pokemonName}
                      </span>
                      {shiny.isAlpha && (
                        <span className="text-[10px] text-red-400 border border-red-400/30 bg-red-500/10 px-1 rounded">
                          α
                        </span>
                      )}
                      {shiny.isSecret && (
                        <span className="text-[10px] text-purple-400 border border-purple-400/30 bg-purple-500/10 px-1 rounded">
                          S
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {shiny.memberDisplayName}
                  </TableCell>
                  <TableCell>
                    {shiny.shinyTypeName ? (
                      <span className="bg-white/10 px-2 py-1 rounded text-xs">
                        {shiny.shinyTypeEmoji ? `${shiny.shinyTypeEmoji} ` : ""}
                        {shiny.shinyTypeName}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(shiny.caughtAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(shiny)}
                      className="text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(shiny.id)}
                      className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {shiniesData?.shinies?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No shinies yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
