import { useParams, useLocation } from "wouter";
import { JobStage } from "@/lib/store";
import { useJob, useUpdateJob, useUsers, useJobIssues, useCreateJobIssue, useUpdateJobIssue, ApiJobIssue, useAuth } from "@/lib/api";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  ChevronRight,
  Camera,
  StickyNote,
  AlertCircle,
  HardHat,
  Image,
  Video,
  Mic,
  X,
  Plus,
  MapPin,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Folder, CameraIcon, VideoIcon, MicIcon } from "lucide-react";

const STAGE_NAMES: Record<number, string> = {
  1: "Vehicle Inward",
  2: "Inspection",
  3: "Washing",
  4: "Surface Preparation",
  5: "Parts Opening",
  6: "Washing (2)",
  7: "PPF Application",
  8: "Parts Repacking",
  9: "Cleaning & Finishing",
  10: "Final Inspection",
  11: "Delivered"
};

const ISSUE_TYPES = [
  { value: "scratch", label: "Scratch" },
  { value: "dent", label: "Dent" },
  { value: "paint_defect", label: "Paint Defect" },
  { value: "surface_damage", label: "Surface Damage" },
  { value: "contamination", label: "Contamination" },
  { value: "other", label: "Other" }
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" }
];

export default function JobCard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: apiJob, isLoading: jobLoading } = useJob(id);
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: authUser } = useAuth();
  const { data: issues, isLoading: issuesLoading } = useJobIssues(id);
  const updateJob = useUpdateJob();
  const createIssue = useCreateJobIssue();
  const updateIssue = useUpdateJobIssue();
  const { toast } = useToast();
  
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueType, setIssueType] = useState("scratch");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueLocation, setIssueLocation] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("medium");
  const [issueMediaUrls, setIssueMediaUrls] = useState<string[]>([]);
  const [issueMediaFiles, setIssueMediaFiles] = useState<{ name: string; type: string; dataUrl: string }[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ApiJobIssue | null>(null);
  
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoCameraInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const audioRecordInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mediaType: string) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setIssueMediaFiles(prev => [...prev, { 
          name: file.name, 
          type: mediaType,
          dataUrl 
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const job = useMemo(() => {
    if (!apiJob) return null;
    
    const stages = typeof apiJob.stages === 'string' 
      ? JSON.parse(apiJob.stages) 
      : apiJob.stages;

    return {
      ...apiJob,
      stages,
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

  const openIssues = useMemo(() => 
    issues?.filter(i => i.status === 'open') || [], 
    [issues]
  );

  const resolvedIssues = useMemo(() => 
    issues?.filter(i => i.status === 'resolved') || [], 
    [issues]
  );

  const currentStageOpenIssues = useMemo(() =>
    openIssues.filter(i => i.stageId === (job?.currentStage || 0)),
    [openIssues, job?.currentStage]
  );

  const hasCriticalIssues = useMemo(() =>
    currentStageOpenIssues.some(i => i.severity === 'critical'),
    [currentStageOpenIssues]
  );

  if (jobLoading || usersLoading || issuesLoading) {
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

  const handleCreateIssue = () => {
    if (!issueDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Description",
        description: "Please describe the issue."
      });
      return;
    }

    const allMediaUrls = [
      ...issueMediaUrls,
      ...issueMediaFiles.map(f => f.dataUrl)
    ];

    createIssue.mutate(
      {
        jobId: job.id,
        data: {
          stageId: job.currentStage,
          issueType,
          description: issueDescription.trim(),
          location: issueLocation.trim() || undefined,
          severity: issueSeverity,
          mediaUrls: allMediaUrls.length > 0 ? allMediaUrls : undefined
        }
      },
      {
        onSuccess: () => {
          setIsIssueModalOpen(false);
          resetIssueForm();
          toast({
            title: "Issue Reported",
            description: "The issue has been logged and will be visible throughout the job."
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

  const handleResolveIssue = (issue: ApiJobIssue) => {
    updateIssue.mutate(
      {
        id: issue.id,
        jobId: job.id,
        data: {
          status: 'resolved',
          resolvedAt: new Date().toISOString()
        }
      },
      {
        onSuccess: () => {
          setSelectedIssue(null);
          toast({
            title: "Issue Resolved",
            description: "The issue has been marked as resolved."
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

  const resetIssueForm = () => {
    setIssueType("scratch");
    setIssueDescription("");
    setIssueLocation("");
    setIssueSeverity("medium");
    setIssueMediaUrls([]);
    setIssueMediaFiles([]);
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
          stages: JSON.stringify(updatedStages),
          status: newStageNo === 11 ? 'completed' : 'active'
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

  const getSeverityColor = (severity: string) => {
    return SEVERITY_LEVELS.find(s => s.value === severity)?.color || "bg-gray-500";
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-display font-bold">{job.vehicle.brand} {job.vehicle.model}</h2>
              {openIssues.length > 0 && (
                <Badge variant="destructive" className="text-xs uppercase tracking-wider animate-pulse">
                  {openIssues.length} ISSUE{openIssues.length > 1 ? 'S' : ''} OPEN
                </Badge>
              )}
              <Badge variant="outline" className="text-xs uppercase tracking-wider">
                {job.status}
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

      {openIssues.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-lg text-destructive">Open Issues ({openIssues.length})</CardTitle>
              </div>
              <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setIsIssueModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Issue
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-2">
              {openIssues.map((issue) => (
                <div 
                  key={issue.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50 cursor-pointer hover:border-primary/30"
                  onClick={() => setSelectedIssue(issue)}
                  data-testid={`issue-${issue.id}`}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", getSeverityColor(issue.severity))} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{issue.issueType.replace('_', ' ')}</Badge>
                      <Badge variant="secondary" className="text-xs">Stage {issue.stageId}: {STAGE_NAMES[issue.stageId]}</Badge>
                    </div>
                    <p className="text-sm line-clamp-1">{issue.description}</p>
                    {issue.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {issue.location}
                      </p>
                    )}
                  </div>
                  {issue.mediaUrls && issue.mediaUrls.length > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Image className="w-4 h-4" />
                      <span className="text-xs">{issue.mediaUrls.length}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8 h-full">
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
                     <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border/50 -z-10" />
                     
                     {job.stages.map((stage: any, index: number) => {
                        const stageIssues = issues?.filter(i => i.stageId === stage.id && i.status === 'open') || [];
                        const hasStageCriticalIssues = stageIssues.some(i => i.severity === 'critical');
                        return (
                          <div key={stage.id} className={cn("group flex gap-4 transition-opacity", stage.id > job.currentStage && "opacity-50")}>
                             <div className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-background transition-colors relative",
                                stage.status === 'completed' ? "border-green-500 text-green-500" :
                                hasStageCriticalIssues ? "border-red-500 text-red-500 bg-red-500/10" :
                                stage.status === 'in-progress' ? "border-primary text-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                                stageIssues.length > 0 ? "border-amber-500 text-amber-500" :
                                "border-muted-foreground text-muted-foreground"
                             )}>
                                {stage.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                                 hasStageCriticalIssues ? <AlertTriangle className="w-4 h-4" /> :
                                 <span className="text-xs font-bold">{stage.id}</span>}
                                {stageIssues.length > 0 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                                    {stageIssues.length}
                                  </span>
                                )}
                             </div>
                             <div className="pt-1 flex-1">
                                <h4 className={cn("font-medium text-sm leading-none mb-1", 
                                  stage.id === job.currentStage && "text-primary",
                                  hasStageCriticalIssues && "text-destructive"
                                )}>
                                   {stage.name}
                                </h4>
                                {stage.status === 'completed' && stage.completedAt && (
                                   <p className="text-[10px] text-muted-foreground">Done: {format(new Date(stage.completedAt), 'MMM d, h:mm a')}</p>
                                )}
                                {stage.status === 'in-progress' && !hasStageCriticalIssues && (
                                   <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20">In Progress</Badge>
                                )}
                                {hasStageCriticalIssues && (
                                   <Badge variant="destructive" className="mt-1 text-[10px]">{stageIssues.length} Critical Issue{stageIssues.length > 1 ? 's' : ''}</Badge>
                                )}
                                {stageIssues.length > 0 && !hasStageCriticalIssues && (
                                   <Badge variant="outline" className="mt-1 text-[10px] border-amber-500/50 text-amber-500">{stageIssues.length} Issue{stageIssues.length > 1 ? 's' : ''}</Badge>
                                )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </ScrollArea>
            </CardContent>
          </Card>

          {resolvedIssues.length > 0 && (
            <Card className="glass-card border-green-500/20">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <CardTitle className="text-sm text-green-500">Resolved Issues ({resolvedIssues.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {resolvedIssues.map((issue) => (
                      <div 
                        key={issue.id} 
                        className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10 text-sm cursor-pointer hover:bg-green-500/10"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground line-through">{issue.description}</p>
                          <p className="text-[10px] text-green-500">Resolved by {issue.resolvedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
           <StageDetailView 
              jobId={job.id} 
              stage={job.stages[job.currentStage - 1]} 
              teamMembers={users || []}
              onComplete={() => moveJobStage('next')}
              onUpdate={(data) => updateJobStage(job.currentStage, data)}
              onReportIssue={() => setIsIssueModalOpen(true)}
              isBlocked={hasCriticalIssues}
              currentStageIssueCount={currentStageOpenIssues.length}
           />
        </div>
      </div>

      <Dialog open={isIssueModalOpen} onOpenChange={(open) => { setIsIssueModalOpen(open); if (!open) resetIssueForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report an Issue
            </DialogTitle>
            <DialogDescription>
              Document any issues found during Stage {job.currentStage}: {STAGE_NAMES[job.currentStage]}. Issues will be visible throughout the job.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Type</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger data-testid="select-issue-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={issueSeverity} onValueChange={setIssueSeverity}>
                  <SelectTrigger data-testid="select-issue-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", s.color)} />
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location on Vehicle</Label>
              <Input 
                placeholder="e.g., Left front fender, Hood center, Rear bumper..." 
                value={issueLocation}
                onChange={(e) => setIssueLocation(e.target.value)}
                data-testid="input-issue-location"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe the issue in detail..." 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-issue-description"
              />
            </div>

            <div className="space-y-3">
              <Label>Attach Media</Label>
              
              <input type="file" ref={photoFileInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'photo')} multiple />
              <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'photo')} />
              <input type="file" ref={videoFileInputRef} accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} multiple />
              <input type="file" ref={videoCameraInputRef} accept="video/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
              <input type="file" ref={audioFileInputRef} accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e, 'audio')} multiple />
              <input type="file" ref={audioRecordInputRef} accept="audio/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, 'audio')} />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <CameraIcon className="w-4 h-4" />
                  <span>Photos</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => cameraInputRef.current?.click()} data-testid="button-camera-photo">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => photoFileInputRef.current?.click()} data-testid="button-file-photo">
                    <Folder className="w-4 h-4 mr-2" />
                    Files
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <VideoIcon className="w-4 h-4" />
                  <span>Video</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => videoCameraInputRef.current?.click()} data-testid="button-camera-video">
                    <Video className="w-4 h-4 mr-2" />
                    Record
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => videoFileInputRef.current?.click()} data-testid="button-file-video">
                    <Folder className="w-4 h-4 mr-2" />
                    Files
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MicIcon className="w-4 h-4" />
                  <span>Audio</span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => audioRecordInputRef.current?.click()} data-testid="button-record-audio">
                    <Mic className="w-4 h-4 mr-2" />
                    Record
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => audioFileInputRef.current?.click()} data-testid="button-file-audio">
                    <Folder className="w-4 h-4 mr-2" />
                    Files
                  </Button>
                </div>
              </div>
              
              {issueMediaFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Attached Files ({issueMediaFiles.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {issueMediaFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2 text-xs">
                        {file.type === 'photo' && <Image className="w-4 h-4 text-blue-500" />}
                        {file.type === 'video' && <Video className="w-4 h-4 text-purple-500" />}
                        {file.type === 'audio' && <Mic className="w-4 h-4 text-green-500" />}
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button 
                          type="button"
                          onClick={() => setIssueMediaFiles(issueMediaFiles.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCreateIssue} data-testid="button-submit-issue">Report Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedIssue && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getSeverityColor(selectedIssue.severity))} />
                  <DialogTitle className="capitalize">{selectedIssue.issueType.replace('_', ' ')} Issue</DialogTitle>
                </div>
                <DialogDescription>
                  Stage {selectedIssue.stageId}: {STAGE_NAMES[selectedIssue.stageId]}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm mt-1">{selectedIssue.description}</p>
                </div>
                {selectedIssue.location && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Location</Label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {selectedIssue.location}
                    </p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Severity</Label>
                    <Badge variant="secondary" className="mt-1 capitalize">{selectedIssue.severity}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <Badge variant={selectedIssue.status === 'resolved' ? 'default' : 'destructive'} className="mt-1 capitalize">
                      {selectedIssue.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Reported By</Label>
                  <p className="text-sm mt-1">{selectedIssue.reportedBy} on {format(new Date(selectedIssue.createdAt), 'PPP p')}</p>
                </div>
                {selectedIssue.resolvedBy && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Resolved By</Label>
                    <p className="text-sm mt-1">{selectedIssue.resolvedBy} on {selectedIssue.resolvedAt ? format(new Date(selectedIssue.resolvedAt), 'PPP p') : '-'}</p>
                  </div>
                )}
                {selectedIssue.mediaUrls && selectedIssue.mediaUrls.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Attached Media</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedIssue.mediaUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-[200px]">
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setSelectedIssue(null)}>Close</Button>
                {selectedIssue.status === 'open' && (
                  <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleResolveIssue(selectedIssue)} data-testid="button-resolve-issue">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
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
  isBlocked,
  currentStageIssueCount = 0
}: { 
  jobId: string; 
  stage: JobStage; 
  onComplete: () => void;
  onUpdate: (data: Partial<JobStage>) => void;
  teamMembers: any[];
  onReportIssue: () => void;
  isBlocked: boolean;
  currentStageIssueCount?: number;
}) {
  const isAllChecked = stage.checklist.every(item => item.checked);
  const stagePhotoInputRef = useRef<HTMLInputElement>(null);
  const stageCameraInputRef = useRef<HTMLInputElement>(null);

  const toggleCheck = (index: number) => {
    if (isBlocked) return;
    const newChecklist = [...stage.checklist];
    newChecklist[index].checked = !newChecklist[index].checked;
    onUpdate({ checklist: newChecklist });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const currentPhotos = stage.photos || [];
        onUpdate({ photos: [...currentPhotos, dataUrl] });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = stage.photos.filter((_, i) => i !== index);
    onUpdate({ photos: newPhotos });
  };

  return (
    <Card className={cn(
      "glass-card border-primary/20 shadow-lg shadow-primary/5 min-h-[500px] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500",
      isBlocked && "border-destructive/30 shadow-destructive/5"
    )}>
      <CardHeader className="border-b border-border/50 bg-white/5 pb-4">
         <div className="flex items-center justify-between">
            <div>
               <p className={cn("text-sm font-medium mb-1", isBlocked ? "text-destructive" : currentStageIssueCount > 0 ? "text-amber-500" : "text-primary")}>
                 {isBlocked ? "STAGE BLOCKED - Critical Issue" : currentStageIssueCount > 0 ? `CURRENT STAGE (${currentStageIssueCount} open issue${currentStageIssueCount > 1 ? 's' : ''})` : "CURRENT STAGE"}
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
               <input type="file" ref={stagePhotoInputRef} accept="image/*" className="hidden" onChange={handlePhotoSelect} multiple />
               <input type="file" ref={stageCameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
               
               <div>
                  <Label className="mb-2 block flex items-center gap-2"><Camera className="w-4 h-4" /> Stage Photos ({stage.photos?.length || 0})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {(stage.photos || []).map((photo, i) => (
                        <div key={i} className="relative aspect-square rounded-lg bg-secondary border border-border overflow-hidden group">
                           <img src={photo} alt={`Stage photo ${i + 1}`} className="w-full h-full object-cover" />
                           <button 
                              onClick={() => removePhoto(i)}
                              className="absolute top-1 right-1 w-6 h-6 bg-destructive/80 hover:bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X className="w-4 h-4 text-white" />
                           </button>
                        </div>
                     ))}
                     <div className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-2">
                           <button 
                              onClick={() => stageCameraInputRef.current?.click()}
                              className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                              data-testid="button-stage-camera"
                           >
                              <Camera className="w-5 h-5" />
                           </button>
                           <button 
                              onClick={() => stagePhotoInputRef.current?.click()}
                              className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                              data-testid="button-stage-files"
                           >
                              <Folder className="w-5 h-5" />
                           </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground">Camera / Files</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="flex items-center gap-2"><StickyNote className="w-4 h-4" /> Notes & Observations</Label>
                  <Textarea 
                     placeholder="Add detailed notes about this stage..." 
                     className="bg-secondary/50 border-border min-h-[100px]"
                     value={stage.notes || ''}
                     onChange={(e) => onUpdate({ notes: e.target.value })}
                     data-testid="input-stage-notes"
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
           data-testid="button-report-issue"
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
            data-testid="button-complete-stage"
         >
            {stage.id === 11 ? 'Complete Job' : 'Complete Stage'}
            <ChevronRight className="w-4 h-4 ml-2" />
         </Button>
      </div>
    </Card>
  );
}
