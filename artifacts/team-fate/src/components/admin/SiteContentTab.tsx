import { useEffect, useState } from "react";
import {
  defaultSiteSettings,
  useSiteSettings,
  useUpdateSiteSettings,
  type SiteSettings,
} from "@/hooks/use-site-settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function SiteContentTab() {
  const { data } = useSiteSettings();
  const updateMutation = useUpdateSiteSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form, {
      onSuccess: () => {
        toast({ title: "Site content updated" });
      },
      onError: () => {
        toast({
          title: "Save failed",
          description: "Could not save site content settings.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <form onSubmit={onSave} className="space-y-6 max-w-3xl">
      <div className="space-y-3">
        <h2 className="text-xl font-mono text-white">Navigation Labels</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Input value={form.navHomeLabel} onChange={(e) => setForm({ ...form, navHomeLabel: e.target.value })} placeholder="Home label" className="bg-black/40 border-white/10 text-white" />
          <Input value={form.navTeamInfoLabel} onChange={(e) => setForm({ ...form, navTeamInfoLabel: e.target.value })} placeholder="Team info label" className="bg-black/40 border-white/10 text-white" />
          <Input value={form.navShowcaseLabel} onChange={(e) => setForm({ ...form, navShowcaseLabel: e.target.value })} placeholder="Showcase label" className="bg-black/40 border-white/10 text-white" />
          <Input value={form.navShinyDexLabel} onChange={(e) => setForm({ ...form, navShinyDexLabel: e.target.value })} placeholder="Shiny dex label" className="bg-black/40 border-white/10 text-white" />
          <Input value={form.navRecruitmentLabel} onChange={(e) => setForm({ ...form, navRecruitmentLabel: e.target.value })} placeholder="Recruitment label" className="bg-black/40 border-white/10 text-white md:col-span-2" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-mono text-white">Team Info Page</h2>
        <Input value={form.teamInfoTitle} onChange={(e) => setForm({ ...form, teamInfoTitle: e.target.value })} placeholder="Team info title" className="bg-black/40 border-white/10 text-white" />
        <Textarea value={form.teamInfoDescription} onChange={(e) => setForm({ ...form, teamInfoDescription: e.target.value })} placeholder="Team info description" className="bg-black/40 border-white/10 text-white min-h-[120px]" />
        <Input value={form.teamInfoButtonLabel} onChange={(e) => setForm({ ...form, teamInfoButtonLabel: e.target.value })} placeholder="Team info button label" className="bg-black/40 border-white/10 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-mono text-white">Recruitment Page</h2>
        <Input value={form.recruitmentTitle} onChange={(e) => setForm({ ...form, recruitmentTitle: e.target.value })} placeholder="Recruitment title" className="bg-black/40 border-white/10 text-white" />
        <Textarea value={form.recruitmentRequirements} onChange={(e) => setForm({ ...form, recruitmentRequirements: e.target.value })} placeholder="Recruitment requirements (write everything here)" className="bg-black/40 border-white/10 text-white min-h-[160px]" />
        <div className="grid md:grid-cols-2 gap-3">
          <Input value={form.recruitmentDiscordButtonLabel} onChange={(e) => setForm({ ...form, recruitmentDiscordButtonLabel: e.target.value })} placeholder="Discord button label" className="bg-black/40 border-white/10 text-white" />
          <Input value={form.recruitmentDiscordUrl} onChange={(e) => setForm({ ...form, recruitmentDiscordUrl: e.target.value })} placeholder="Discord URL" className="bg-black/40 border-white/10 text-white" />
        </div>
      </div>

      <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/80 w-full" disabled={updateMutation.isPending}>
        <Save className="w-4 h-4 mr-2" />
        SAVE SITE CONTENT
      </Button>
    </form>
  );
}
