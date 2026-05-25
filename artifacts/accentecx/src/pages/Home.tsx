import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartPulse, Activity, ShieldCheck, Database, Users, GraduationCap, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-50 flex h-20 items-center px-6 md:px-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <HeartPulse className="h-8 w-8 text-secondary" />
          <span className="tracking-tight">ACCENTECX AI CARE</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:flex rounded-full px-6">Log in</Button>
          </Link>
          <Link href="/login">
            <Button className="rounded-full px-6 gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32 md:px-12 max-w-7xl mx-auto grid gap-12 lg:grid-cols-2 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold text-primary w-fit bg-primary/5 border-primary/10">
              <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
              The Philippines' Premier AI Health Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter text-foreground">
              Intelligent care for every developmental journey.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Empowering parents, doctors, therapists, and educators with connected, AI-driven insights to unlock every child's potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8 h-14 text-base w-full sm:w-auto gap-2">
                  Join the Ecosystem <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base w-full sm:w-auto">
                Request Clinic Demo
              </Button>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] rounded-3xl overflow-hidden bg-primary/5 border border-primary/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent mix-blend-overlay"></div>
            {/* Abstract visual representation */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="w-full h-full relative">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-secondary/20 blur-xl animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary/20 blur-2xl animate-pulse delay-700"></div>
                <div className="absolute inset-0 border-[1px] border-primary/10 rounded-2xl p-6 backdrop-blur-sm bg-background/40 shadow-2xl flex flex-col gap-4">
                   <div className="h-8 w-1/3 bg-muted rounded-md"></div>
                   <div className="h-4 w-1/2 bg-muted rounded-md"></div>
                   <div className="flex-1 rounded-xl border border-border bg-card shadow-sm p-4 mt-4">
                     <div className="flex items-center gap-4 mb-4">
                       <div className="h-12 w-12 rounded-full bg-secondary/30"></div>
                       <div>
                         <div className="h-4 w-24 bg-muted rounded-md mb-2"></div>
                         <div className="h-3 w-16 bg-muted/60 rounded-md"></div>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <div className="h-2 w-full bg-muted rounded-full"></div>
                       <div className="h-2 w-4/5 bg-muted rounded-full"></div>
                       <div className="h-2 w-5/6 bg-muted rounded-full"></div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Roles Section */}
        <section className="bg-primary text-primary-foreground py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-background">A Unified Ecosystem</h2>
              <p className="text-lg text-background/80">Connecting every stakeholder in a child's developmental journey through a secure, intelligent platform.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Families", icon: Users, desc: "Track milestones, access home exercises, and stay connected with your care team." },
                { title: "Clinicians", icon: Activity, desc: "AI-assisted diagnostics, unified patient records, and streamlined reporting." },
                { title: "Therapists", icon: HeartPulse, desc: "Create interactive therapy plans, track progress, and coordinate with schools." },
                { title: "Schools", icon: GraduationCap, desc: "Integrate individualized education programs with clinical recommendations." }
              ].map((role, i) => (
                <div key={i} className="bg-background/5 border border-background/10 rounded-2xl p-8 backdrop-blur-sm">
                  <role.icon className="h-12 w-12 text-secondary mb-6" />
                  <h3 className="text-xl font-bold mb-3 text-background">{role.title}</h3>
                  <p className="text-background/70 leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold">
            <HeartPulse className="h-6 w-6 text-secondary" />
            <span>ACCENTECX AI CARE</span>
          </div>
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} ACCENTECX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
