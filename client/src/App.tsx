import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TeamInfo from "./pages/TeamInfo";
import Recruitment from "./pages/Recruitment";
import Showcase from "./pages/Showcase";
import Dex from "./pages/Dex";
import MemberLogin from "./pages/MemberLogin";
import MyShinies from "./pages/MyShinies";
import AdminLogin from "./pages/AdminLogin";
import AdminTerminal from "./pages/AdminTerminal";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/team-info"} component={TeamInfo} />
        <Route path={"/recruitment"} component={Recruitment} />
        <Route path={"/showcase"} component={Showcase} />
        <Route path={"/dex"} component={Dex} />
        <Route path={"/member-login"} component={MemberLogin} />
        <Route path={"/my-shinies"} component={MyShinies} />
        <Route path={"/admin-login"} component={AdminLogin} />
        <Route path={"/admin"} component={AdminTerminal} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
