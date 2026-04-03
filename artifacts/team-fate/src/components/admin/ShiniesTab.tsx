import { useState } from "react";
import { useListShinies, useDeleteShiny, useCreateShiny, getListShiniesQueryKey, useListMembers, useListShinyTypes } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

export default function ShiniesTab() {
  const { data: shiniesData, isLoading } = useListShinies();
  const { data: members } = useListMembers();
  const { data: shinyTypes } = useListShinyTypes();
  const deleteMutation = useDeleteShiny();
  const createMutation = useCreateShiny();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [pokemonId, setPokemonId] = useState("");
  const [pokemonName, setPokemonName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [shinyTypeId, setShinyTypeId] = useState("none");
  const [caughtAt, setCaughtAt] = useState(new Date().toISOString().split('T')[0]);
  const [catchMethod, setCatchMethod] = useState("");
  const [location, setLocation] = useState("");
  const [isAlpha, setIsAlpha] = useState(false);
  const [isSecret, setIsSecret] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pokemonId || !pokemonName || !memberId || !caughtAt) return;

    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;

    createMutation.mutate({
      data: {
        pokemonId: parseInt(pokemonId),
        pokemonName: pokemonName.toLowerCase(),
        pokemonSpriteUrl: spriteUrl,
        memberId: parseInt(memberId),
        shinyTypeId: shinyTypeId !== "none" ? parseInt(shinyTypeId) : null,
        caughtAt: new Date(caughtAt).toISOString(),
        catchMethod,
        location,
        isAlpha,
        isSecret
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
        toast({ title: "Shiny Logged" });
        setIsOpen(false);
        // Reset form
        setPokemonId("");
        setPokemonName("");
        setMemberId("");
        setShinyTypeId("none");
        setCaughtAt(new Date().toISOString().split('T')[0]);
        setCatchMethod("");
        setLocation("");
        setIsAlpha(false);
        setIsSecret(false);
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this shiny record?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
          toast({ title: "Record Deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage Shinies</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" /> LOG NEW SHINY
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-panel border-primary/30 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-mono text-xl text-primary">Log New Catch</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase font-mono">Pokedex ID</label>
                  <Input required type="number" value={pokemonId} onChange={e => setPokemonId(e.target.value)} className="bg-black/40 border-white/10" placeholder="e.g. 25" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase font-mono">Pokemon Name</label>
                  <Input required value={pokemonName} onChange={e => setPokemonName(e.target.value)} className="bg-black/40 border-white/10" placeholder="e.g. Pikachu" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-mono">Hunter</label>
                <Select required value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    {members?.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-mono">Shiny Type</label>
                <Select value={shinyTypeId} onValueChange={setShinyTypeId}>
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Standard (None)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10 text-white">
                    <SelectItem value="none">Standard (None)</SelectItem>
                    {shinyTypes?.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase font-mono">Catch Date</label>
                  <Input required type="date" value={caughtAt} onChange={e => setCaughtAt(e.target.value)} className="bg-black/40 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase font-mono">Method</label>
                  <Input value={catchMethod} onChange={e => setCatchMethod(e.target.value)} className="bg-black/40 border-white/10" placeholder="e.g. Masuda" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase font-mono">Location</label>
                <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-black/40 border-white/10" placeholder="e.g. Route 1" />
              </div>

              <div className="flex gap-6 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Switch id="alpha" checked={isAlpha} onCheckedChange={setIsAlpha} />
                  <Label htmlFor="alpha" className="text-red-400">Alpha</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="secret" checked={isSecret} onCheckedChange={setIsSecret} />
                  <Label htmlFor="secret" className="text-purple-400">Secret</Label>
                </div>
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/80">
                SAVE RECORD
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground w-16">ID</TableHead>
              <TableHead className="text-muted-foreground">Pokémon</TableHead>
              <TableHead className="text-muted-foreground">Hunter</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : shiniesData?.shinies?.map(shiny => (
              <TableRow key={shiny.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-mono text-muted-foreground">{shiny.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img src={shiny.pokemonSpriteUrl} className="w-8 h-8 pixel-sprite" alt="" />
                    <span className="font-bold text-white capitalize">{shiny.pokemonName}</span>
                    {shiny.isAlpha && <span className="text-[10px] text-red-400 border border-red-400/30 bg-red-500/10 px-1 rounded">A</span>}
                    {shiny.isSecret && <span className="text-[10px] text-purple-400 border border-purple-400/30 bg-purple-500/10 px-1 rounded">S</span>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{shiny.memberDisplayName}</TableCell>
                <TableCell>
                  {shiny.shinyTypeName ? <span className="bg-white/10 px-2 py-1 rounded text-xs">{shiny.shinyTypeName}</span> : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(shiny.caughtAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(shiny.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {shiniesData?.shinies?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No shinies logged yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
