import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Home from "@/pages/Home";
import Demo from "@/pages/Demo";
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";

// Role-based dashboard pages (aligned to 4 business types)
import ParentDashboard from "@/pages/dashboards/ParentDashboard";    // For Families
import DoctorDashboard from "@/pages/dashboards/DoctorDashboard";    // For Clinics
import TherapistDashboard from "@/pages/dashboards/TherapistDashboard"; // For Schools
import AdminDashboard from "@/pages/dashboards/AdminDashboard";       // For Government
import SuperAdminDashboard from "@/pages/dashboards/SuperAdminDashboard"; // Platform Super Admin

// Platform pages
import FamilyCare from "@/pages/platform/FamilyCare";
import ClinicalSystem from "@/pages/platform/ClinicalSystem";
import TherapySystem from "@/pages/platform/TherapySystem";
import SchoolIntegration from "@/pages/platform/SchoolIntegration";
import Telehealth from "@/pages/platform/Telehealth";
import NationalAnalytics from "@/pages/platform/NationalAnalytics";

// Company pages
import About from "@/pages/company/About";
import ClinicalPartners from "@/pages/company/ClinicalPartners";
import ForGovernment from "@/pages/company/ForGovernment";
import Privacy from "@/pages/company/Privacy";
import Terms from "@/pages/company/Terms";
import Contact from "@/pages/company/Contact";

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
import FloatingChat from "@/components/ui/FloatingChat";

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
      {/* ── Landing ── */}
      <Route path="/" component={Home} />
      <Route path="/demo" component={Demo} />
      <Route path="/login">
        {user ? <Redirect to={`/${user.role}`} /> : <Login />}
      </Route>
      <Route path="/onboarding" component={Onboarding} />

      {/* ── Role-based dashboards (4 business types) ── */}
      <Route path="/family">
        <ProtectedRoute requiredRole="family"><ParentDashboard /></ProtectedRoute>
      </Route>
      <Route path="/clinic">
        <ProtectedRoute requiredRole="clinic"><DoctorDashboard /></ProtectedRoute>
      </Route>
      <Route path="/school">
        <ProtectedRoute requiredRole="school"><TherapistDashboard /></ProtectedRoute>
      </Route>
      <Route path="/government">
        <ProtectedRoute requiredRole="government"><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="superadmin"><SuperAdminDashboard /></ProtectedRoute>
      </Route>

      {/* ── Platform pages ── */}
      <Route path="/family-care" component={FamilyCare} />
      <Route path="/clinical-system" component={ClinicalSystem} />
      <Route path="/therapy-system" component={TherapySystem} />
      <Route path="/school-integration" component={SchoolIntegration} />
      <Route path="/telehealth" component={Telehealth} />
      <Route path="/national-analytics" component={NationalAnalytics} />

      {/* ── Company pages ── */}
      <Route path="/about" component={About} />
      <Route path="/clinical-partners" component={ClinicalPartners} />
      <Route path="/for-government" component={ForGovernment} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />

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
          <FloatingChat />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
