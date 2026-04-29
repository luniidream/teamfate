import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { data: settings } = trpc.siteSettings.get.useQuery(undefined, {
    staleTime: 60_000,
  });

  const navItems = [
    { label: settings?.navHomeLabel ?? "Home", path: "/" },
    { label: settings?.navTeamInfoLabel ?? "Team Info", path: "/team-info" },
    { label: settings?.navShowcaseLabel ?? "Shiny Showcase", path: "/showcase" },
    { label: settings?.navDexLabel ?? "Shiny Dex", path: "/dex" },
    { label: settings?.navRecruitmentLabel ?? "Recruitment", path: "/recruitment" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-pink-500/30" style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(12px)" }}>
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="text-2xl font-bold" style={{ color: "#ec4899", textShadow: "0 0 15px rgba(236, 72, 153, 0.8)" }}>
          TEAM FATE
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={`font-mono text-sm transition-colors ${
                isActive(item.path) ? "text-pink-400" : "text-gray-300 hover:text-white"
              }`}
              style={{
                textShadow: isActive(item.path) ? "0 0 15px rgba(236, 72, 153, 0.8)" : "none"
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/member-login"
            className="font-mono text-xs text-gray-400 hover:text-pink-400 transition-colors"
          >
            Member login
          </a>
        </div>

        <button className="md:hidden text-pink-400" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-pink-500/30" style={{ background: "rgba(0, 0, 0, 0.9)", backdropFilter: "blur(12px)" }}>
          <div className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`font-mono text-sm transition-colors ${
                  isActive(item.path) ? "text-pink-400" : "text-gray-300 hover:text-white"
                }`}
                style={{
                  textShadow: isActive(item.path) ? "0 0 15px rgba(236, 72, 153, 0.8)" : "none"
                }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/member-login"
              className="font-mono text-xs text-gray-400 hover:text-pink-400"
              onClick={() => setMobileOpen(false)}
            >
              Member login
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
