import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

export default function NotFound() {
  const [location] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.replace("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0038A8]/5 to-[#FCD116]/5">
      <div className="text-center px-6 max-w-md">
        <div className="text-7xl font-black text-[#0038A8]/10 leading-none mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-1">
          The path <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{location}</code> doesn't exist.
        </p>
        <p className="text-gray-400 text-xs mb-8">Redirecting to home in 5 seconds…</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2 rounded-full w-full sm:w-auto">
              <Home className="h-4 w-4" /> Go to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="gap-2 rounded-full w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" /> Sign In
            </Button>
          </Link>
          <Button variant="ghost" className="gap-2 rounded-full" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
