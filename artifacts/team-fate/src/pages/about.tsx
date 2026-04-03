import { useListMembers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Users, Star, Info, Target, Sparkles, Shield } from "lucide-react";

export default function About() {
  const { data: members, isLoading } = useListMembers();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4 text-center max-w-3xl mx-auto py-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-2 border border-primary/30 neon-border-pink">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-mono font-bold tracking-tight text-white neon-text-pink">
          TEAM FATE
        </h1>
        <p className="text-muted-foreground text-lg">
          We are a dedicated community of Pokémon shiny hunters. Our mission is to track down the rarest alternate-colored Pokémon across all regions, document our journeys, and celebrate every sparkle.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            RECRUITMENT
          </h2>
          <Card className="glass-panel border-secondary/20 h-[calc(100%-2.5rem)]">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-white">Join the Hunt</h3>
              <p className="text-muted-foreground leading-relaxed">
                Team Fate is currently <span className="text-secondary font-bold">open</span> for recruitment. We are looking for passionate hunters who love the thrill of the chase, whether you prefer full odds hunting, Masuda method, Pokeradar, or outbreak chaining.
              </p>
              <div className="space-y-2 mt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-white/10 p-1 rounded-full"><Star className="w-3 h-3 text-yellow-500" /></div>
                  <div>
                    <span className="font-bold text-white">Active Participation:</span>
                    <p className="text-sm text-muted-foreground">Regularly update your catches and participate in monthly bounties.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 bg-white/10 p-1 rounded-full"><Users className="w-3 h-3 text-blue-400" /></div>
                  <div>
                    <span className="font-bold text-white">Community Spirit:</span>
                    <p className="text-sm text-muted-foreground">Support other members, share tips, and celebrate together.</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 mt-6">
                <p className="text-sm text-muted-foreground italic">
                  Contact an Admin on Discord to apply. Prepare your trainer card and top 3 favorite shiny catches.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            ROSTER
          </h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
              ))
            ) : members?.length ? (
              members.map((member) => (
                <div key={member.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors border-l-2 border-l-transparent hover:border-l-primary">
                  <Avatar className="h-12 w-12 border border-white/20">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-mono font-bold">
                      {member.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{member.displayName}</span>
                        {member.role === 'admin' && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1 py-0 h-4">
                            <Shield className="w-3 h-3 mr-1 inline" /> ADMIN
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                        <Star className="w-3 h-3" />
                        {member.shinyPoints}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground truncate">@{member.username}</span>
                      <span className="text-secondary font-mono">{member.shinyCount} Shinies</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground glass-panel rounded-xl">
                No members found.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
