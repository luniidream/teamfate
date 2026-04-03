import { useState, useEffect } from "react";
import {
  useGetNextEvent,
  useUpdateNextEvent,
  useUploadFile,
  getGetNextEventQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, ImagePlus } from "lucide-react";

export default function NextEventTab() {
  const { data: event, isLoading } = useGetNextEvent({
    query: {
      queryKey: getGetNextEventQueryKey(),
      retry: false,
    },
  });
  const updateMutation = useUpdateNextEvent();
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventDate(event.eventDate || "");
      setImageUrl(event.imageUrl || "");
      setExternalUrl(event.externalUrl || "");
    }
  }, [event]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        data: {
          title: title || undefined,
          description: description || undefined,
          imageUrl: imageUrl.trim() || undefined,
          externalUrl: externalUrl.trim() || undefined,
          eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNextEventQueryKey() });
          toast({ title: "Event updated" });
        },
        onError: () => {
          toast({
            title: "Could not save event",
            variant: "destructive",
          });
        },
      },
    );
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
        onError: () =>
          toast({ title: "Upload failed", variant: "destructive" }),
      },
    );
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-muted-foreground">Loading event…</div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Next event</h2>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-black/40 border-white/10 text-white min-h-[100px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Date (optional)
          </label>
          <Input
            type="date"
            value={eventDate ? eventDate.split("T")[0] : ""}
            onChange={(e) =>
              setEventDate(
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
            className="bg-black/40 border-white/10 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            Banner image URL (optional)
          </label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
            placeholder="https://… or upload below"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImagePick}
            />
            <span className="inline-flex items-center justify-center h-10 px-3 rounded-md border border-white/20 text-sm text-white hover:bg-white/10">
              <ImagePlus className="w-4 h-4 mr-2" />
              Upload banner
            </span>
          </label>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">
            External link (optional)
          </label>
          <Input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            className="bg-black/40 border-white/10 text-white"
            placeholder="Discord event, tickets, etc."
          />
        </div>
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/80 w-full mt-4"
        >
          <Save className="w-4 h-4 mr-2" /> Save event
        </Button>
      </form>
    </div>
  );
}
