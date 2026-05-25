import { useListAppointments, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Video, MapPin, Plus, Clock, User } from "lucide-react";

export default function AppointmentsList() {
  const { data: appointments, isLoading } = useListAppointments({}, { query: { queryKey: getListAppointmentsQueryKey({}) } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled sessions and clinical visits.</p>
        </div>
        <Button className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Schedule Visit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div>Loading...</div>
        ) : appointments?.length ? (
          appointments.map(apt => (
            <Card key={apt.id} className="border-border/50 flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant={
                    apt.status === 'completed' ? 'secondary' : 
                    apt.status === 'scheduled' ? 'default' : 
                    apt.status === 'cancelled' ? 'destructive' : 'outline'
                  } className="capitalize">
                    {apt.status}
                  </Badge>
                  {apt.telehealth && (
                    <Badge variant="outline" className="border-primary text-primary bg-primary/5 gap-1">
                      <Video className="h-3 w-3" /> Telehealth
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-bold text-lg">{apt.childName || `Child #${apt.childId}`}</h3>
                
                <div className="space-y-3 mt-4 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{apt.specialistName} <span className="text-xs opacity-70">({apt.specialistType.replace('_', ' ')})</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(apt.scheduledAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{apt.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{apt.telehealth ? (apt.meetingUrl || 'Link pending') : 'In-person clinic'}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex gap-2">
                  <Button variant="outline" className="w-full text-xs h-8">Reschedule</Button>
                  {apt.telehealth && apt.status === 'scheduled' && (
                    <Button className="w-full text-xs h-8">Join Call</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg bg-card">No appointments scheduled.</div>
        )}
      </div>
    </div>
  );
}
