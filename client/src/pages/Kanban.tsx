import { useJobsSummary, useDeliverJob, ApiJobSummary } from "@/lib/api";
import { STAGE_TEMPLATES, CERAMIC_STAGE_TEMPLATES } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Truck, AlertCircle, User, CalendarClock, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { differenceInCalendarDays } from "date-fns";

// PPF:     1-2 | 3-6 | 7 | 8-9-10 | 11 (Delivered)
// Ceramic: 1-2 | 3-6 | 7 | 8-9    | 10 (Delivered)
const COLUMNS = [
  { id: "inward",     title: "Inward & Inspection", stages: [1, 2] },
  { id: "prep",       title: "Prep & Surface",       stages: [3, 4, 5, 6] },
  { id: "production", title: "Application",           stages: [7] },
  { id: "finishing",  title: "Finishing & QC",        stages: [8, 9, 10] },
  { id: "ready",      title: "Ready for Delivery",    stages: [] as number[] },
];

const COLUMN_ACCENT: Record<string, string> = {
  inward:     "border-t-sky-500",
  prep:       "border-t-violet-500",
  production: "border-t-blue-500",
  finishing:  "border-t-orange-500",
  ready:      "border-t-green-500",
};

function getStageName(processType: string, stageId: number): string {
  const tpl = processType?.toLowerCase() === "ceramic" ? CERAMIC_STAGE_TEMPLATES : STAGE_TEMPLATES;
  return tpl.find((t) => t.id === stageId)?.name ?? `Stage ${stageId}`;
}

function getDeadlineInfo(promisedDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(new Date(promisedDate), today);
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, color: "text-destructive", urgent: true };
  if (days === 0) return { label: "Due today",                  color: "text-amber-500",   urgent: true };
  if (days <= 2)  return { label: `${days}d left`,              color: "text-amber-500",   urgent: false };
  return              { label: `${days}d left`,              color: "text-muted-foreground", urgent: false };
}

export default function Kanban() {
  const { data: apiJobs, isLoading } = useJobsSummary();
  const deliverJob = useDeliverJob();
  const { toast } = useToast();

  const jobs = useMemo(() => apiJobs ?? [], [apiJobs]);

  const getJobsForColumn = (col: (typeof COLUMNS)[number]) => {
    return jobs.filter((job) => {
      if (job.status === "delivered") return false;
      const lastStage = job.processType?.toLowerCase() === "ceramic" ? 10 : 11;
      if (col.id === "ready")      return job.currentStage === lastStage;
      if (col.id === "finishing")  return col.stages.includes(job.currentStage) && job.currentStage !== lastStage;
      return col.stages.includes(job.currentStage);
    });
  };

  const handleMarkDelivered = (job: ApiJobSummary, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deliverJob.mutate(job.id, {
      onSuccess: () =>
        toast({ title: "Job Delivered", description: `${job.vehicleBrand} ${job.vehicleModel} marked as delivered.` }),
      onError: (err) =>
        toast({ variant: "destructive", title: "Error", description: err.message }),
    });
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col -mx-4 sm:mx-0" data-testid="loading-state">
        <div className="mb-4 sm:mb-6 px-4 sm:px-0">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 overflow-x-auto pb-4 px-4 sm:px-0" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="inline-flex flex-nowrap gap-3 sm:gap-4 pb-4 items-start">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex flex-col bg-secondary/30 rounded-xl border border-border/50 overflow-hidden border-t-2"
                style={{ width: "272px", minWidth: "272px", flexShrink: 0 }}
              >
                <div className="p-3 sm:p-4 border-b border-border/50 bg-secondary/50 flex justify-between items-center">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="p-3 space-y-3">
                  {[1, 2].map((j) => <Skeleton key={j} className="h-40 w-full rounded-lg" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalActive = jobs.filter((j) => j.status !== "delivered").length;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col -mx-4 sm:mx-0">
      {/* Header */}
      <div className="mb-4 sm:mb-5 px-4 sm:px-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Kanban Board</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Shop floor overview — {totalActive} active job{totalActive !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground items-center">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/30 border border-blue-500/50" />
            PPF
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50" />
            Ceramic
          </span>
        </div>
      </div>

      {/* Board */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-4 sm:px-0"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-flex flex-nowrap gap-3 sm:gap-4 h-full items-start pb-4">
          {COLUMNS.map((col) => {
            const colJobs = getJobsForColumn(col);
            return (
              <div
                key={col.id}
                className={cn(
                  "flex flex-col bg-secondary/30 rounded-xl border border-border/50 border-t-2 overflow-hidden",
                  COLUMN_ACCENT[col.id]
                )}
                style={{ width: "272px", minWidth: "272px", flexShrink: 0, maxHeight: "calc(100vh - 210px)" }}
              >
                {/* Column header */}
                <div className="p-3 sm:p-4 border-b border-border/50 bg-secondary/50 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                  <h3 className="font-semibold text-xs sm:text-sm uppercase tracking-wide truncate pr-2">
                    {col.title}
                  </h3>
                  <Badge variant="secondary" className="bg-background text-xs shrink-0 tabular-nums">
                    {colJobs.length}
                  </Badge>
                </div>

                {/* Cards scroll area */}
                <div className="overflow-y-auto p-3 space-y-3 flex-1">
                  {colJobs.map((job) => {
                    const hasIssue = !!job.activeIssue && Object.keys(job.activeIssue as object).length > 0;
                    const isPpf = job.processType?.toLowerCase() === "ppf";
                    const deadline = getDeadlineInfo(job.promisedDate);
                    const stageName = getStageName(job.processType, job.currentStage);

                    return (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <Card
                          className={cn(
                            "cursor-pointer transition-all group bg-card select-none",
                            hasIssue
                              ? "border-destructive/50 shadow-sm shadow-destructive/10"
                              : "hover:border-primary/40 hover:shadow-md"
                          )}
                        >
                          <CardContent className="p-4 space-y-3">
                            {/* Top: vehicle + priority/issue */}
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-display font-bold text-base leading-tight truncate">
                                  {job.vehicleBrand} {job.vehicleModel}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                  <User className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{job.customerName}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {job.priority === "high" && !hasIssue && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Priority" />
                                )}
                                {hasIssue && (
                                  <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                              </div>
                            </div>

                            {/* Reg No */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-md">
                              <Car className="w-3 h-3 shrink-0" />
                              <span className="truncate font-mono">{job.vehicleRegNo}</span>
                            </div>

                            {/* Stage name */}
                            <div className="text-xs font-medium text-foreground/80 bg-primary/5 border border-primary/10 px-2.5 py-1.5 rounded-md truncate">
                              {job.currentStage}. {stageName}
                            </div>

                            {/* Footer row */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/50">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] h-5 px-1.5",
                                    isPpf
                                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  )}
                                >
                                  {isPpf ? "PPF" : "Ceramic"}
                                </Badge>
                                {hasIssue && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-destructive/10 text-destructive border-destructive/20">
                                    ISSUE
                                  </Badge>
                                )}
                                {job.jobNo && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    #{job.jobNo}
                                  </span>
                                )}
                              </div>
                              <span className={cn("text-[10px] flex items-center gap-1 font-medium", deadline.color)}>
                                <CalendarClock className="w-3 h-3" />
                                {deadline.label}
                              </span>
                            </div>

                            {/* Deliver button */}
                            {col.id === "ready" && (
                              <Button
                                size="sm"
                                className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 text-white mt-1"
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
                    );
                  })}

                  {colJobs.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed border-border/30 rounded-lg">
                      No jobs here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
