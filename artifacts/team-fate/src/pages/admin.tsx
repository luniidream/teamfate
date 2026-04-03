import { useState } from "react";
import { useAdminMe, useAdminLogin, useAdminLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MembersTab from "@/components/admin/MembersTab";
import ShiniesTab from "@/components/admin/ShiniesTab";
import ShinyTypesTab from "@/components/admin/ShinyTypesTab";
import BountiesTab from "@/components/admin/BountiesTab";
import NextEventTab from "@/components/admin/NextEventTab";

export default function Admin() {
  const { data: adminMe, isLoading } = useAdminMe();
  const loginMutation = useAdminLogin();
  const logoutMutation = useAdminLogout();
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { password } }, {
      onSuccess: (res) => {
        if (res.success) {
          toast({ title: "Access Granted", description: "Welcome to the command center." });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
        } else {
          toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" });
        }
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to verify credentials.", variant: "destructive" });
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
        toast({ title: "Logged Out", description: "Session terminated." });
      }
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!adminMe?.authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in">
        <Card className="w-full max-w-md glass-panel border-secondary/30">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-secondary/10 p-3 rounded-full w-fit mb-2">
              <ShieldAlert className="w-8 h-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl font-mono text-white">ADMIN TERMINAL</CardTitle>
            <CardDescription className="text-muted-foreground">Authorized personnel only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter clearance code..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-white/30 text-center font-mono"
              />
              <Button type="submit" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "VERIFYING..." : "AUTHENTICATE"}
              </Button>
            </form>
            <p className="text-center text-xs text-white/30 mt-6">Contact system administrator for credentials.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 glass-panel">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-secondary" />
            ADMIN TERMINAL
          </h1>
          <p className="text-sm text-muted-foreground">Manage guild data and events.</p>
        </div>
        <Button variant="outline" className="border-white/10 text-muted-foreground hover:text-white hover:bg-white/5" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> LOGOUT
        </Button>
      </header>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-black/40 border border-white/10 w-full justify-start overflow-x-auto rounded-xl p-1 mb-6 h-auto flex-wrap">
          <TabsTrigger value="members" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">MEMBERS</TabsTrigger>
          <TabsTrigger value="shinies" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">SHINIES</TabsTrigger>
          <TabsTrigger value="shiny-types" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">SHINY TYPES</TabsTrigger>
          <TabsTrigger value="bounties" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">BOUNTIES</TabsTrigger>
          <TabsTrigger value="event" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">NEXT EVENT</TabsTrigger>
        </TabsList>
        
        <div className="glass-panel p-6 rounded-xl border-white/5">
          <TabsContent value="members" className="mt-0"><MembersTab /></TabsContent>
          <TabsContent value="shinies" className="mt-0"><ShiniesTab /></TabsContent>
          <TabsContent value="shiny-types" className="mt-0"><ShinyTypesTab /></TabsContent>
          <TabsContent value="bounties" className="mt-0"><BountiesTab /></TabsContent>
          <TabsContent value="event" className="mt-0"><NextEventTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
