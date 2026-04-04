import { useState } from "react";
import {
  useListShinyTypes,
  useCreateShinyType,
  useDeleteShinyType,
  useUploadFile,
  getListShinyTypesQueryKey,
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

export default function ShinyTypesTab() {
  const { data: types, isLoading } = useListShinyTypes();
  const createMutation = useCreateShinyType();
  const deleteMutation = useDeleteShinyType();
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [emoji, setEmoji] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  const resetForm = () => {
    setName("");
    setCode("");
    setEmoji("");
    setIconUrl("");
    setSortOrder("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !sortOrder) return;

    createMutation.mutate(
      {
        data: {
          name,
          code,
          emoji: emoji.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          isEnabled: true,
          sortOrder: parseInt(sortOrder, 10),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListShinyTypesQueryKey(),
          });
          toast({ title: "Shiny type added" });
          resetForm();
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this shiny type?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListShinyTypesQueryKey(),
            });
            toast({ title: "Shiny type removed" });
          },
        },
      );
    }
  };

  const onIconPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    uploadMutation.mutate(
      { data: { file } },
      {
        onSuccess: (res) => {
          setIconUrl(res.url);
          toast({ title: "Icon uploaded" });
        },
        onError: () =>
          toast({ title: "Upload failed", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Manage Shiny Types</h2>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 bg-black/20 p-4 rounded-lg border border-white/5"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-mono">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="e.g. Secret shiny"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-mono">
              Code
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="e.g. secret"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-mono">
              Emoji
            </label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="e.g. ✨"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-mono">
              Sort Order
            </label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase font-mono">
              Icon URL
            </label>
            <Input
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
              placeholder="/api/uploads/..."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onIconPick}
            />
            <span className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-white/20 text-sm text-white hover:bg-white/10">
              <ImagePlus className="w-4 h-4 mr-2" />
              Upload icon
            </span>
          </label>

          {iconUrl ? (
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
              <img src={iconUrl} alt="" className="w-5 h-5 object-contain" />
              <span className="text-muted-foreground truncate max-w-56">
                {iconUrl}
              </span>
            </div>
          ) : null}

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
              <TableHead className="text-muted-foreground">Icon</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Code</TableHead>
              <TableHead className="text-muted-foreground">Emoji</TableHead>
              <TableHead className="text-muted-foreground">Sort Order</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              types?.map((type) => (
                <TableRow
                  key={type.id}
                  className="border-white/10 hover:bg-white/5"
                >
                  <TableCell className="w-20">
                    <div className="flex items-center gap-2">
                      {type.iconUrl ? (
                        <img
                          src={type.iconUrl}
                          alt=""
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <span className="text-lg leading-none">
                          {type.emoji || "—"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-white">
                    {type.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.emoji || "-"}
                  </TableCell>
                  <TableCell className="font-mono">{type.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type.id)}
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
