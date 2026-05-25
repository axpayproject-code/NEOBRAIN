import { useListTherapyPlans, getListTherapyPlansQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Activity, Calendar, User, CheckSquare } from "lucide-react";

export default function TherapyPlansList() {
  const { data: plans, isLoading } = useListTherapyPlans({}, { query: { queryKey: getListTherapyPlansQueryKey({}) } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Therapy Plans</h1>
          <p className="text-muted-foreground mt-1">Active and completed developmental interventions.</p>
        </div>
        <Button className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div>Loading...</div>
        ) : plans?.length ? (
          plans.map(plan => (
            <Card key={plan.id} className="border-border/50 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl">{plan.title}</h3>
                    <Badge variant={
                      plan.status === 'active' ? 'default' : 
                      plan.status === 'completed' ? 'secondary' : 'outline'
                    } className="capitalize">
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
                      <Activity className="h-3 w-3 mr-1" /> {plan.therapyType} Therapy
                    </Badge>
                    <span className="text-sm text-muted-foreground font-medium">• {plan.childName || `Child #${plan.childId}`}</span>
                  </div>

                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <CheckSquare className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <span className="font-medium text-foreground block mb-1">Goals</span>
                        {plan.goals || 'No specific goals recorded'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:w-[300px] flex flex-col justify-between bg-muted/20">
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Therapist</span>
                      <span className="font-medium">{plan.therapistName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Start Date</span>
                      <span className="font-medium">{new Date(plan.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Overall Progress</span>
                      <span className="font-bold">{plan.progressPercentage || 0}%</span>
                    </div>
                    <Progress value={plan.progressPercentage || 0} className="h-2" />
                  </div>
                  
                  <Button variant="outline" className="w-full mt-6">View Details</Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">No therapy plans found.</div>
        )}
      </div>
    </div>
  );
}
