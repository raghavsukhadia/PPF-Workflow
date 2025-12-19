import { useParams, useLocation } from "wouter";
import { JobStage } from "@/lib/store";
import { useJob, useUpdateJob, useUsers, ApiJob } from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar,
  ChevronRight,
  Camera,
  MessageSquare,
  StickyNote,
  AlertCircle,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export default function JobCard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: apiJob, isLoading: jobLoading } = useJob(id);
  const { data: users, isLoading: usersLoading } = useUsers();
  const updateJob = useUpdateJob();
  const { toast } = useToast();
  
  const [issueDescription, setIssueDescription] = useState("");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const job = useMemo(() => {
    if (!apiJob) return null;
    
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
  }, [apiJob]);

  if (jobLoading || usersLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground" data-testid="loading-state">
        Loading job details...
      </div>
    );
  }

  if (!job) {
    return <div className="p-8 text-center text-muted-foreground" data-testid="job-not-found">Job not found</div>;
  }

  const assignedUser = users?.find(u => u.id === job.assignedTo);

  const handleReportIssue = () => {
    if (issueDescription.trim()) {
      const currentStage = job.stages[job.currentStage - 1];
      const issue = {
        id: `issue-${Date.now()}`,
        stageId: job.currentStage,
        description: issueDescription,
        reportedBy: 'Current User',
        reportedAt: new Date().toISOString(),
        resolved: false
      };

      const updatedStages = job.stages.map((s: any) =>
        s.id === job.currentStage ? { ...s, status: 'issue' } : s
      );

      updateJob.mutate(
        {
          id: job.id,
          data: {
            activeIssue: JSON.stringify(issue),
            stages: JSON.stringify(updatedStages),
            status: 'hold'
          }
        },
        {
          onSuccess: () => {
            setIsIssueModalOpen(false);
            setIssueDescription("");
            toast({
              variant: "destructive",
              title: "Issue Reported",
              description: "The job has been flagged and put on hold."
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
    }
  };

  const handleResolveIssue = () => {
    const updatedStages = job.stages.map((s: any) =>
      s.id === job.activeIssue?.stageId ? { ...s, status: 'in-progress' } : s
    );

    updateJob.mutate(
      {
        id: job.id,
        data: {
          activeIssue: null,
          stages: JSON.stringify(updatedStages),
          status: 'active'
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Issue Resolved",
            description: "Job is back in progress."
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

  const moveJobStage = (direction: 'next' | 'prev') => {
    let newStageNo = job.currentStage;
    const updatedStages = [...job.stages];

    if (direction === 'next' && job.currentStage < 11) {
      updatedStages[job.currentStage - 1] = {
        ...updatedStages[job.currentStage - 1],
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      newStageNo++;
      
      updatedStages[newStageNo - 1] = {
        ...updatedStages[newStageNo - 1],
        status: 'in-progress',
        startedAt: new Date().toISOString()
      };
    } else if (direction === 'prev' && job.currentStage > 1) {
      updatedStages[job.currentStage - 1] = {
        ...updatedStages[job.currentStage - 1],
        status: 'pending'
      };
      newStageNo--;
      updatedStages[newStageNo - 1] = {
        ...updatedStages[newStageNo - 1],
        status: 'in-progress'
      };
    }

    updateJob.mutate(
      {
        id: job.id,
        data: {
          currentStage: newStageNo,
          stages: JSON.stringify(updatedStages)
        }
      },
      {
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

  const updateJobStage = (stageId: number, data: Partial<JobStage>) => {
    const updatedStages = job.stages.map((stage: any) =>
      stage.id === stageId ? { ...stage, ...data } : stage
    );

    updateJob.mutate(
      {
        id: job.id,
        data: {
          stages: JSON.stringify(updatedStages)
        }
      },
      {
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-display font-bold">{job.vehicle.brand} {job.vehicle.model}</h2>
              <Badge variant={job.activeIssue ? "destructive" : "outline"} className={cn("text-xs uppercase tracking-wider", job.activeIssue && "animate-pulse")}>
                {job.activeIssue ? "ISSUE REPORTED" : job.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{job.jobNo} • {job.package}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                 <HardHat className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Assigned Installer</p>
                 <p className="text-sm font-medium">{assignedUser ? assignedUser.name : "Unassigned"}</p>
              </div>
           </div>

           <div className="text-right hidden md:block">
              <p className="text-sm font-medium">Promised Delivery</p>
              <p className="text-xs text-muted-foreground">{format(new Date(job.promisedDate), 'PPP p')}</p>
           </div>
        </div>
      </div>

      {job.activeIssue && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-destructive">Active Issue Reported</h4>
            <p className="text-sm text-foreground/80 mt-1">{job.activeIssue.description}</p>
            <p className="text-xs text-muted-foreground mt-2">Reported by {job.activeIssue.reportedBy} at {format(new Date(job.activeIssue.reportedAt), 'h:mm a')}</p>
          </div>
          <Button variant="default" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleResolveIssue}>
            Resolve Issue
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8 h-full">
        {/* Left Column: Progress Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-card border-border/50 h-full max-h-[calc(100vh-200px)] flex flex-col">
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Progress value={(job.currentStage / 11) * 100} className="h-2" />
                <span className="w-12 text-right">{Math.round((job.currentStage / 11) * 100)}%</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
               <ScrollArea className="h-full px-6 pb-6">
                  <div className="space-y-6 relative">
                     {/* Vertical Line */}
                     <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/50 -z-10" />
                     
                     {job.stages.map((stage, index) => (
                        <div key={stage.id} className={cn("group flex gap-4 transition-opacity", stage.id > job.currentStage && "opacity-50")}>
                           <div className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-background transition-colors",
                              stage.status === 'completed' ? "border-green-500 text-green-500" :
                              stage.status === 'in-progress' ? "border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                              stage.status === 'issue' ? "border-red-500 text-red-500 bg-red-500/10" :
                              "border-muted-foreground text-muted-foreground"
                           )}>
                              {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                               stage.status === 'issue' ? <AlertTriangle className="w-4 h-4" /> :
                               <span className="text-xs font-bold">{stage.id}</span>}
                           </div>
                           <div className="pt-1 flex-1">
                              <h4 className={cn("font-medium text-sm leading-none mb-1", 
                                stage.id === job.currentStage && "text-primary",
                                stage.status === 'issue' && "text-destructive"
                              )}>
                                 {stage.name}
                              </h4>
                              {stage.status === 'completed' && stage.completedAt && (
                                 <p className="text-[10px] text-muted-foreground">Done: {format(new Date(stage.completedAt), 'MMM d, h:mm a')}</p>
                              )}
                              {stage.status === 'in-progress' && (
                                 <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20">In Progress</Badge>
                              )}
                              {stage.status === 'issue' && (
                                 <Badge variant="destructive" className="mt-1 text-[10px]">Issue Reported</Badge>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Stage Details */}
        <div className="lg:col-span-2 space-y-6">
           <StageDetailView 
              jobId={job.id} 
              stage={job.stages[job.currentStage - 1]} 
              teamMembers={users || []}
              onComplete={() => moveJobStage('next')}
              onUpdate={(data) => updateJobStage(job.currentStage, data)}
              onReportIssue={() => setIsIssueModalOpen(true)}
              isBlocked={!!job.activeIssue}
           />
        </div>
      </div>

      <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Describe the issue preventing this stage from being completed. This will flag the job and notify the team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="issue">Issue Description</Label>
              <Textarea 
                id="issue" 
                placeholder="e.g. Paint defect found on left door panel..." 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReportIssue}>Report Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StageDetailView({ 
  jobId, 
  stage, 
  onComplete, 
  onUpdate,
  teamMembers,
  onReportIssue,
  isBlocked
}: { 
  jobId: string; 
  stage: JobStage; 
  onComplete: () => void;
  onUpdate: (data: Partial<JobStage>) => void;
  teamMembers: any[];
  onReportIssue: () => void;
  isBlocked: boolean;
}) {
  const isAllChecked = stage.checklist.every(item => item.checked);

  const toggleCheck = (index: number) => {
    if (isBlocked) return;
    const newChecklist = [...stage.checklist];
    newChecklist[index].checked = !newChecklist[index].checked;
    onUpdate({ checklist: newChecklist });
  };

  return (
    <Card className={cn(
      "glass-card border-primary/20 shadow-lg shadow-primary/5 min-h-[500px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
      isBlocked && "border-destructive/30 shadow-destructive/5"
    )}>
      <CardHeader className="border-b border-border/50 bg-white/5 pb-4">
         <div className="flex items-center justify-between">
            <div>
               <p className={cn("text-sm font-medium mb-1", isBlocked ? "text-destructive" : "text-primary")}>
                 {isBlocked ? "STAGE BLOCKED" : "CURRENT STAGE"}
               </p>
               <CardTitle className="text-3xl">{stage.id}. {stage.name}</CardTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Stage Assigned to:</span>
                  <Select 
                    value={stage.assignedTo} 
                    onValueChange={(val) => onUpdate({ assignedTo: val })}
                    disabled={isBlocked}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs border-none bg-transparent focus:ring-0 px-0 justify-end font-medium text-foreground">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
               {stage.startedAt && (
                  <p className="text-xs text-muted-foreground">Started: {format(new Date(stage.startedAt), 'h:mm a')}</p>
               )}
            </div>
         </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative">
         {isBlocked && (
           <div className="absolute inset-0 bg-background/50 z-10 cursor-not-allowed" />
         )}
         <Tabs defaultValue="checklist" className="w-full h-full flex flex-col">
            <div className="px-6 py-2 border-b border-border/50">
               <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                  <TabsTrigger value="checklist">Checklist ({stage.checklist.filter(i => i.checked).length}/{stage.checklist.length})</TabsTrigger>
                  <TabsTrigger value="photos">Photos & Notes</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="checklist" className="flex-1 p-6 space-y-4">
               {stage.checklist.map((item, idx) => (
                  <div key={idx} 
                       className={cn(
                          "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                          item.checked 
                             ? "bg-green-500/5 border-green-500/20" 
                             : "bg-secondary/50 border-transparent hover:bg-secondary hover:border-border"
                       )}
                       onClick={() => toggleCheck(idx)}
                  >
                     <Checkbox checked={item.checked} className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                     <label className={cn("text-sm font-medium leading-none cursor-pointer flex-1", item.checked && "text-muted-foreground line-through")}>
                        {item.item}
                     </label>
                  </div>
               ))}
            </TabsContent>
            
            <TabsContent value="photos" className="flex-1 p-6 space-y-6">
               <div>
                  <Label className="mb-2 block flex items-center gap-2"><Camera className="w-4 h-4" /> Stage Photos</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {stage.photos.map((photo, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-secondary border border-border"></div>
                     ))}
                     <button className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-medium">Add Photo</span>
                     </button>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes & Observations</Label>
                  <Textarea 
                     placeholder="Add detailed notes about this stage..." 
                     className="bg-secondary/50 border-border min-h-[100px]"
                     value={stage.notes || ''}
                     onChange={(e) => onUpdate({ notes: e.target.value })}
                  />
               </div>
            </TabsContent>
         </Tabs>
      </CardContent>

      <div className="p-6 border-t border-border/50 bg-white/5 flex items-center justify-between gap-4">
         <Button 
           variant="outline" 
           className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
           onClick={onReportIssue}
           disabled={isBlocked}
         >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Issue
         </Button>
         <Button 
            onClick={onComplete}
            disabled={!isAllChecked || isBlocked}
            className={cn(
               "w-full md:w-auto min-w-[200px] shadow-lg transition-all",
               (isAllChecked && !isBlocked) ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20" : "opacity-50 cursor-not-allowed"
            )}
         >
            {stage.id === 11 ? 'Complete Job' : 'Complete Stage'}
            <ChevronRight className="w-4 h-4 ml-2" />
         </Button>
      </div>
    </Card>
  );
}
