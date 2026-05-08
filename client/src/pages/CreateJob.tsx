import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { STAGE_TEMPLATES, CERAMIC_STAGE_TEMPLATES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Car, User, Calendar as CalendarIcon, Camera, Plus, Folder, X, Shield, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateJob, useServicePackages, useUsers } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { compressImage } from "@/lib/imageUtils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().optional(),
  color: z.string().optional(),
  regNo: z.string().min(1, "Registration number is required"),
  vin: z.string().optional(),
  package: z.string().min(1, "Package selection is required"),
  promisedDate: z.date({ required_error: "Date is required" }),
  promisedTime: z.string().min(1, "Time is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const PHOTO_LABELS = ['Front', 'Back', 'Left', 'Right', 'Roof', 'Interior'];

const PROCESS_OPTIONS = [
  {
    id: 'ppf' as const,
    label: 'PPF',
    fullName: 'Paint Protection Film',
    description: 'Physical film layer that protects paint from chips, scratches, UV and chemical damage.',
    stages: 11,
    icon: Shield,
    color: 'blue',
    highlights: ['Parts removal & repacking', 'Film template mapping', 'Edge-wrap coverage'],
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/40',
    activeBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    badgeBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    id: 'ceramic' as const,
    label: 'Ceramic',
    fullName: 'Ceramic Coating',
    description: 'Nano-ceramic liquid polymer bonded to paint for gloss, hydrophobic protection & UV resistance.',
    stages: 10,
    icon: Sparkles,
    color: 'amber',
    highlights: ['Product selection & verification', 'Dusting & IPA prep', 'Coating application & leveling'],
    gradient: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-500/20 text-amber-400',
  },
];

export default function CreateJob() {
  const [, setLocation] = useLocation();
  const { data: servicePackages = [] } = useServicePackages();
  const { data: teamMembers = [] } = useUsers();
  const createJobMutation = useCreateJob();
  const { toast } = useToast();

  const [processType, setProcessType] = useState<'ppf' | 'ceramic' | null>(null);
  const [inwardPhotos, setInwardPhotos] = useState<Record<string, string>>({});
  const [activePhotoSlot, setActivePhotoSlot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.7);
      setInwardPhotos(prev => ({ ...prev, [label]: compressed }));
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setInwardPhotos(prev => ({ ...prev, [label]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setActivePhotoSlot(null);
  };

  const removePhoto = (label: string) => {
    setInwardPhotos(prev => {
      const newPhotos = { ...prev };
      delete newPhotos[label];
      return newPhotos;
    });
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      brand: "",
      model: "",
      year: new Date().getFullYear().toString(),
      color: "",
      regNo: "",
      vin: "",
      package: "",
      promisedDate: undefined,
      promisedTime: "18:00",
      assignedTo: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!processType) return;

    const dateOnly = values.promisedDate;
    const [hours, minutes] = values.promisedTime.split(':').map(Number);
    const promisedDateTime = new Date(dateOnly);
    promisedDateTime.setHours(hours, minutes, 0, 0);

    const inwardPhotoUrls = Object.values(inwardPhotos);
    const templates = processType === 'ceramic' ? CERAMIC_STAGE_TEMPLATES : STAGE_TEMPLATES;

    const jobData = {
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      vehicleBrand: values.brand,
      vehicleModel: values.model,
      vehicleYear: values.year,
      vehicleColor: values.color,
      vehicleRegNo: values.regNo,
      vehicleVin: values.vin || null,
      package: values.package,
      status: 'active',
      promisedDate: promisedDateTime.toISOString(),
      currentStage: 1,
      assignedTo: values.assignedTo || null,
      processType,
      stages: JSON.stringify(templates.map((t, i) => ({
        ...t,
        status: i === 0 ? 'in-progress' : 'pending',
        checklist: t.checklist.map(c => ({ item: c, checked: false })),
        photos: i === 0 ? inwardPhotoUrls : [],
        assignedTo: values.assignedTo || null,
        startedAt: i === 0 ? new Date().toISOString() : null
      }))),
      priority: 'normal',
      activeIssue: null,
    };

    try {
      const createdJob = await createJobMutation.mutateAsync(jobData);
      toast({
        title: "Job Card Created",
        description: `Job has been successfully created.`,
      });
      setLocation(`/jobs/${createdJob.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create job card",
      });
    }
  }

  // Process selection screen
  if (!processType) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="min-w-[44px] min-h-[44px]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold">New Job Card</h2>
            <p className="text-muted-foreground text-sm sm:text-base">Select the service process to begin</p>
          </div>
        </div>

        <div className="text-center space-y-2 py-4">
          <h3 className="text-xl font-semibold">What service is being performed?</h3>
          <p className="text-muted-foreground text-sm">This determines your workflow stages and checklist.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {PROCESS_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setProcessType(option.id)}
                className={cn(
                  "group relative text-left rounded-2xl border-2 p-6 transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  `bg-gradient-to-br ${option.gradient} ${option.border}`
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-3 rounded-xl bg-background/80 border border-border/50", option.iconColor)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", option.badgeBg)}>
                      {option.stages} Stages
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">{option.label}</p>
                    <h4 className="text-xl font-bold">{option.fullName}</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{option.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    {option.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", option.iconColor)} />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className={cn(
                    "flex items-center justify-between pt-2 border-t border-border/30",
                  )}>
                    <span className={cn("text-sm font-semibold", option.iconColor)}>
                      Select {option.fullName}
                    </span>
                    <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", option.iconColor)} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          You can always view all job details after creation. The workflow stages are fixed once a job is created.
        </p>
      </div>
    );
  }

  const selectedProcess = PROCESS_OPTIONS.find(p => p.id === processType)!;
  const SelectedIcon = selectedProcess.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="min-w-[44px] min-h-[44px]" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">New Job Card</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Vehicle Inward & Customer Details</p>
        </div>
        {/* Process type badge with change option */}
        <button
          onClick={() => setProcessType(null)}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border text-sm font-medium transition-colors hover:opacity-80 shrink-0",
            `${selectedProcess.activeBg} ${selectedProcess.border}`
          )}
        >
          <SelectedIcon className={cn("w-4 h-4 shrink-0", selectedProcess.iconColor)} />
          <span className={cn("hidden sm:inline", selectedProcess.iconColor)}>{selectedProcess.fullName}</span>
          <span className={cn("sm:hidden font-semibold", selectedProcess.iconColor)}>{selectedProcess.label}</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">(change)</span>
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <div className="grid lg:grid-cols-3 gap-8">

            <div className="lg:col-span-1 space-y-8">
               <Card className="glass-card border-border/50">
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><User className="w-5 h-5" /></div>
                     <CardTitle>Customer</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <FormField
                     control={form.control}
                     name="customerName"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Full Name</FormLabel>
                         <FormControl>
                           <Input placeholder="e.g. Rahul Sharma" {...field} data-testid="input-customer-name" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="customerPhone"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">Phone / WhatsApp <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                         <FormControl>
                           <Input placeholder="+91 98765 43210" {...field} data-testid="input-customer-phone" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </CardContent>
               </Card>

               <Card className="glass-card border-border/50">
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarIcon className="w-5 h-5" /></div>
                     <CardTitle>Job Scope</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <FormField
                     control={form.control}
                     name="package"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Service Package</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger data-testid="select-package">
                               <SelectValue placeholder="Select package" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {servicePackages.map((pkg) => (
                               <SelectItem key={pkg.id} value={pkg.name}>{pkg.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <FormField
                     control={form.control}
                     name="assignedTo"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">
                            Assigned Installer <span className="text-xs text-muted-foreground">(Optional)</span>
                         </FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger data-testid="select-installer">
                               <SelectValue placeholder="Select installer" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {teamMembers.map((member) => (
                               <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />

                   <div className="grid grid-cols-5 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="promisedDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col col-span-3">
                            <FormLabel>Delivery Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal min-h-[44px]",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="input-promised-date"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                    <span className="truncate">
                                      {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                                    </span>
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promisedTime"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} data-testid="input-promised-time" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                 </CardContent>
               </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
               <Card className="glass-card border-border/50">
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><Car className="w-5 h-5" /></div>
                     <CardTitle>Vehicle Information</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent className="grid md:grid-cols-2 gap-6">
                   <FormField
                     control={form.control}
                     name="brand"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Brand</FormLabel>
                         <FormControl>
                           <Input placeholder="e.g. Porsche" {...field} data-testid="input-vehicle-brand" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="model"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Model</FormLabel>
                         <FormControl>
                           <Input placeholder="e.g. 911" {...field} data-testid="input-vehicle-model" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="year"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">Year <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                         <FormControl>
                           <Input placeholder="2024" {...field} data-testid="input-vehicle-year" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="color"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel className="flex items-center gap-2">Color <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                         <FormControl>
                           <Input placeholder="Blue" {...field} data-testid="input-vehicle-color" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="regNo"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Reg. Number</FormLabel>
                         <FormControl>
                           <Input placeholder="MH-01-AB-1234" {...field} data-testid="input-vehicle-regno" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={form.control}
                     name="vin"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>VIN (Optional)</FormLabel>
                         <FormControl>
                           <Input placeholder="Last 6 digits" {...field} data-testid="input-vehicle-vin" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </CardContent>
               </Card>

               <Card className="glass-card border-border/50">
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><Camera className="w-5 h-5" /></div>
                     <CardTitle>Inward Photos</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                     {PHOTO_LABELS.map((label, i) => (
                       <Popover key={i} open={activePhotoSlot === label} onOpenChange={(open) => setActivePhotoSlot(open ? label : null)}>
                         <PopoverTrigger asChild>
                           <div className={cn(
                             "aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-colors group relative overflow-hidden",
                             inwardPhotos[label]
                               ? "border-primary/50 bg-primary/5"
                               : "border-dashed border-border hover:border-primary/50 hover:bg-primary/5"
                           )}>
                             {inwardPhotos[label] ? (
                               <>
                                 <img src={inwardPhotos[label]} alt={label} className="w-full h-full object-cover" />
                                 <button
                                   onClick={(e) => { e.stopPropagation(); removePhoto(label); }}
                                   className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center z-10"
                                 >
                                   <X className="w-3 h-3 text-white" />
                                 </button>
                               </>
                             ) : (
                               <>
                                 <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-1" />
                                 <span className="text-[10px] text-muted-foreground font-medium uppercase">{label}</span>
                               </>
                             )}
                           </div>
                         </PopoverTrigger>
                         <PopoverContent className="w-40 p-2">
                           <div className="space-y-1">
                             <input
                               type="file"
                               ref={cameraInputRef}
                               accept="image/*"
                               capture="environment"
                               className="hidden"
                               onChange={(e) => handlePhotoSelect(e, label)}
                             />
                             <input
                               type="file"
                               ref={fileInputRef}
                               accept="image/*"
                               className="hidden"
                               onChange={(e) => handlePhotoSelect(e, label)}
                             />
                             <Button
                               variant="ghost"
                               size="sm"
                               className="w-full justify-start"
                               onClick={() => cameraInputRef.current?.click()}
                             >
                               <Camera className="w-4 h-4 mr-2" /> Camera
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="w-full justify-start"
                               onClick={() => fileInputRef.current?.click()}
                             >
                               <Folder className="w-4 h-4 mr-2" /> Files
                             </Button>
                           </div>
                         </PopoverContent>
                       </Popover>
                     ))}
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 sticky bottom-4 z-10 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-md p-4 -mx-4 -mb-4 md:rounded-b-xl">
            <Button type="button" variant="secondary" onClick={() => setLocation("/")} className="min-h-[44px] w-full sm:w-auto" data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 min-h-[44px] w-full sm:w-auto"
              disabled={createJobMutation.isPending}
              data-testid="button-submit"
            >
              <Save className="w-4 h-4 mr-2" />
              {createJobMutation.isPending ? "Creating..." : "Create Job Card"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
