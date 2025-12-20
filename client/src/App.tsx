import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Shell from "@/components/layout/Shell";
import Dashboard from "@/pages/Dashboard";
import CreateJob from "@/pages/CreateJob";
import JobCard from "@/pages/JobCard";
import Kanban from "@/pages/Kanban";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";
import Completed from "@/pages/Completed";
import { useAuth } from "@/lib/api";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
        <Route path="/create-job">{() => <ProtectedRoute component={CreateJob} />}</Route>
        <Route path="/jobs/:id">{() => <ProtectedRoute component={JobCard} />}</Route>
        <Route path="/kanban">{() => <ProtectedRoute component={Kanban} />}</Route>
        <Route path="/completed">{() => <ProtectedRoute component={Completed} />}</Route>
        <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
