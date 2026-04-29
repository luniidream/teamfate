import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.stats.get.useQuery();

  const loading = statsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-400" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="py-20 px-4 text-center">
        <h1
          className="mb-4 text-4xl md:text-6xl"
          style={{
            color: "#ec4899",
            textShadow: "0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4)",
          }}
        >
          TEAM FATE
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-8">PokeMMO shiny team tracker</p>
      </section>

      <section className="py-12 px-4">
        <div className="container">
          <div
            className="p-8 rounded-lg"
            style={{
              background: "rgba(20, 20, 20, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(236, 72, 153, 0.3)",
              boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
            }}
          >
            <h2
              className="text-2xl md:text-3xl mb-8 text-center"
              style={{
                color: "#ec4899",
                textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
              }}
            >
              STATUS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div
                  className="text-3xl md:text-4xl font-bold"
                  style={{
                    color: "#ec4899",
                    textShadow: "0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4)",
                  }}
                >
                  {stats?.memberCount ?? 0}
                </div>
                <div className="text-sm md:text-base text-gray-400 mt-2 font-mono">MEMBERS</div>
              </div>
              <div className="text-center">
                <div
                  className="text-3xl md:text-4xl font-bold"
                  style={{
                    color: "#ec4899",
                    textShadow: "0 0 15px rgba(236, 72, 153, 0.8), 0 0 30px rgba(236, 72, 153, 0.4)",
                  }}
                >
                  {stats?.totalShinies ?? 0}
                </div>
                <div className="text-sm md:text-base text-gray-400 mt-2 font-mono">TEAM SHINIES</div>
              </div>
            </div>
          </div>
        </div>
      </section>



      <section className="py-12 px-4 text-center border-t border-pink-500/20">
        <div className="container flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => setLocation("/team-info")}
            className="px-6 py-3 bg-pink-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-pink-500"
            style={{ boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)" }}
          >
            Team info
          </Button>
          <Button
            onClick={() => setLocation("/showcase")}
            className="px-6 py-3 bg-pink-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-pink-500"
            style={{ boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)" }}
          >
            Shiny showcase
          </Button>
          <Button
            onClick={() => setLocation("/dex")}
            className="px-6 py-3 bg-pink-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-pink-500"
            style={{ boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)" }}
          >
            Shiny dex
          </Button>
          <Button
            onClick={() => setLocation("/recruitment")}
            className="px-6 py-3 bg-teal-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-teal-500"
            style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
          >
            Join us
          </Button>
        </div>
      </section>
    </div>
  );
}
