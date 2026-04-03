import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";

export type SiteSettings = {
  id?: number;
  navHomeLabel: string;
  navTeamInfoLabel: string;
  navShowcaseLabel: string;
  navShinyDexLabel: string;
  navRecruitmentLabel: string;
  teamInfoTitle: string;
  teamInfoDescription: string;
  teamInfoButtonLabel: string;
  recruitmentTitle: string;
  recruitmentRequirements: string;
  recruitmentDiscordButtonLabel: string;
  recruitmentDiscordUrl: string;
};

export const defaultSiteSettings: SiteSettings = {
  navHomeLabel: "Home",
  navTeamInfoLabel: "Team Info",
  navShowcaseLabel: "Shiny Showcase",
  navShinyDexLabel: "Shiny Dex",
  navRecruitmentLabel: "Recruitment",
  teamInfoTitle: "Team Fate",
  teamInfoDescription: "Welcome to Team Fate, a shiny hunting community.",
  teamInfoButtonLabel: "Go to Recruitment",
  recruitmentTitle: "Recruitment",
  recruitmentRequirements: "Add your recruitment requirements from Admin.",
  recruitmentDiscordButtonLabel: "Team Fate Discord Server",
  recruitmentDiscordUrl: "https://discord.gg/your-server",
};

async function fetchSettings(): Promise<SiteSettings> {
  const res = await fetch(getApiUrl("/api/site-settings"));
  if (!res.ok) return defaultSiteSettings;
  if (!res.headers.get("content-type")?.includes("application/json")) {
    return defaultSiteSettings;
  }
  const data = (await res.json()) as Partial<SiteSettings>;
  return { ...defaultSiteSettings, ...data };
}

async function putSettings(payload: SiteSettings): Promise<SiteSettings> {
  const res = await fetch(getApiUrl("/api/site-settings"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to save site settings");
  }
  if (!res.headers.get("content-type")?.includes("application/json")) {
    return payload;
  }
  const data = (await res.json()) as Partial<SiteSettings>;
  return { ...defaultSiteSettings, ...data };
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSettings,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: putSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(["site-settings"], next);
    },
  });
}
