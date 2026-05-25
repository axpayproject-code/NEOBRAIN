import { useState } from "react";
import { Link } from "wouter";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User } from "lucide-react";

export default function ChildrenList() {
  const { data: children, isLoading } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChildren = children?.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Children</h1>
          <p className="text-muted-foreground mt-1">Manage patient profiles and track their progress.</p>
        </div>
        <Button className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Add Child
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 max-w-md">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 bg-transparent h-auto" 
          placeholder="Search children..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredChildren?.length ? (
          filteredChildren.map(child => (
            <Link key={child.id} href={`/children/${child.id}`}>
              <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{child.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} years old</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <RiskBadge level={child.riskLevel} />
                    <span className="text-xs text-muted-foreground">{child.gender}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No children found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const getColors = () => {
    switch(level) {
      case 'low': return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400";
      case 'moderate': return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 'high': return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case 'critical': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge variant="outline" className={`capitalize ${getColors()}`}>
      {level} Risk
    </Badge>
  );
}
