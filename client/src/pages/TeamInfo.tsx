import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function TeamInfo() {
  const [, go] = useLocation();
  const { data: members = [], isLoading: membersLoading } = trpc.members.list.useQuery();
  const { data: settings, isLoading: settingsLoading } = trpc.siteSettings.get.useQuery();

  const loading = membersLoading || settingsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-400" size={48} />
      </div>
    );
  }

  const sortedMembers = [...members].sort((a, b) => b.shinyPoints - a.shinyPoints);
  const title = settings?.teamInfoTitle ?? "Team Fate";
  const description =
    settings?.teamInfoDescription?.trim() ||
    "We are a PokeMMO shiny-hunting team. Check recruitment for requirements, perks, and how to apply.";
  const ctaLabel = settings?.teamInfoButtonLabel ?? "View recruitment";
  const recruitmentPath = "/recruitment";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-12 px-4 max-w-4xl mx-auto">
        <h1
          className="text-3xl md:text-4xl mb-6 text-center"
          style={{
            color: "#ec4899",
            textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
          }}
        >
          {title}
        </h1>

        <div
          className="p-8 rounded-lg mb-10 text-center md:text-left"
          style={{
            background: "rgba(20, 20, 20, 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(236, 72, 153, 0.3)",
            boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
          }}
        >
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap mb-8">{description}</p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Button
              type="button"
              onClick={() => go(recruitmentPath)}
              className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500"
              style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>

        <h2
          className="text-2xl md:text-3xl mb-8 text-center"
          style={{
            color: "#ec4899",
            textShadow: "0 0 15px rgba(236, 72, 153, 0.6)",
          }}
        >
          Roster
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMembers.map((member, index) => (
            <div
              key={member.id}
              className="p-6 rounded-lg"
              style={{
                background: "rgba(20, 20, 20, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-pink-400">#{index + 1}</div>
                  <h3 className="text-lg font-bold text-white mt-2">{member.displayName}</h3>
                </div>
              </div>

              <div className="space-y-3 border-t border-pink-500/20 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Shinies</span>
                  <span className="text-pink-400 font-bold">{member.shinyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Points</span>
                  <span className="text-teal-400 font-bold">{member.shinyPoints}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
