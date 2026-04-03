import { Link, useLocation } from "wouter";
import { Sparkles, LayoutDashboard, Grid, GalleryVerticalEnd, Info, ShieldAlert, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: settings } = useSiteSettings();

  const navLinks = [
    { href: "/", label: settings?.navHomeLabel ?? "Home", icon: LayoutDashboard },
    { href: "/about", label: settings?.navTeamInfoLabel ?? "Team Info", icon: Info },
    { href: "/showcase", label: settings?.navShowcaseLabel ?? "Shiny Showcase", icon: GalleryVerticalEnd },
    { href: "/shiny-dex", label: settings?.navShinyDexLabel ?? "Shiny Dex", icon: Grid },
    { href: "/recruitment", label: settings?.navRecruitmentLabel ?? "Recruitment", icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-mono font-bold text-lg tracking-tight text-white group-hover:neon-text-pink transition-all">
            TEAM FATE
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={`gap-2 ${
                  location === link.href
                    ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          ))}
          <div className="w-px h-6 bg-border mx-2" />
          <Link href="/admin">
            <Button
              variant="ghost"
              size="icon"
              className={
                location.startsWith("/admin")
                  ? "bg-secondary/20 text-secondary hover:bg-secondary/30 hover:text-secondary"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }
            >
              <ShieldAlert className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-1 border-t border-white/10 mt-3 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 ${
                  location === link.href
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Button>
            </Link>
          ))}
          <Link href="/admin">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${
                location.startsWith("/admin")
                  ? "bg-secondary/20 text-secondary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShieldAlert className="w-4 h-4" />
              Admin Panel
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
