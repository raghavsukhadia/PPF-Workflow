import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
    const getLastStage = (j: typeof jobs[number]) => j.processType === 'ceramic' ? 10 : 11;
    const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'hold');
    const deliveredJobs = jobs.filter(j => j.status === 'delivered');
    const pendingDeliveryCount = activeJobs.filter(j => j.currentStage === getLastStage(j)).length;
    const activeCount = activeJobs.filter(j => j.currentStage < getLastStage(j)).length;
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-11 w-full sm:w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-6 w-40" />
            <Card className="bg-card/50 border-border/50 min-h-[300px]">
              <CardContent className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
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
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold font-display mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, '-')}`}>{stat.value}</p>
              </div>
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
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
                              job.currentStage === (job.processType === 'ceramic' ? 10 : 11) ? "bg-green-500" : "bg-primary"
                            )}></div>
                            {!isLast && <div className="w-0.5 h-full bg-border mt-1"></div>}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{job.vehicleBrand} {job.vehicleModel}</p>
                            <p className="text-xs text-muted-foreground">
                              Stage {job.currentStage}/{job.processType === 'ceramic' ? 10 : 11}
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

const PPF_STAGE_NAMES: Record<number, string> = {
  1: 'Vehicle Inward', 2: 'Inspection', 3: 'Washing (1)', 4: 'Surface Prep',
  5: 'Parts Opening', 6: 'Washing (2)', 7: 'PPF Application', 8: 'Parts Repacking',
  9: 'Cleaning', 10: 'Final Inspection', 11: 'Delivered'
};

const CERAMIC_STAGE_NAMES: Record<number, string> = {
  1: 'Vehicle Inward', 2: 'Inspection', 3: 'Washing (1)', 4: 'Surface Prep',
  5: 'Selecting Ceramic', 6: 'Dusting + IP', 7: 'Applying Ceramic',
  8: 'Cleaning', 9: 'Final Inspection', 10: 'Delivered'
};

function JobListItem({ job }: { job: ApiJobSummary }) {
  const isCeramic = job.processType === 'ceramic';
  const stageNames = isCeramic ? CERAMIC_STAGE_NAMES : PPF_STAGE_NAMES;
  const totalStages = isCeramic ? 10 : 11;
  const currentStageName = stageNames[job.currentStage] || 'Unknown';
  const progress = (job.currentStage / totalStages) * 100;

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
             <div className="flex items-center gap-1.5 justify-end mb-1">
               <Badge variant="outline" className={cn(
                 "text-[10px]",
                 isCeramic ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
               )}>
                 {isCeramic ? 'Ceramic' : 'PPF'}
               </Badge>
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                 {currentStageName}
               </Badge>
             </div>
             <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> Due {format(new Date(job.promisedDate), 'MMM d, h:mm a')}
             </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Progress (Stage {job.currentStage}/{totalStages})</span>
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
