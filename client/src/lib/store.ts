import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types based on the prompt
export type Role = 'Admin' | 'Advisor' | 'Technician' | 'QC';

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

export type JobStage = {
  id: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'issue';
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string; // User ID
  checklist: { item: string; checked: boolean }[];
  notes?: string;
  photos: string[]; // URLs
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
};

// Initial Data
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
    stages: STAGE_TEMPLATES.map(t => ({
      ...t,
      status: t.id < 3 ? 'completed' : t.id === 3 ? 'in-progress' : 'pending',
      checklist: t.checklist.map(c => ({ item: c, checked: t.id < 3 })),
      photos: []
    }))
  }
];

export const USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: 'Admin' },
  { id: 'u2', name: 'Tech Sameer', role: 'Technician' },
  { id: 'u3', name: 'Advisor Priya', role: 'Advisor' },
  { id: 'u4', name: 'QC Vikram', role: 'QC' },
];

// Store
interface AppState {
  currentUser: User;
  jobs: Job[];
  activeJobId: string | null;
  setCurrentUser: (user: User) => void;
  addJob: (job: Job) => void;
  updateJobStage: (jobId: string, stageId: number, data: Partial<JobStage>) => void;
  moveJobStage: (jobId: string, direction: 'next' | 'prev') => void;
  setActiveJob: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: USERS[0],
      jobs: MOCK_JOBS,
      activeJobId: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      setActiveJob: (id) => set({ activeJobId: id }),
      
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
          if (direction === 'next' && job.currentStage < 11) {
             // Mark current as completed if moving next
             job.stages[job.currentStage - 1].status = 'completed';
             job.stages[job.currentStage - 1].completedAt = new Date().toISOString();
             newStageNo++;
             // Mark next as in-progress
             job.stages[newStageNo - 1].status = 'in-progress';
             job.stages[newStageNo - 1].startedAt = new Date().toISOString();
          } else if (direction === 'prev' && job.currentStage > 1) {
             job.stages[job.currentStage - 1].status = 'pending';
             newStageNo--;
             job.stages[newStageNo - 1].status = 'in-progress';
          }
          
          return { ...job, currentStage: newStageNo };
        })
      }))
    }),
    {
      name: 'ppf-master-storage',
    }
  )
);
