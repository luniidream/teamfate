import { useState, useEffect } from "react";
import { useGetNextEvent, useUpdateNextEvent, getGetNextEventQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function NextEventTab() {
  const { data: event, isLoading } = useGetNextEvent();
  const updateMutation = useUpdateNextEvent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventDate(event.eventDate || "");
    }
  }, [event]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    updateMutation.mutate({ data: { title, description, eventDate: eventDate || null } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNextEventQueryKey() });
        toast({ title: "Event Updated" });
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading event...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-mono text-white">Next Event Details</h2>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">Event Title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/40 border-white/10 text-white" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">Description</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-black/40 border-white/10 text-white min-h-[100px]" />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase font-mono">Date (Optional)</label>
          <Input type="date" value={eventDate ? eventDate.split('T')[0] : ""} onChange={e => setEventDate(e.target.value ? new Date(e.target.value).toISOString() : "")} className="bg-black/40 border-white/10 text-white" />
        </div>
        <Button type="submit" disabled={updateMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/80 w-full mt-4">
          <Save className="w-4 h-4 mr-2" /> SAVE EVENT
        </Button>
      </form>
    </div>
  );
}
