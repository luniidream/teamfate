import { useState } from "react";
import {
  useListBounties,
  useCreateBounty,
  useDeleteBounty,
  useUploadFile,
  getListBountiesQueryKey,
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
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, ImagePlus } from "lucide-react";

export default function BountiesTab() {
  const { data: bounties, isLoading } = useListBounties();
  const createMutation = useCreateBounty();
  const deleteMutation = useDeleteBounty();
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState("");
  const [rewards, setRewards] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!month.trim()) return;

    createMutation.mutate(
      {
        data: {
          month: month.trim(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          points:
            rewards.trim() === "" ? undefined : parseInt(rewards.trim(), 10),
          isActive: true,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBountiesQueryKey() });
          toast({ title: "Bounty added" });
          setTitle("");
          setDescription("");
          setMonth("");
          setRewards("");
          setImageUrl("");
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this bounty?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBountiesQueryKey() });
            toast({ title: "Bounty removed" });
          },
        },
      );
    }
  };

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    uploadMutation.mutate(
      { data: { file } },
      {
        onSuccess: (res) => {
          setImageUrl(res.url);
          toast({ title: "Image uploaded" });
        },
        onError: () => {
          toast({
            title: "Upload failed",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage bounties</h2>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end bg-black/20 p-4 rounded-lg border border-white/5"
      >
        <div className="space-y-2 flex-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Title (optional)
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[120px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Month (required)
          </label>
          <Input
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
            placeholder="e.g. March 2026"
          />
        </div>
        <div className="space-y-2 w-full md:w-32">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Rewards (optional)
          </label>
          <Input
            type="number"
            value={rewards}
            onChange={(e) => setRewards(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Image URL (optional)
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
            placeholder="https://… or upload"
          />
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImagePick}
            />
            <span className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-white/20 text-sm text-white hover:bg-white/10">
              <ImagePlus className="w-4 h-4 mr-2" />
              Upload
            </span>
          </label>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </form>

      <div className="rounded-md border border-white/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-black/40">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Month</TableHead>
              <TableHead className="text-muted-foreground">Rewards</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              bounties?.map((bounty) => (
                <TableRow
                  key={bounty.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="font-bold text-white">
                    {bounty.title}
                    {bounty.description ? (
                      <span className="block text-xs font-normal text-muted-foreground mt-1">
                        {bounty.description}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bounty.month}
                  </TableCell>
                  <TableCell className="font-mono text-secondary">
                    {bounty.points ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(bounty.id)}
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
