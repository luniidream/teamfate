import { useState } from "react";
import { useListShinyTypes, useCreateShinyType, useDeleteShinyType, getListShinyTypesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

export default function ShinyTypesTab() {
  const { data: types, isLoading } = useListShinyTypes();
  const createMutation = useCreateShinyType();
  const deleteMutation = useDeleteShinyType();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !sortOrder) return;

    createMutation.mutate({ data: { name, code, isEnabled: true, sortOrder: parseInt(sortOrder) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListShinyTypesQueryKey() });
        toast({ title: "Shiny Type Added" });
        setName("");
        setCode("");
        setSortOrder("");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this shiny type?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListShinyTypesQueryKey() });
          toast({ title: "Shiny Type Removed" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage Shiny Types</h2>
      </div>

      <form onSubmit={handleCreate} className="flex gap-4 items-end bg-black/20 p-4 rounded-lg border border-white/5">
        <div className="space-y-2 flex-1">
          <label className="text-xs text-muted-foreground uppercase font-mono">Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border-white/10 text-white" placeholder="e.g. Star Shiny" />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-xs text-muted-foreground uppercase font-mono">Code</label>
          <Input value={code} onChange={e => setCode(e.target.value)} className="bg-black/40 border-white/10 text-white" placeholder="e.g. STAR" />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-xs text-muted-foreground uppercase font-mono">Sort Order</label>
          <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/80">
          <Plus className="w-4 h-4 mr-2" /> ADD
        </Button>
      </form>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Code</TableHead>
              <TableHead className="text-muted-foreground">Sort Order</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : types?.map(type => (
              <TableRow key={type.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-mono text-muted-foreground">{type.id}</TableCell>
                <TableCell className="font-bold text-white">{type.name}</TableCell>
                <TableCell className="text-muted-foreground">{type.code}</TableCell>
                <TableCell className="font-mono">{type.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
