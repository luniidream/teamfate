import { useSiteSettings } from "@/hooks/use-site-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users } from "lucide-react";

export default function Recruitment() {
  const { data: settings } = useSiteSettings();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-3">
        <h1 className="text-4xl font-mono font-bold tracking-tight text-white neon-text-pink">
          {settings?.recruitmentTitle ?? "Recruitment"}
        </h1>
        <p className="text-muted-foreground text-lg">
          Join Team Fate and hunt with the squad.
        </p>
      </header>

      <Card className="glass-panel border-secondary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {settings?.recruitmentRequirements ?? "Add your recruitment requirements from Admin."}
          </p>

          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
            <a
              href={settings?.recruitmentDiscordUrl ?? "https://discord.gg/your-server"}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {settings?.recruitmentDiscordButtonLabel ?? "Team Fate Discord Server"}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
