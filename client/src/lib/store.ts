import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type Role = 'Admin' | 'Installer';

export type User = {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
};

export type Vehicle = {
  brand: string;
  model: string;
  year: string;
  color: string;
  regNo: string;
  vin: string;
};

export type JobIssue = {
  id: string;
  stageId: number;
  description: string;
  reportedBy: string;
  reportedAt: string;
  resolved: boolean;
  resolvedAt?: string;
};

export type StageComment = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type PpfDetails = {
  brand?: string;
  rollId?: string;
  rollImage?: string;
};

export type JobStage = {
  id: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'issue';
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string; // User ID
  checklist: { item: string; checked: boolean }[];
  notes?: string; // Legacy - kept for backwards compatibility
  comments?: StageComment[]; // New comment system
  photos: string[]; // URLs
  ppfDetails?: PpfDetails; // PPF details for stage 7
};

export type Job = {
  id: string;
  jobNo: string;
  customerName: string;
  customerPhone: string;
  vehicle: Vehicle;
  package: string;
  status: 'active' | 'hold' | 'delivered' | 'cancelled';
  promisedDate: string;
  currentStage: number; // 1-11
  stages: JobStage[];
  createdAt: string;
  priority: 'normal' | 'high';
  activeIssue?: JobIssue; // Track the current active issue if any
  assignedTo?: string; // Top-level assignment
};

export const STAGE_TEMPLATES = [
  { id: 1, name: 'Vehicle Inward', checklist: ['Customer details verified', 'Walkaround photos (6 angles)', 'Accessories noted', 'Job package confirmed'] },
  { id: 2, name: 'Inspection', checklist: ['Paint condition marked', 'Existing scratches/dents marked', 'Panel-wise note', 'Customer approval'] },
  { id: 3, name: 'Washing (1)', checklist: ['Foam wash done', 'Iron remover used', 'Drying done'] },
  { id: 4, name: 'Surface Preparation', checklist: ['Clay bar treatment', 'IPA wipe', 'Panel temperature OK'] },
  { id: 5, name: 'Parts Opening', checklist: ['Trims removed safely', 'Screws/clips tagged', 'Photos before removal'] },
  { id: 6, name: 'Washing (2)', checklist: ['Dust removed', 'Final dry'] },
  { id: 7, name: 'PPF Installation', checklist: ['Template checked', 'Alignment approved', 'Bubbles checked', 'Edge wrap confirmed'] },
  { id: 8, name: 'Parts Repacking', checklist: ['Clips/screws reinstalled', 'Torque/fitment check', 'No rattles'] },
  { id: 9, name: 'Cleaning & Finishing', checklist: ['Final wipe down', 'Glass cleaned', 'Interior quick clean'] },
  { id: 10, name: 'Final Inspection', checklist: ['Panel-by-panel QC', 'Edges + corners check', 'Curing instructions ready'] },
  { id: 11, name: 'Delivered', checklist: ['Customer walkthrough', 'Delivery photos', 'Payment closed', 'Signature captured'] },
];

const DEFAULT_PACKAGES = [
  "Full Body PPF",
  "Full Body PPF + Ceramic",
  "Front Kit PPF",
  "Ceramic Coating",
  "Maintenance Wash"
];

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: 'Admin' },
  { id: 'u2', name: 'Sameer', role: 'Installer' },
  { id: 'u3', name: 'Priya', role: 'Installer' },
  { id: 'u4', name: 'Vikram', role: 'Installer' },
];

const MOCK_JOBS: Job[] = [
  {
    id: 'job-123',
    jobNo: 'JOB-2024-001',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    vehicle: { brand: 'Porsche', model: '911 Carrera', year: '2024', color: 'Gentian Blue', regNo: 'MH-01-AB-1234', vin: 'WP0ZZZ99ZNS123456' },
    package: 'Full Body PPF + Ceramic',
    status: 'active',
    promisedDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    currentStage: 7,
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    assignedTo: 'u2',
    stages: STAGE_TEMPLATES.map(t => ({
      ...t,
      status: t.id < 7 ? 'completed' : t.id === 7 ? 'in-progress' : 'pending',
      checklist: t.checklist.map(c => ({ item: c, checked: t.id < 7 })),
      photos: [],
      completedAt: t.id < 7 ? new Date(Date.now() - 10000000 + (t.id * 3600000)).toISOString() : undefined
    }))
  },
  {
    id: 'job-124',
    jobNo: 'JOB-2024-002',
    customerName: 'Anjali Gupta',
    customerPhone: '+91 98123 45678',
    vehicle: { brand: 'BMW', model: 'X5', year: '2023', color: 'Alpine White', regNo: 'MH-02-CD-5678', vin: 'WBAJU810009B12345' },
    package: 'Front Kit PPF',
    status: 'active',
    promisedDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    currentStage: 3,
    priority: 'normal',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    assignedTo: 'u3',
    stages: STAGE_TEMPLATES.map(t => ({
      ...t,
      status: t.id < 3 ? 'completed' : t.id === 3 ? 'in-progress' : 'pending',
      checklist: t.checklist.map(c => ({ item: c, checked: t.id < 3 })),
      photos: []
    }))
  }
];

