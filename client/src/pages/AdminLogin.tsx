import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      await utils.adminAuth.me.refetch();
      toast.success("Admin session started");
      setLocation("/admin");
    },
    onError: (e) => {
      setError(e.message || "Invalid password");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ password });
  };

  const loading = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1
            className="text-3xl md:text-4xl mb-4"
            style={{
              color: "#22c55e",
              textShadow: "0 0 15px rgba(34, 197, 94, 0.8)",
            }}
          >
            ADMIN TERMINAL
          </h1>
          <p className="text-gray-400">Guild management (not linked in the public nav)</p>
        </div>

        <form onSubmit={handleLogin}>
          <div
            className="p-8 rounded-lg mb-6"
            style={{
              background: "rgba(20, 20, 20, 0.8)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              boxShadow: "0 0 20px rgba(34, 197, 94, 0.1)",
            }}
          >
            <div className="mb-6">
              <label className="block text-sm font-bold text-teal-400 mb-2">Admin password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-2 bg-background border border-teal-500/30 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-teal-500"
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
              disabled={loading || !password}
              className="w-full px-6 py-3 bg-teal-600 text-white font-bold rounded-lg transition-all duration-300 hover:bg-teal-500 flex items-center justify-center gap-2"
              style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                "Enter terminal"
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-gray-400">
          <p>Restricted access — open this page only via direct URL /admin-login</p>
        </div>
      </div>
    </div>
  );
}
