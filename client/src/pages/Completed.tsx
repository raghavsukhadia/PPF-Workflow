import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, CheckCircle2, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { useJobs } from "@/lib/api";
import { useMemo } from "react";

export default function Completed() {
  const { data: apiJobs = [], isLoading } = useJobs();

  const deliveredJobs = useMemo(() => {
    return apiJobs
      .filter(job => job.status === 'delivered')
      .map(job => ({
        ...job,
        vehicle: {
          brand: job.vehicleBrand,
          model: job.vehicleModel,
          year: job.vehicleYear,
          color: job.vehicleColor,
          regNo: job.vehicleRegNo,
        }
      }));
  }, [apiJobs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            Completed Jobs
          </h2>
          <p className="text-muted-foreground">All delivered vehicles</p>
        </div>
        <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30 text-lg px-4 py-2">
          {deliveredJobs.length} Delivered
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveredJobs.map(job => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="cursor-pointer transition-all group bg-card border-green-500/20 hover:border-green-500/40 hover:shadow-lg" data-testid={`card-completed-job-${job.id}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Car className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg">{job.vehicle.brand} {job.vehicle.model}</h4>
                      <p className="text-sm text-muted-foreground">{job.vehicle.year} • {job.vehicle.color}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  <Car className="w-4 h-4" />
                  <span>{job.vehicle.regNo}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3 h-3" />
                    <span className="truncate">{job.package}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(job.promisedDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center bg-green-500/10 text-green-500 border-green-500/20">
                  DELIVERED
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {deliveredJobs.length === 0 && (
        <div className="text-center py-16 border border-dashed border-green-500/20 rounded-xl bg-green-500/5">
          <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No completed jobs yet</p>
          <p className="text-sm text-muted-foreground mt-1">Delivered vehicles will appear here</p>
        </div>
      )}
    </div>
  );
}
