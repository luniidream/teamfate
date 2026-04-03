import { useState } from "react";
import {
  useListMembers,
  useCreateMember,
  useDeleteMember,
  useUpdateMember,
  getListMembersQueryKey,
  getListShiniesQueryKey,
  type Member,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Pencil, UserX } from "lucide-react";
import { format } from "date-fns";

const RANK_OPTIONS = [
  { value: "guest", label: "Guest" },
  { value: "member", label: "Member" },
  { value: "officer", label: "Officer" },
  { value: "commander", label: "Commander" },
  { value: "executive", label: "Executive" },
  { value: "leader", label: "Leader" },
] as const;

export default function MembersTab() {
  const { data: members, isLoading } = useListMembers();
  const createMutation = useCreateMember();
  const deleteMutation = useDeleteMember();
  const updateMutation = useUpdateMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [role, setRole] = useState<string>("member");

  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDiscordId, setEditDiscordId] = useState("");
  const [editRole, setEditRole] = useState("member");

  const openEdit = (m: Member) => {
    setEditMember(m);
    setEditUsername(m.username);
    setEditDisplayName(m.displayName);
    setEditDiscordId(m.discordId ?? "");
    setEditRole(m.role);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !displayName) return;

    createMutation.mutate(
      {
        data: {
          username,
          displayName,
          discordId: discordId || null,
          role,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          toast({ title: "Member added" });
          setUsername("");
          setDisplayName("");
          setDiscordId("");
          setRole("member");
        },
      },
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    updateMutation.mutate(
      {
        id: editMember.id,
        data: {
          username: editUsername,
          displayName: editDisplayName,
          discordId: editDiscordId || null,
          role: editRole,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          toast({ title: "Member updated" });
          setEditMember(null);
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this member and their shiny records?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
            toast({ title: "Member removed" });
          },
        },
      );
    }
  };

  const handleDeleteAll = async () => {
    if (!members?.length) return;
    if (
      !confirm(
        `Remove all ${members.length} members and their shinies? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await Promise.all(members.map((m) => deleteMutation.mutateAsync({ id: m.id })));
      queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListShiniesQueryKey() });
      toast({ title: "All members removed" });
    } catch {
      toast({
        title: "Error",
        description: "Some deletions may have failed. Refresh to verify.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-mono text-white">Manage members</h2>
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10"
          onClick={handleDeleteAll}
          disabled={!members?.length}
        >
          <UserX className="w-4 h-4 mr-2" />
          Remove all
        </Button>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end bg-black/20 p-4 rounded-lg border border-white/5"
      >
        <div className="space-y-2 flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Username
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Display name
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Discord ID (optional)
          </label>
          <Input
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
            placeholder="For bots / staff"
          />
        </div>
        <div className="space-y-2 min-w-[160px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Rank
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-black/40 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              {RANK_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add
        </Button>
      </form>

      <Dialog open={!!editMember} onOpenChange={(o) => !o && setEditMember(null)}>
        <DialogContent className="glass-panel border-primary/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary">Edit member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-mono">
                Username
              </label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-mono">
                Display name
              </label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-mono">
                Discord ID
              </label>
              <Input
                value={editDiscordId}
                onChange={(e) => setEditDiscordId(e.target.value)}
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase font-mono">
                Rank
              </label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  {RANK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-primary"
            >
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Display</TableHead>
              <TableHead className="text-muted-foreground">@User</TableHead>
              <TableHead className="text-muted-foreground">Discord</TableHead>
              <TableHead className="text-muted-foreground">Rank</TableHead>
              <TableHead className="text-muted-foreground">Shinies</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              members?.map((member) => (
                <TableRow
                  key={member.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="font-bold text-white">
                    {member.displayName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    @{member.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {member.discordId || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="bg-white/10 px-2 py-1 rounded text-xs capitalize">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-secondary">
                    {member.shinyCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(member.joinedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(member)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                      className="text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
