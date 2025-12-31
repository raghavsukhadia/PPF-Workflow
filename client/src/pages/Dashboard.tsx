import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth, useJobsSummary, type ApiJobSummary } from "@/lib/api";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: currentUser } = useAuth();
  const { data: jobs = [], isLoading } = useJobsSummary();

  const { activeJobs, deliveredJobs, pendingDeliveryCount, activeCount, issuesCount } = useMemo(() => {
    const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'hold');
    const deliveredJobs = jobs.filter(j => j.status === 'delivered');
    const pendingDeliveryCount = activeJobs.filter(j => j.currentStage === 11).length;
    const activeCount = activeJobs.filter(j => j.currentStage < 11).length;
    const issuesCount = jobs.filter(j => j.activeIssue).length;
    return { activeJobs, deliveredJobs, pendingDeliveryCount, activeCount, issuesCount };
  }, [jobs]);
  
  const stats = [
    { label: 'Active Jobs', value: activeCount, icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Delivered (Mtd)', value: deliveredJobs.length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Delivery', value: pendingDeliveryCount, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Issues', value: issuesCount, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Welcome back, {currentUser?.name}</p>
        </div>
        <Link href="/create-job">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 w-full sm:w-auto min-h-[44px]" data-testid="button-create-job">
            <Plus className="w-4 h-4 mr-2" />
            New Job Card
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="bg-card border-border/50 shadow-sm hover:border-primary/20 transition-colors">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold font-display mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, '-')}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-semibold">Active Jobs</h3>
            <Link href="/kanban">
              <Button variant="link" className="text-primary p-0 h-auto" data-testid="link-kanban">View Board <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {activeJobs.map(job => (
              <JobListItem key={job.id} job={job} />
            ))}
            {activeJobs.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No active jobs currently.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-display font-semibold">Today's Schedule</h3>
          <Card className="bg-card/50 border-border/50 h-full min-h-[300px]">
            <CardContent className="p-6">
               <div className="space-y-6">
                  {activeJobs.slice(0, 5).map((job, index) => {
                    const isLast = index === Math.min(activeJobs.length - 1, 4);
                    
                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <div className="flex gap-4 cursor-pointer hover:opacity-80">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2",
                              job.currentStage === 11 ? "bg-green-500" : "bg-primary"
                            )}></div>
                            {!isLast && <div className="w-0.5 h-full bg-border mt-1"></div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{job.vehicleBrand} {job.vehicleModel}</p>
                            <p className="text-xs text-muted-foreground">
                              Stage {job.currentStage}/11
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {activeJobs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No scheduled jobs today.
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const STAGE_NAMES = [
  '', 'Vehicle Inward', 'Inspection', 'Washing', 'Surface Prep', 'Parts Opening',
  'Washing (2)', 'PPF Application', 'Parts Repacking', 'Cleaning', 'Final Inspection', 'Delivered'
];

function JobListItem({ job }: { job: ApiJobSummary }) {
  const currentStageName = STAGE_NAMES[job.currentStage] || 'Unknown';
  const progress = (job.currentStage / 11) * 100;

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className={cn(
        "group relative overflow-hidden bg-card hover:bg-card/80 border transition-all duration-300 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-md",
        "border-border/50 hover:border-primary/50"
      )}
      data-testid={`card-job-${job.id}`}
      >
        <div className="absolute top-0 left-0 w-1 h-full transition-opacity bg-gradient-to-b from-primary to-blue-600 opacity-0 group-hover:opacity-100" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center border border-border">
                <Car className="w-6 h-6 text-primary" />
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <h4 className="font-display font-bold text-lg">{job.vehicleBrand} {job.vehicleModel}</h4>
                   {job.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-5">URGENT</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{job.vehicleRegNo}</p>
             </div>
          </div>
          <div className="text-right">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-1">
                {currentStageName}
             </Badge>
             <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> Due {format(new Date(job.promisedDate), 'MMM d, h:mm a')}
             </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Progress (Stage {job.currentStage}/11)</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-secondary"
          />
        </div>
      </div>
    </Link>
  );
}
