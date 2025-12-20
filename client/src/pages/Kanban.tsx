import { useJobs, useUpdateJob, ApiJob } from "@/lib/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Car, Clock, MoreHorizontal, AlertCircle, CheckCircle2, Truck } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

// Group stages into simplified columns for the Kanban
const COLUMNS = [
  { id: 'inward', title: 'Inward & Inspection', stages: [1, 2] },
  { id: 'prep', title: 'Prep & Washing', stages: [3, 4, 5, 6] },
  { id: 'production', title: 'Application (PPF)', stages: [7] },
  { id: 'finishing', title: 'Finishing & QC', stages: [8, 9, 10] },
  { id: 'ready', title: 'Ready for Delivery', stages: [11] },
];

export default function Kanban() {
  const { data: apiJobs, isLoading } = useJobs();
  const updateJob = useUpdateJob();
  const { toast } = useToast();

  const handleMarkDelivered = (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedStages = [...job.stages];
    updatedStages[10] = {
      ...updatedStages[10],
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    
    updateJob.mutate(
      {
        id: job.id,
        data: {
          status: 'delivered',
          stages: JSON.stringify(updatedStages)
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Job Delivered",
            description: `${job.vehicle.brand} ${job.vehicle.model} has been marked as delivered.`
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message
          });
        }
      }
    );
  };

  const jobs = useMemo(() => {
    if (!apiJobs) return [];
    
    return apiJobs.map(apiJob => {
      const stages = typeof apiJob.stages === 'string' 
        ? JSON.parse(apiJob.stages) 
        : apiJob.stages;
      
      const activeIssue = typeof apiJob.activeIssue === 'string'
        ? (apiJob.activeIssue ? JSON.parse(apiJob.activeIssue) : null)
        : apiJob.activeIssue;

      return {
        ...apiJob,
        stages,
        activeIssue,
        vehicle: {
          brand: apiJob.vehicleBrand,
          model: apiJob.vehicleModel,
          year: apiJob.vehicleYear,
          color: apiJob.vehicleColor,
          regNo: apiJob.vehicleRegNo,
          vin: apiJob.vehicleVin || '',
        }
      };
    });
  }, [apiJobs]);

  const getJobsForColumn = (stageIds: number[]) => {
    return jobs.filter(job => stageIds.includes(job.currentStage) && job.status !== 'delivered');
  };

  const deliveredJobs = jobs.filter(job => job.status === 'delivered');

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground" data-testid="loading-state">
        Loading kanban board...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold">Kanban Board</h2>
        <p className="text-muted-foreground">Shop Floor Overview</p>
      </div>
      
      <ScrollArea className="flex-1 w-full pb-4">
        <div className="flex gap-4 min-w-full pb-4 h-[calc(100vh-220px)]">
          {COLUMNS.map(col => {
             const colJobs = getJobsForColumn(col.stages);
             return (
               <div key={col.id} className="w-80 shrink-0 flex flex-col bg-secondary/30 rounded-xl border border-border/50 overflow-hidden h-full">
                 <div className="p-4 border-b border-border/50 bg-secondary/50 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                   <h3 className="font-semibold text-sm uppercase tracking-wide">{col.title}</h3>
                   <Badge variant="secondary" className="bg-background text-xs">{colJobs.length}</Badge>
                 </div>
                 <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0">
                   {colJobs.map(job => (
                     <Link key={job.id} href={`/jobs/${job.id}`}>
                       <Card className={cn(
                         "cursor-pointer transition-all group bg-card",
                         job.activeIssue 
                           ? "border-destructive/50 shadow-sm shadow-destructive/10" 
                           : "hover:border-primary/50 hover:shadow-md"
                       )}>
                         <CardContent className="p-4 space-y-3">
                           <div className="flex justify-between items-start">
                             <div className="font-display font-bold text-lg leading-tight">{job.vehicle.brand}<br/><span className="text-base font-normal text-muted-foreground">{job.vehicle.model}</span></div>
                             {job.priority === 'high' && !job.activeIssue && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Priority" />}
                             {job.activeIssue && <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />}
                           </div>
                           
                           <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md">
                             <Car className="w-3 h-3" />
                             <span className="truncate">{job.vehicle.regNo}</span>
                           </div>

                           <div className="flex justify-between items-end pt-2 border-t border-border/50">
                             <Badge 
                               variant="outline" 
                               className={cn("text-[10px] h-5", job.activeIssue ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/5 text-primary border-primary/20")}
                             >
                               {job.activeIssue ? "ISSUE" : `Stage ${job.currentStage}`}
                             </Badge>
                             <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               2d left
                             </div>
                           </div>
                           
                           {col.id === 'ready' && (
                             <Button 
                               size="sm" 
                               className="w-full bg-green-600 hover:bg-green-700 text-white"
                               onClick={(e) => handleMarkDelivered(job, e)}
                               data-testid={`button-deliver-${job.id}`}
                             >
                               <Truck className="w-4 h-4 mr-2" />
                               Mark as Delivered
                             </Button>
                           )}
                         </CardContent>
                       </Card>
                     </Link>
                   ))}
                   {colJobs.length === 0 && (
                      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border/30 rounded-lg">
                         Empty
                      </div>
                   )}
                 </div>
               </div>
             )
          })}

          {/* Delivered Section */}
          <div className="w-80 shrink-0 flex flex-col bg-green-500/5 rounded-xl border border-green-500/20 overflow-hidden h-full">
            <div className="p-4 border-b border-green-500/20 bg-green-500/10 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-green-500">Delivered</h3>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">{deliveredJobs.length}</Badge>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0">
              {deliveredJobs.map(job => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="cursor-pointer transition-all group bg-card border-green-500/20 hover:border-green-500/40 hover:shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="font-display font-bold text-lg leading-tight">{job.vehicle.brand}<br/><span className="text-base font-normal text-muted-foreground">{job.vehicle.model}</span></div>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-md">
                        <Car className="w-3 h-3" />
                        <span className="truncate">{job.vehicle.regNo}</span>
                      </div>

                      <div className="flex justify-between items-end pt-2 border-t border-border/50">
                        <Badge variant="outline" className="text-[10px] h-5 bg-green-500/10 text-green-500 border-green-500/20">
                          DELIVERED
                        </Badge>
                        <div className="text-[10px] text-muted-foreground">
                          {job.package}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {deliveredJobs.length === 0 && (
                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-green-500/20 rounded-lg">
                  No deliveries yet
                </div>
              )}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
