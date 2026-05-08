import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, CheckCircle2, Calendar, Package, Trash2, Search, X, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useDeliveredJobs, useDeleteJob, ApiDeliveredJob } from "@/lib/api";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProcessFilter = "all" | "ppf" | "ceramic";
type SortOrder = "newest" | "oldest";

export default function Completed() {
  const { data: deliveredJobs = [], isLoading, error } = useDeliveredJobs();
  const deleteJobMutation = useDeleteJob();
  const { toast } = useToast();
  const [jobToDelete, setJobToDelete] = useState<{ id: string; name: string } | null>(null);

  const [search, setSearch] = useState("");
  const [processFilter, setProcessFilter] = useState<ProcessFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const filteredJobs = useMemo(() => {
    let result = [...deliveredJobs];

    if (processFilter !== "all") {
      result = result.filter((j) => j.processType?.toLowerCase() === processFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (j) =>
          j.vehicleBrand.toLowerCase().includes(q) ||
          j.vehicleModel.toLowerCase().includes(q) ||
          j.vehicleRegNo.toLowerCase().includes(q) ||
          j.jobNo.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return result;
  }, [deliveredJobs, search, processFilter, sortOrder]);

  const hasActiveFilters = search.trim() !== "" || processFilter !== "all" || sortOrder !== "newest";

  const clearFilters = () => {
    setSearch("");
    setProcessFilter("all");
    setSortOrder("newest");
  };

  const handleDeleteClick = (e: React.MouseEvent, job: ApiDeliveredJob) => {
    e.preventDefault();
    e.stopPropagation();
    setJobToDelete({ id: job.id, name: `${job.vehicleBrand} ${job.vehicleModel}` });
  };

  const confirmDelete = () => {
    if (!jobToDelete) return;
    deleteJobMutation.mutate(jobToDelete.id, {
      onSuccess: () => {
        toast({
          title: "Job Deleted",
          description: `${jobToDelete.name} has been permanently deleted.`,
        });
        setJobToDelete(null);
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            Completed Jobs
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">All delivered vehicles</p>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-500/20 text-green-500 border-green-500/30 text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 w-fit"
        >
          {deliveredJobs.length} Delivered
        </Badge>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by brand, model, reg no, or job no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Select value={processFilter} onValueChange={(v) => setProcessFilter(v as ProcessFilter)}>
            <SelectTrigger className="w-[130px] min-h-[44px]">
              <SlidersHorizontal className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Process" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ppf">PPF Only</SelectItem>
              <SelectItem value="ceramic">Ceramic Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[140px] min-h-[44px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground shrink-0"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground -mt-2">
          Showing{" "}
          <span className="font-medium text-foreground">{filteredJobs.length}</span> of{" "}
          <span className="font-medium text-foreground">{deliveredJobs.length}</span> jobs
        </p>
      )}

      {/* Job Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card
              className="cursor-pointer transition-all group bg-card border-green-500/20 hover:border-green-500/40 hover:shadow-lg relative"
              data-testid={`card-completed-job-${job.id}`}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                      <Car className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg">
                        {job.vehicleBrand} {job.vehicleModel}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {job.vehicleYear} • {job.vehicleColor}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDeleteClick(e, job)}
                      data-testid={`button-delete-job-${job.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  <Car className="w-4 h-4" />
                  <span>{job.vehicleRegNo}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3 h-3" />
                    <span className="truncate">{job.package}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(job.promisedDate), "MMM d, yyyy")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="flex-1 justify-center bg-green-500/10 text-green-500 border-green-500/20"
                  >
                    DELIVERED
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      job.processType?.toLowerCase() === "ppf"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"
                    }
                  >
                    {job.processType?.toLowerCase() === "ppf" ? "PPF" : "Ceramic"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {error && (
        <div className="text-center py-10 border border-dashed border-destructive/30 rounded-xl bg-destructive/5">
          <p className="text-destructive font-medium">Failed to load completed jobs</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      )}

      {!error && deliveredJobs.length === 0 && (
        <div className="text-center py-16 border border-dashed border-green-500/20 rounded-xl bg-green-500/5">
          <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No completed jobs yet</p>
          <p className="text-sm text-muted-foreground mt-1">Delivered vehicles will appear here</p>
        </div>
      )}

      {!error && deliveredJobs.length > 0 && filteredJobs.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No jobs match your filters</p>
          <Button variant="ghost" onClick={clearFilters} className="mt-3 text-sm">
            Clear filters
          </Button>
        </div>
      )}

      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job for "{jobToDelete?.name}". This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
