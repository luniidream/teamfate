import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MemberLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.memberAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Logged in");
      setLocation("/my-shinies");
    },
    onError: (e) => {
      setError(e.message || "Invalid credentials");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter username and password");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  const loading = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1
            className="text-3xl md:text-4xl mb-4"
            style={{
              color: "#ec4899",
              textShadow: "0 0 15px rgba(236, 72, 153, 0.8)",
            }}
          >
            Member login
          </h1>
          <p className="text-gray-400">Use the password your admin gave you</p>
        </div>

        <form onSubmit={handleLogin}>
          <div
            className="p-8 rounded-lg mb-6"
            style={{
              background: "rgba(20, 20, 20, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(236, 72, 153, 0.3)",
              boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
            }}
          >
            <div className="mb-6">
              <label className="block text-sm font-bold text-pink-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your member username"
                className="w-full px-4 py-2 bg-background border border-pink-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-pink-500"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-pink-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your member password"
                className="w-full px-4 py-2 bg-background border border-pink-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-pink-500"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-pink-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-pink-500 flex items-center justify-center gap-2"
              style={{ boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-400">
          <p>No account yet? Ask an admin to add you — they can reset your password anytime.</p>
        </div>
      </div>
    </div>
  );
}
