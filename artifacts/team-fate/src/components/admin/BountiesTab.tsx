import { useState } from "react";
import { useListBounties, useCreateBounty, useDeleteBounty, getListBountiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

export default function BountiesTab() {
  const { data: bounties, isLoading } = useListBounties();
  const createMutation = useCreateBounty();
  const deleteMutation = useDeleteBounty();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("");
  const [points, setPoints] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !month || !points) return;

    createMutation.mutate({ data: { title, description, month, points: parseInt(points), isActive: true } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBountiesQueryKey() });
        toast({ title: "Bounty Added" });
        setTitle("");
        setDescription("");
        setMonth("");
        setPoints("");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this bounty?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBountiesQueryKey() });
          toast({ title: "Bounty Removed" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage Bounties</h2>
      </div>

      <form onSubmit={handleCreate} className="flex gap-4 items-end bg-black/20 p-4 rounded-lg border border-white/5 flex-wrap">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <div className="space-y-2 flex-1 min-w-[120px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">Month</label>
          <Input value={month} onChange={e => setMonth(e.target.value)} className="bg-black/40 border-white/10 text-white" placeholder="e.g. October 2024" />
        </div>
        <div className="space-y-2 w-24">
          <label className="text-xs text-muted-foreground uppercase font-mono">Points</label>
          <Input type="number" value={points} onChange={e => setPoints(e.target.value)} className="bg-black/40 border-white/10 text-white" />
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
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Month</TableHead>
              <TableHead className="text-muted-foreground">Points</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : bounties?.map(bounty => (
              <TableRow key={bounty.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-mono text-muted-foreground">{bounty.id}</TableCell>
                <TableCell className="font-bold text-white">{bounty.title}</TableCell>
                <TableCell className="text-muted-foreground">{bounty.month}</TableCell>
                <TableCell className="font-mono text-secondary">{bounty.points}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(bounty.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
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
