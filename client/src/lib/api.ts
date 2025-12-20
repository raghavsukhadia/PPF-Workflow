import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ApiUser {
  id: string;
  name: string;
  role: string;
  username: string;
}

export interface ApiJob {
  id: string;
  jobNo: string;
  customerName: string;
  customerPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleRegNo: string;
  vehicleVin: string | null;
  package: string;
  status: string;
  promisedDate: string;
  currentStage: number;
  stages: any;
  createdAt: string;
  priority: string;
  activeIssue: any;
  assignedTo: string | null;
}

export interface ApiServicePackage {
  id: string;
  name: string;
  createdAt: string;
}

export interface ApiPpfProduct {
  id: string;
  name: string;
  brand: string;
  type: string;
  widthMm: number;
  createdAt: string;
}

export interface ApiPpfRoll {
  id: string;
  rollId: string;
  productId: string;
  batchNo: string | null;
  totalLengthMm: number;
  usedLengthMm: number;
  status: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface ApiJobPpfUsage {
  id: string;
  jobId: string;
  panelName: string;
  rollId: string;
  lengthUsedMm: number;
  notes: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ApiJobIssue {
  id: string;
  jobId: string;
  stageId: number;
  issueType: string;
  description: string;
  location: string | null;
  severity: string;
  status: string;
  reportedBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  mediaUrls: string[] | null;
  createdAt: string;
}

async function fetcher(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

export function useAuth() {
  return useQuery<ApiUser>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetcher("/api/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return fetcher("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });
}

export function useJobs() {
  return useQuery<ApiJob[]>({
    queryKey: ["/api/jobs"],
    queryFn: () => fetcher("/api/jobs"),
  });
}

export function useJob(id: string | undefined) {
  return useQuery<ApiJob>({
    queryKey: ["/api/jobs", id],
    queryFn: () => fetcher(`/api/jobs/${id}`),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher("/api/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fetcher(`/api/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", variables.id] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });
}

export function useUsers() {
  return useQuery<ApiUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => fetcher("/api/users"),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetcher("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useServicePackages() {
  return useQuery<ApiServicePackage[]>({
    queryKey: ["/api/packages"],
    queryFn: () => fetcher("/api/packages"),
  });
}

export function useCreateServicePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => fetcher("/api/packages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
  });
}

export function useDeleteServicePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/packages/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
    },
  });
}

// PPF Products Hooks
export function usePpfProducts() {
  return useQuery<ApiPpfProduct[]>({
    queryKey: ["/api/ppf-products"],
    queryFn: () => fetcher("/api/ppf-products"),
  });
}

export function useCreatePpfProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; brand: string; type: string; widthMm: number }) => 
      fetcher("/api/ppf-products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-products"] });
    },
  });
}

export function useDeletePpfProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/ppf-products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-products"] });
    },
  });
}

// PPF Rolls Hooks
export function usePpfRolls() {
  return useQuery<ApiPpfRoll[]>({
    queryKey: ["/api/ppf-rolls"],
    queryFn: () => fetcher("/api/ppf-rolls"),
  });
}

export function useCreatePpfRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rollId: string; productId: string; batchNo?: string; totalLengthMm: number; status: string; imageUrl?: string }) => 
      fetcher("/api/ppf-rolls", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-rolls"] });
    },
  });
}

export function useUpdatePpfRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiPpfRoll> }) =>
      fetcher(`/api/ppf-rolls/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-rolls"] });
    },
  });
}

export function useDeletePpfRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/ppf-rolls/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-rolls"] });
    },
  });
}

// Job PPF Usage Hooks
export function useJobPpfUsage(jobId: string | undefined) {
  return useQuery<ApiJobPpfUsage[]>({
    queryKey: ["/api/jobs", jobId, "ppf-usage"],
    queryFn: () => fetcher(`/api/jobs/${jobId}/ppf-usage`),
    enabled: !!jobId,
  });
}

export function useCreateJobPpfUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: { panelName: string; rollId: string; lengthUsedMm: number; notes?: string; imageUrl?: string } }) =>
      fetcher(`/api/jobs/${jobId}/ppf-usage`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", variables.jobId, "ppf-usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ppf-rolls"] });
    },
  });
}

// Job Issues Hooks
export function useJobIssues(jobId: string | undefined) {
  return useQuery<ApiJobIssue[]>({
    queryKey: ["/api/jobs", jobId, "issues"],
    queryFn: () => fetcher(`/api/jobs/${jobId}/issues`),
    enabled: !!jobId,
  });
}

export function useCreateJobIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { 
      jobId: string; 
      data: { 
        stageId: number;
        issueType: string;
        description: string;
        location?: string;
        severity?: string;
        mediaUrls?: string[];
      } 
    }) =>
      fetcher(`/api/jobs/${jobId}/issues`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", variables.jobId, "issues"] });
    },
  });
}

export function useUpdateJobIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, jobId, data }: { id: string; jobId: string; data: Partial<ApiJobIssue> }) =>
      fetcher(`/api/issues/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", variables.jobId, "issues"] });
    },
  });
}

export function useDeleteJobIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, jobId }: { id: string; jobId: string }) =>
      fetcher(`/api/issues/${id}`, { method: "DELETE" }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", variables.jobId, "issues"] });
    },
  });
}
