import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ChildrenList from "@/pages/ChildrenList";
import ChildDetail from "@/pages/ChildDetail";
import ScreeningsList from "@/pages/ScreeningsList";
import ScreeningDetail from "@/pages/ScreeningDetail";
import AppointmentsList from "@/pages/AppointmentsList";
import TherapyPlansList from "@/pages/TherapyPlansList";
import ReportsList from "@/pages/ReportsList";
import Settings from "@/pages/Settings";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <SidebarLayout>
          <Dashboard />
        </SidebarLayout>
      </Route>
      <Route path="/children">
        <SidebarLayout>
          <ChildrenList />
        </SidebarLayout>
      </Route>
      <Route path="/children/:id">
        {params => (
          <SidebarLayout>
            <ChildDetail id={Number(params.id)} />
          </SidebarLayout>
        )}
      </Route>
      <Route path="/screenings">
        <SidebarLayout>
          <ScreeningsList />
        </SidebarLayout>
      </Route>
      <Route path="/screenings/:id">
        {params => (
          <SidebarLayout>
            <ScreeningDetail id={Number(params.id)} />
          </SidebarLayout>
        )}
      </Route>
      <Route path="/appointments">
        <SidebarLayout>
          <AppointmentsList />
        </SidebarLayout>
      </Route>
      <Route path="/therapy">
        <SidebarLayout>
          <TherapyPlansList />
        </SidebarLayout>
      </Route>
      <Route path="/reports">
        <SidebarLayout>
          <ReportsList />
        </SidebarLayout>
      </Route>
      <Route path="/settings">
        <SidebarLayout>
          <Settings />
        </SidebarLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
