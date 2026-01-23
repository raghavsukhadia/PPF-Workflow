import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export interface ApiUser {
  id: string;
  name: string;
  role: string;
  username: string;
  email?: string;
}

// Helper to map Supabase user to ApiUser
function mapSupabaseUser(user: User | null): ApiUser | null {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.name || user.email || "Unknown",
    role: user.user_metadata?.role || "user",
    username: user.user_metadata?.username || user.email || "unknown",
    email: user.email
  };
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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) return;
  return response.json();
}

export function useAuth() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setIsLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { data: user, isLoading };
}

// Deprecated: Login is handled directly in the component now, but keeping hook structure if needed
// or we can remove it. For backward compatibility with existing code that might use it:
export function useLogin() {
  // This is a placeholder as actual login logic is moving to the component
  // to better handle Supabase specific errors and flows.
  return {
    mutateAsync: async ({ username, password }: any) => {
      // Ideally we should use supabase.auth.signInWithPassword here
      // But username login requires mapping if Supabase uses email.
      // For now, let's assume we will update Login.tsx to use email or handle username mapping.
      throw new Error("Please use Supabase Auth directly");
    }
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });
}

export interface ApiJobSummary {
  id: string;
  jobNo: string;
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleRegNo: string;
  status: string;
  currentStage: number;
  priority: string;
  promisedDate: string;
  assignedTo: string | null;
  package: string;
  createdAt: string;
  activeIssue: any;
}

export function useJobs() {
  return useQuery<ApiJob[]>({
    queryKey: ["/api/jobs"],
    queryFn: () => fetcher("/api/jobs"),
  });
}

export function useJobsSummary() {
  return useQuery<ApiJobSummary[]>({
    queryKey: ["/api/jobs/summary"],
    queryFn: () => fetcher("/api/jobs/summary"),
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
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/summary"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/summary"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/summary"] });
    },
  });
}

export function useDeliverJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetcher(`/api/jobs/${id}/deliver`, { method: "POST" }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", id] });
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
