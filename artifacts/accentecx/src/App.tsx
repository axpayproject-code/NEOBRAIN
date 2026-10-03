import PlatformDashboard from "@/pages/dashboards/PlatformDashboard";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Home from "@/pages/Home";
import PendingApproval from "@/pages/PendingApproval";
import Demo from "@/pages/Demo";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";

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

const queryClient = new QueryClient();

// Maps each role to its canonical dashboard path
const ROLE_HOME: Record<string, string> = {
  family:     "/family",
  clinic:     "/clinic",
  school:     "/school",
  government: "/government",
  superadmin: "/admin",
};

function roleHome(role: string): string {
  return ROLE_HOME[role] ?? `/${role}`;
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, loading } = useAuth();
  if(loading) return <div className="p-8 text-muted-foreground">Loading your workspace…</div>;
  if (!user) return <Redirect to="/login" />;
  // Org accounts awaiting admin activation cannot access dashboards

  if (requiredRole && user.role !== requiredRole) return <Redirect to={roleHome(user.role)} />;
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
        {user ? <Redirect to={roleHome(user.role)} /> : <Login />}
      </Route>
      {/* Safety redirect — old /superadmin path → /admin */}
      <Route path="/superadmin">
        <Redirect to="/admin" />
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding"><Redirect to={user ? roleHome(user.role) : "/login"} /></Route>
      <Route path="/pending-approval" component={PendingApproval} />

      {/* ── Role-based dashboards (4 business types) ── */}
      <Route path="/family">
        <ProtectedRoute><PlatformDashboard workspace="family" /></ProtectedRoute>
      </Route>
      <Route path="/clinic">
        <ProtectedRoute><PlatformDashboard workspace="clinical" /></ProtectedRoute>
      </Route>
      <Route path="/school">
        <ProtectedRoute><PlatformDashboard workspace="school" /></ProtectedRoute>
      </Route>
      <Route path="/government">
        <ProtectedRoute><PlatformDashboard workspace="program" /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><PlatformDashboard workspace="platform" /></ProtectedRoute>
      </Route>

      <Route path="/coordination"><ProtectedRoute><PlatformDashboard workspace="coordination" /></ProtectedRoute></Route>
      <Route path="/organization"><ProtectedRoute><PlatformDashboard workspace="organization" /></ProtectedRoute></Route>
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

      {/* Existing bookmarks now enter the case-scoped workspace. */}
      <Route path="/dashboard"><Redirect to={user ? roleHome(user.role) : "/login"} /></Route>
      <Route path="/children/:id"><Redirect to="/family" /></Route>
      <Route path="/screenings/:id"><Redirect to={user ? roleHome(user.role) : "/login"} /></Route>
      {["/children","/screenings","/appointments","/therapy","/reports","/games","/settings"].map(route=><Route key={route} path={route}><Redirect to={user ? roleHome(user.role) : "/login"} /></Route>)}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const invite=new URLSearchParams(window.location.search).get("invite");
  if(invite) sessionStorage.setItem("neobrain_invite",invite);
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
