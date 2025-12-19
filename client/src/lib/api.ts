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
