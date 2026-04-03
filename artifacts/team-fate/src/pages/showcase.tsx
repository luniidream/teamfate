import { useState } from "react";
import { useListShinies, useListMembers, useListShinyTypes } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, MapPin, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Showcase() {
  const [search, setSearch] = useState("");
  const [memberId, setMemberId] = useState<string>("all");
  const [typeId, setTypeId] = useState<string>("all");

  const { data: members } = useListMembers();
  const { data: shinyTypes } = useListShinyTypes();
  const { data: shiniesData, isLoading } = useListShinies({
    query: {
      queryKey: ["shinies", search, memberId, typeId],
    },
    request: {
      // Manual params mapping since the generated hook signature might need them passed as params or path depending on exact swagger
    }
  }); // Note: The actual API call parameters depend on the generated hook signature, assuming it filters nicely or we filter locally

  // Local filtering if API params aren't perfectly aligned
  const filteredShinies = shiniesData?.shinies?.filter(s => {
    if (search && !s.pokemonName.toLowerCase().includes(search.toLowerCase())) return false;
    if (memberId !== "all" && s.memberId.toString() !== memberId) return false;
    if (typeId !== "all" && s.shinyTypeId?.toString() !== typeId) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            SHOWCASE
          </h1>
          <p className="text-muted-foreground">The latest shiny discoveries from Team Fate.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search Pokémon..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
          
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="w-full sm:w-[150px] bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Hunter" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              <SelectItem value="all">All Hunters</SelectItem>
              {members?.map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeId} onValueChange={setTypeId}>
            <SelectTrigger className="w-full sm:w-[150px] bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Shiny Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 text-white">
              <SelectItem value="all">All Types</SelectItem>
              {shinyTypes?.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  <span className="flex items-center gap-2">
                    {t.iconUrl ? <img src={t.iconUrl} className="w-4 h-4" alt=""/> : null}
                    {t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse glass-panel" />
          ))}
        </div>
      ) : filteredShinies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredShinies.map((shiny) => (
            <Card key={shiny.id} className="glass-panel overflow-hidden border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1 group">
              <div className="relative h-40 bg-gradient-to-b from-black/60 to-black/20 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {shiny.isAlpha && (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                      ALPHA
                    </Badge>
                  )}
                  {shiny.isSecret && (
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
                      SECRET
                    </Badge>
                  )}
                </div>

                {shiny.shinyTypeName && (
                  <Badge variant="secondary" className="absolute top-3 right-3 bg-white/10 text-white border-white/20 backdrop-blur-md">
                    {shiny.shinyTypeIconUrl ? (
                      <img src={shiny.shinyTypeIconUrl} className="w-3 h-3 mr-1 inline" alt="" />
                    ) : null}
                    {shiny.shinyTypeName}
                  </Badge>
                )}

                <img 
                  src={shiny.pokemonSpriteUrl} 
                  alt={shiny.pokemonName}
                  className="w-28 h-28 object-contain pixel-sprite relative z-10 drop-shadow-[0_0_15px_rgba(255,110,180,0.5)] group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4 space-y-3 bg-black/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono font-bold text-lg text-white capitalize group-hover:text-primary transition-colors">{shiny.pokemonName}</h3>
                    <p className="text-sm text-secondary flex items-center gap-1">
                      <span className="text-muted-foreground text-xs">by</span> {shiny.memberDisplayName}
                    </p>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    #{shiny.pokemonId.toString().padStart(4, '0')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-muted-foreground pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1" title="Catch Date">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate">{format(new Date(shiny.caughtAt), 'MMM d, yyyy')}</span>
                  </div>
                  {shiny.location && (
                    <div className="flex items-center gap-1" title="Location">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{shiny.location}</span>
                    </div>
                  )}
                  {shiny.catchMethod && (
                    <div className="flex items-center gap-1" title="Method">
                      <Activity className="w-3 h-3" />
                      <span className="truncate">{shiny.catchMethod}</span>
                    </div>
                  )}
                  {shiny.encounterNumber && shiny.encounterNumber > 0 && (
                    <div className="flex items-center gap-1" title="Encounters">
                      <span className="font-mono px-1 bg-white/10 rounded">
                        {shiny.encounterNumber}
                      </span>
                      encounters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-xl flex flex-col items-center justify-center text-muted-foreground space-y-4">
          <Sparkles className="w-12 h-12 opacity-20" />
          <p className="text-lg">No shinies found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
