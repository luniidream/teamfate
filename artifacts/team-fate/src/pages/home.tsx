import { useGetStats, useListShinies, useListBounties, useGetNextEvent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Users, Star, Calendar as CalendarIcon, Trophy } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: bountiesData } = useListBounties();
  const { data: nextEvent } = useGetNextEvent();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-mono font-bold tracking-tight text-white neon-text-pink">
          GUILD HALL
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to Team Fate's central hub. Track, hunt, and celebrate.
        </p>
      </header>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-panel border-primary/20 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Members</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-white">
              {stats?.memberCount ?? 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-secondary/20 hover:border-secondary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Shinies</CardTitle>
            <Sparkles className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-white">
              {stats?.totalShinies ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20 hover:border-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Shiny Points</CardTitle>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold text-white">
              {stats?.shinyPoints ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            LATEST CATCHES
          </h2>
          
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="bg-black/40 border border-white/10">
              <TabsTrigger value="week" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">This Week</TabsTrigger>
              <TabsTrigger value="lastWeek" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Last Week</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All Time</TabsTrigger>
            </TabsList>
            
            <TabsContent value="week" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stats?.recentCatches?.slice(0, 8).map((record) => (
                  <div key={record.id} className="glass-panel rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:-translate-y-1 transition-transform group cursor-pointer neon-border-pink hover:bg-white/5">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={record.pokemonSpriteUrl} 
                        alt={record.pokemonName}
                        className="w-full h-full object-contain pixel-sprite relative z-10"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-bold capitalize text-white group-hover:text-primary transition-colors">
                        {record.pokemonName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by <span className="text-secondary">{record.memberDisplayName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="lastWeek" className="mt-4">
              <div className="text-muted-foreground text-center py-8">Select timeframe to view past catches.</div>
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <div className="text-muted-foreground text-center py-8">Select timeframe to view past catches.</div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              BOUNTIES
            </h2>
            <div className="space-y-4">
              {bountiesData?.map((bounty) => (
                <Card key={bounty.id} className="glass-panel overflow-hidden border-secondary/30 relative">
                  {bounty.imageUrl && (
                    <div className="h-32 w-full">
                      <img src={bounty.imageUrl} alt={bounty.title} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                    </div>
                  )}
                  <CardHeader className={`${bounty.imageUrl ? 'pt-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent' : ''}`}>
                    <CardTitle className="text-lg font-mono text-white">{bounty.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{bounty.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-bold text-secondary px-2 py-1 bg-secondary/10 rounded-full">{bounty.points} PTS</span>
                      <span className="text-xs text-muted-foreground">{bounty.month}</span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {(!bountiesData || bountiesData.length === 0) && (
                <div className="glass-panel p-6 text-center text-muted-foreground rounded-xl">
                  No active bounties.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-yellow-500" />
              NEXT EVENT
            </h2>
            {nextEvent ? (
              <Card className="glass-panel border-yellow-500/30">
                {nextEvent.imageUrl && (
                  <div className="h-32 w-full">
                    <img src={nextEvent.imageUrl} alt={nextEvent.title} className="w-full h-full object-cover opacity-80" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-mono font-bold text-lg text-white">{nextEvent.title}</h3>
                  <p className="text-sm text-muted-foreground">{nextEvent.description}</p>
                  {nextEvent.eventDate && (
                    <div className="text-sm font-medium text-yellow-500 mt-2">
                      {format(new Date(nextEvent.eventDate), 'PPP')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="glass-panel p-6 text-center text-muted-foreground rounded-xl">
                No upcoming events.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