// Store
interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  jobs: Job[];
  servicePackages: string[];
  teamMembers: User[];
  
  login: (user: User) => void;
  logout: () => void;
  
  addJob: (job: Job) => void;
  updateJobStage: (jobId: string, stageId: number, data: Partial<JobStage>) => void;
  moveJobStage: (jobId: string, direction: 'next' | 'prev') => void;
  
  reportIssue: (jobId: string, stageId: number, description: string) => void;
  resolveIssue: (jobId: string) => void;
  
  addServicePackage: (pkg: string) => void;
  removeServicePackage: (pkg: string) => void;
  
  addTeamMember: (member: User) => void;
  removeTeamMember: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      jobs: MOCK_JOBS,
      servicePackages: DEFAULT_PACKAGES,
      teamMembers: DEFAULT_USERS,

      login: (user) => set({ isAuthenticated: true, currentUser: user }),
      logout: () => set({ isAuthenticated: false, currentUser: null }),

      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      
      updateJobStage: (jobId, stageId, data) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id !== jobId) return job;
          const newStages = job.stages.map(stage => 
            stage.id === stageId ? { ...stage, ...data } : stage
          );
          return { ...job, stages: newStages };
        })
      })),

      moveJobStage: (jobId, direction) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id !== jobId) return job;
          
          let newStageNo = job.currentStage;
          const updatedStages = [...job.stages];

          if (direction === 'next' && job.currentStage < 11) {
             // Mark current as completed if moving next
             updatedStages[job.currentStage - 1] = {
               ...updatedStages[job.currentStage - 1],
               status: 'completed',
               completedAt: new Date().toISOString()
             };
             
             newStageNo++;
             
             // Mark next as in-progress
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
          
          return { ...job, currentStage: newStageNo, stages: updatedStages };
        })
      })),

      reportIssue: (jobId, stageId, description) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id !== jobId) return job;
          
          const issue: JobIssue = {
            id: `issue-${Date.now()}`,
            stageId,
            description,
            reportedBy: state.currentUser?.name || 'Unknown',
            reportedAt: new Date().toISOString(),
            resolved: false
          };

          const newStages = job.stages.map(s => 
            s.id === stageId ? { ...s, status: 'issue' as const } : s
          );

          return { ...job, activeIssue: issue, stages: newStages, status: 'hold' };
        })
      })),

      resolveIssue: (jobId) => set((state) => ({
        jobs: state.jobs.map(job => {
          if (job.id !== jobId) return job;
          if (!job.activeIssue) return job;

          const resolvedIssue = { ...job.activeIssue, resolved: true, resolvedAt: new Date().toISOString() };
          
          const newStages = job.stages.map(s => 
            s.id === job.activeIssue?.stageId ? { ...s, status: 'in-progress' as const } : s
          );

          return { ...job, activeIssue: undefined, stages: newStages, status: 'active' };
        })
      })),

      addServicePackage: (pkg) => set((state) => ({ servicePackages: [...state.servicePackages, pkg] })),
      removeServicePackage: (pkg) => set((state) => ({ servicePackages: state.servicePackages.filter(p => p !== pkg) })),

      addTeamMember: (member) => set((state) => ({ teamMembers: [...state.teamMembers, member] })),
      removeTeamMember: (id) => set((state) => ({ teamMembers: state.teamMembers.filter(m => m.id !== id) })),
    }),
    {
      name: 'ppf-master-storage-v4', // Changed name to reset storage for new schema with assignedTo
    }
  )
);
