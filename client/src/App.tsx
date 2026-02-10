import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Portfolios from "./pages/Portfolios";
import Home from "./pages/Home";
import PortfolioDetail from "./pages/PortfolioDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Portfolios} />
      <Route path={"/simulator"} component={Home} />
      <Route path={"/portfolio/:id"} component={PortfolioDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
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
