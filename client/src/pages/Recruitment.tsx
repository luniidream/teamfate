import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

function perksToBlocks(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function Recruitment() {
  const { data: settings, isLoading } = trpc.siteSettings.get.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-400" size={48} />
      </div>
    );
  }

  const open = settings?.recruitmentOpen ?? true;
  const title = settings?.recruitmentTitle ?? "Recruitment";
  const requirements = settings?.recruitmentRequirements ?? "";
  const perksLines = perksToBlocks(settings?.recruitmentPerks);
  const discordLabel = settings?.recruitmentDiscordLabel ?? "Join Discord";
  const discordUrl = settings?.recruitmentDiscordUrl ?? "";

  const defaultPerks = [
    "Community hunts and shared knowledge",
    "Bounties and team goals",
    "Shiny showcase and dex tracking",
  ];
  const perksDisplay = perksLines.length > 0 ? perksLines : defaultPerks;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-2xl py-12 px-4">
        {open ? (
          <>
            <h1
              className="text-3xl md:text-4xl mb-8 text-center"
              style={{
                color: "#ec4899",
                textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
              }}
            >
              {title}
            </h1>

            <div
              className="p-8 rounded-lg mb-8"
              style={{
                background: "rgba(20, 20, 20, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
              }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-pink-400 mb-4">Requirements</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {requirements || "Ask the team for current requirements — admins can edit this in the terminal."}
                </p>
              </div>

              <div className="border-t border-pink-500/20 pt-6">
                <h2 className="text-xl font-bold text-pink-400 mb-4">Perks</h2>
                <ul className="space-y-3 text-gray-400">
                  {perksDisplay.map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-teal-400 shrink-0">✨</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {discordUrl ? (
              <div className="text-center">
                <Button
                  type="button"
                  onClick={() => window.open(discordUrl, "_blank", "noopener,noreferrer")}
                  className="px-8 py-4 bg-teal-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-teal-500 text-lg"
                  style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
                >
                  {discordLabel}
                </Button>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm">
                Discord link can be set in the admin terminal under Site settings.
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h1
              className="text-3xl md:text-4xl mb-8"
              style={{
                color: "#ec4899",
                textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
              }}
            >
              Recruitment closed
            </h1>
            <p className="text-gray-400 text-lg">We are not accepting new members right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
