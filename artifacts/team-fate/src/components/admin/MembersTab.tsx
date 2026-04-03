import { useState } from "react";
import { useListMembers, useCreateMember, useDeleteMember, getListMembersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import { format } from "date-fns";

export default function MembersTab() {
  const { data: members, isLoading } = useListMembers();
  const createMutation = useCreateMember();
  const deleteMutation = useDeleteMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !displayName) return;

    createMutation.mutate({ data: { username, displayName, role: "member" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        toast({ title: "Member Added" });
        setUsername("");
        setDisplayName("");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this member?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          toast({ title: "Member Removed" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage Members</h2>
      </div>

      <form onSubmit={handleCreate} className="flex gap-4 items-end bg-black/20 p-4 rounded-lg border border-white/5">
        <div className="space-y-2 flex-1">
          <label className="text-xs text-muted-foreground uppercase font-mono">Username</label>
          <Input value={username} onChange={e => setUsername(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-xs text-muted-foreground uppercase font-mono">Display Name</label>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/80">
          <UserPlus className="w-4 h-4 mr-2" /> ADD
        </Button>
      </form>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Display Name</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Shinies</TableHead>
              <TableHead className="text-muted-foreground">Points</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : members?.map(member => (
              <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-mono text-muted-foreground">{member.id}</TableCell>
                <TableCell className="font-bold text-white">{member.displayName}</TableCell>
                <TableCell className="text-muted-foreground">@{member.username}</TableCell>
                <TableCell><span className="bg-white/10 px-2 py-1 rounded text-xs">{member.role}</span></TableCell>
                <TableCell className="font-mono text-secondary">{member.shinyCount}</TableCell>
                <TableCell className="font-mono text-yellow-500">{member.shinyPoints}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(member.joinedAt), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
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
