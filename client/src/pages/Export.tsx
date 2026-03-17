import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FileDown, Search, Calendar as CalendarIcon } from "lucide-react";
import { useJobsSummary, fetchJobs, type ApiJob } from "@/lib/api";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

const DATE_DISPLAY_FORMAT = "dd-MM-yyyy";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hold", label: "Hold" },
  { value: "delivered", label: "Delivered" },
];

function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const d = typeof s === "string" ? parseISO(s) : new Date(s);
    return isNaN(d.getTime()) ? String(s) : format(d, "yyyy-MM-dd");
  } catch {
    return String(s);
  }
}

function jobToRow(job: ApiJob): Record<string, string | number> {
  return {
    "Job No": job.jobNo,
    "Customer Name": job.customerName,
    "Customer Phone": job.customerPhone ?? "",
    "Vehicle Brand": job.vehicleBrand,
    "Vehicle Model": job.vehicleModel,
    "Vehicle Year": job.vehicleYear ?? "",
    "Vehicle Color": job.vehicleColor ?? "",
    "Reg No": job.vehicleRegNo,
    "VIN": job.vehicleVin ?? "",
    "Package": job.package,
    "Status": job.status,
    "Promised Date": formatDate(job.promisedDate),
    "Current Stage": job.currentStage,
    "Created At": formatDate(job.createdAt),
    "Priority": job.priority,
    "Assigned To": job.assignedTo ?? "",
    "Has Issue": job.activeIssue != null && Object.keys(job.activeIssue as object).length > 0 ? "Yes" : "No",
  };
}

function applyFilters<T extends { status: string; promisedDate: string; customerName?: string; vehicleRegNo?: string }>(
  list: T[],
  statusFilter: string,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  search: string
): T[] {
  let result = list;
  if (statusFilter && statusFilter !== "all") {
    result = result.filter((j) => j.status === statusFilter);
  }
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter((j) => {
      const d = new Date(j.promisedDate);
      d.setHours(0, 0, 0, 0);
      return d >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((j) => {
      const d = new Date(j.promisedDate);
      return d <= to;
    });
  }
  const searchLower = search.trim().toLowerCase();
  if (searchLower) {
    result = result.filter(
      (j) =>
        (j.customerName && j.customerName.toLowerCase().includes(searchLower)) ||
        (j.vehicleRegNo && j.vehicleRegNo.toLowerCase().includes(searchLower))
    );
  }
  return result;
}

export default function Export() {
  const { data: summary = [], isLoading } = useJobsSummary();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredCount = useMemo(
    () => applyFilters(summary, statusFilter, dateFrom, dateTo, search).length,
    [summary, statusFilter, dateFrom, dateTo, search]
  );

  const handleExport = async () => {
    if (filteredCount === 0) return;
    setIsExporting(true);
    try {
      const jobs = await fetchJobs();
      const filtered = applyFilters(jobs, statusFilter, dateFrom, dateTo, search);
      const rows = filtered.map(jobToRow);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Jobs");
      const dateStr = format(new Date(), "yyyy-MM-dd");
      XLSX.writeFile(wb, `jobs-export-${dateStr}.xlsx`);
      toast({ title: "Export complete", description: `${filtered.length} jobs exported.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export jobs.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-full max-w-md mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <FileDown className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          Export
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          Filter jobs and export complete details to Excel
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Apply filters below, then click Export to download an Excel file with the filtered jobs.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status" className="min-h-[44px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Promised from (dd-mm-yyyy)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateFrom"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal min-h-[44px]",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {dateFrom ? format(dateFrom, DATE_DISPLAY_FORMAT) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Promised to (dd-mm-yyyy)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dateTo"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal min-h-[44px]",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {dateTo ? format(dateTo, DATE_DISPLAY_FORMAT) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search (customer / reg no)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Filter by name or reg no"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredCount}</span> job
              {filteredCount !== 1 ? "s" : ""} match your filters
            </p>
            <Button
              onClick={handleExport}
              disabled={filteredCount === 0 || isExporting}
              className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isExporting ? "Preparing…" : "Export to Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
