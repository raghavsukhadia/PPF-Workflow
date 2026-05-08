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
import { useToast } from "@/hooks/use-toast";

const DATE_DISPLAY_FORMAT = "dd-MM-yyyy";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "hold", label: "Hold" },
  { value: "delivered", label: "Delivered" },
];

const PROCESS_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "ppf", label: "PPF Only" },
  { value: "ceramic", label: "Ceramic Only" },
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

function applyFilters(
  list: ApiJob[],
  statusFilter: string,
  processFilter: string,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  search: string
): ApiJob[] {
  let result = list;
  if (statusFilter && statusFilter !== "all") {
    result = result.filter((j) => j.status === statusFilter);
  }
  if (processFilter && processFilter !== "all") {
    result = result.filter((j) => j.processType?.toLowerCase() === processFilter);
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
  const q = search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (j) =>
        (j.customerName && j.customerName.toLowerCase().includes(q)) ||
        (j.vehicleRegNo && j.vehicleRegNo.toLowerCase().includes(q)) ||
        (j.vehicleBrand && j.vehicleBrand.toLowerCase().includes(q)) ||
        (j.vehicleModel && j.vehicleModel.toLowerCase().includes(q))
    );
  }
  return result;
}

// For the preview count we can use the summary (which has processType and status)
function applyFiltersSummary(
  list: any[],
  statusFilter: string,
  processFilter: string,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  search: string
): any[] {
  let result = list;
  if (statusFilter !== "all") result = result.filter((j) => j.status === statusFilter);
  if (processFilter !== "all") result = result.filter((j) => j.processType?.toLowerCase() === processFilter);
  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter((j) => new Date(j.promisedDate) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((j) => new Date(j.promisedDate) <= to);
  }
  const q = search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (j) =>
        (j.customerName && j.customerName.toLowerCase().includes(q)) ||
        (j.vehicleRegNo && j.vehicleRegNo.toLowerCase().includes(q)) ||
        (j.vehicleBrand && j.vehicleBrand.toLowerCase().includes(q)) ||
        (j.vehicleModel && j.vehicleModel.toLowerCase().includes(q))
    );
  }
  return result;
}

const COLUMNS = [
  { header: "Job No", key: "jobNo", width: 12 },
  { header: "Process Type", key: "processType", width: 14 },
  { header: "Customer Name", key: "customerName", width: 22 },
  { header: "Customer Phone", key: "customerPhone", width: 16 },
  { header: "Vehicle Brand", key: "vehicleBrand", width: 16 },
  { header: "Vehicle Model", key: "vehicleModel", width: 16 },
  { header: "Year", key: "vehicleYear", width: 8 },
  { header: "Color", key: "vehicleColor", width: 12 },
  { header: "Reg No", key: "vehicleRegNo", width: 14 },
  { header: "VIN", key: "vehicleVin", width: 20 },
  { header: "Package", key: "package", width: 24 },
  { header: "Status", key: "status", width: 12 },
  { header: "Priority", key: "priority", width: 10 },
  { header: "Promised Date", key: "promisedDate", width: 15 },
  { header: "Assigned To", key: "assignedTo", width: 16 },
  { header: "Active Issue", key: "activeIssue", width: 13 },
  { header: "Created At", key: "createdAt", width: 15 },
];

async function buildStyledWorkbook(jobs: ApiJob[]): Promise<Blob> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "PPF Workflow";
  wb.created = new Date();

  const ws = wb.addWorksheet("Jobs Export", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  // ── Title row ──────────────────────────────────────────────────────────────
  const titleRow = ws.addRow(["PPF Workflow — Jobs Export"]);
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1E3A5F" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleRow.height = 28;

  // ── Subtitle row (export date + count) ────────────────────────────────────
  const subtitleRow = ws.addRow([
    `Exported on ${format(new Date(), "dd MMM yyyy, hh:mm a")}   •   ${jobs.length} job${jobs.length !== 1 ? "s" : ""}`,
  ]);
  ws.mergeCells(2, 1, 2, COLUMNS.length);
  const subtitleCell = subtitleRow.getCell(1);
  subtitleCell.font = { size: 10, color: { argb: "FF6B7280" }, italic: true };
  subtitleCell.alignment = { horizontal: "center" };
  subtitleRow.height = 18;

  // ── Empty spacer ──────────────────────────────────────────────────────────
  ws.addRow([]);

  // ── Header row ────────────────────────────────────────────────────────────
  const headerRow = ws.addRow(COLUMNS.map((c) => c.header));
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF93C5FD" } },
    };
  });

  // ── Legend row ────────────────────────────────────────────────────────────
  const legendRow = ws.addRow(["PPF (blue)  |  Ceramic (amber)"]);
  ws.mergeCells(5, 1, 5, COLUMNS.length);
  const legendCell = legendRow.getCell(1);
  legendCell.font = { size: 9, italic: true, color: { argb: "FF6B7280" } };
  legendCell.alignment = { horizontal: "right" };
  legendRow.height = 14;

  // ── Data rows ─────────────────────────────────────────────────────────────
  for (const job of jobs) {
    const isPpf = job.processType?.toLowerCase() === "ppf";
    const rowData = COLUMNS.map((c) => {
      const val = (job as any)[c.key];
      if (c.key === "promisedDate" || c.key === "createdAt") return formatDate(val);
      if (c.key === "activeIssue")
        return val != null && Object.keys(val as object).length > 0 ? "Yes" : "No";
      if (c.key === "processType") return val?.toLowerCase() === "ppf" ? "PPF" : "Ceramic";
      return val ?? "";
    });

    const dataRow = ws.addRow(rowData);
    dataRow.height = 16;

    // Row fill: light blue for PPF, light amber for Ceramic
    const fillColor = isPpf ? "FFD1E9FF" : "FFFEF3C7";
    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
      cell.font = { size: 10 };
      cell.alignment = { vertical: "middle" };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
      };
      // Center a few columns
      if ([1, 2, 7, 8, 9, 12, 13, 14, 15, 16, 17].includes(colNumber)) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  }

  // ── Auto filter on header row ─────────────────────────────────────────────
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLUMNS.length } };

  // ── Freeze header ─────────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", ySplit: 4, xSplit: 0, topLeftCell: "A5", activeCell: "A5" }];

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export default function Export() {
  const { data: summary = [], isLoading } = useJobsSummary();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processFilter, setProcessFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const filteredCount = useMemo(
    () => applyFiltersSummary(summary, statusFilter, processFilter, dateFrom, dateTo, search).length,
    [summary, statusFilter, processFilter, dateFrom, dateTo, search]
  );

  const handleExport = async () => {
    if (filteredCount === 0) return;
    setIsExporting(true);
    try {
      const jobs = await fetchJobs();
      const filtered = applyFilters(jobs, statusFilter, processFilter, dateFrom, dateTo, search);
      const blob = await buildStyledWorkbook(filtered);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ppf-jobs-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
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
          Filter jobs and export to a professionally formatted Excel file
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            The exported Excel will have PPF rows highlighted in blue and Ceramic rows in amber.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status */}
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

            {/* Process Type */}
            <div className="space-y-2">
              <Label htmlFor="process">Process Type</Label>
              <Select value={processFilter} onValueChange={setProcessFilter}>
                <SelectTrigger id="process" className="min-h-[44px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Name, reg no, brand…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 min-h-[44px]"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>Promised from</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
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
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Promised to</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
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
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-3 items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-sm bg-blue-100 border border-blue-200" />
              PPF rows
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-sm bg-amber-100 border border-amber-200" />
              Ceramic rows
            </span>
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
              {isExporting ? "Building Excel…" : "Export to Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
