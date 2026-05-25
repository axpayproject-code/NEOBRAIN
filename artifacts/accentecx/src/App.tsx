import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";

// Role-based dashboard pages
import ParentDashboard from "@/pages/dashboards/ParentDashboard";
import DoctorDashboard from "@/pages/dashboards/DoctorDashboard";
import TherapistDashboard from "@/pages/dashboards/TherapistDashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";

// Legacy generic pages (still accessible for reference)
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import Dashboard from "@/pages/Dashboard";
import ChildrenList from "@/pages/ChildrenList";
import ChildDetail from "@/pages/ChildDetail";
import ScreeningsList from "@/pages/ScreeningsList";
import ScreeningDetail from "@/pages/ScreeningDetail";
import AppointmentsList from "@/pages/AppointmentsList";
import TherapyPlansList from "@/pages/TherapyPlansList";
import ReportsList from "@/pages/ReportsList";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Redirect to={`/${user.role}`} />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login">
        {user ? <Redirect to={`/${user.role}`} /> : <Login />}
      </Route>
      <Route path="/onboarding" component={Onboarding} />

      {/* ── Role-based dashboards ── */}
      <Route path="/parent">
        <ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>
      </Route>
      <Route path="/doctor">
        <ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>
      </Route>
      <Route path="/therapist">
        <ProtectedRoute requiredRole="therapist"><TherapistDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      </Route>

      {/* ── Legacy generic routes ── */}
      <Route path="/dashboard">
        <SidebarLayout><Dashboard /></SidebarLayout>
      </Route>
      <Route path="/children">
        <SidebarLayout><ChildrenList /></SidebarLayout>
      </Route>
      <Route path="/children/:id">
        {params => <SidebarLayout><ChildDetail id={Number(params.id)} /></SidebarLayout>}
      </Route>
      <Route path="/screenings">
        <SidebarLayout><ScreeningsList /></SidebarLayout>
      </Route>
      <Route path="/screenings/:id">
        {params => <SidebarLayout><ScreeningDetail id={Number(params.id)} /></SidebarLayout>}
      </Route>
      <Route path="/appointments">
        <SidebarLayout><AppointmentsList /></SidebarLayout>
      </Route>
      <Route path="/therapy">
        <SidebarLayout><TherapyPlansList /></SidebarLayout>
      </Route>
      <Route path="/reports">
        <SidebarLayout><ReportsList /></SidebarLayout>
      </Route>
      <Route path="/settings">
        <SidebarLayout><Settings /></SidebarLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
