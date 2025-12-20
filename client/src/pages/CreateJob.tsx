import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { STAGE_TEMPLATES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Car, User, Calendar as CalendarIcon, Camera, Plus, Folder, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateJob, useServicePackages, useUsers } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().min(10, "Phone number must be valid"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(4, "Year is required"),
  color: z.string().min(1, "Color is required"),
  regNo: z.string().min(1, "Registration number is required"),
  vin: z.string().optional(),
  package: z.string().min(1, "Package selection is required"),
  promisedDate: z.date({ required_error: "Date is required" }),
  promisedTime: z.string().min(1, "Time is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const PHOTO_LABELS = ['Front', 'Back', 'Left', 'Right', 'Roof', 'Interior'];

export default function CreateJob() {
  const [, setLocation] = useLocation();
  const { data: servicePackages = [] } = useServicePackages();
  const { data: teamMembers = [] } = useUsers();
  const createJobMutation = useCreateJob();
  const { toast } = useToast();
  
  const [inwardPhotos, setInwardPhotos] = useState<Record<string, string>>({});
  const [activePhotoSlot, setActivePhotoSlot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInwardPhotos(prev => ({ ...prev, [label]: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
    const dateOnly = values.promisedDate;
    const [hours, minutes] = values.promisedTime.split(':').map(Number);
    const promisedDateTime = new Date(dateOnly);
    promisedDateTime.setHours(hours, minutes, 0, 0);
    
    const inwardPhotoUrls = Object.values(inwardPhotos);
    
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
      stages: JSON.stringify(STAGE_TEMPLATES.map((t, i) => ({
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="min-w-[44px] min-h-[44px]" data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">New Job Card</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Vehicle Inward & Customer Details</p>
        </div>
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
                         <FormLabel>Phone / WhatsApp</FormLabel>
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
                                      "w-full justify-start text-left font-normal",
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
                         <FormLabel>Year</FormLabel>
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
                         <FormLabel>Color</FormLabel>
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

          <div className="flex justify-end gap-4 sticky bottom-4 z-10 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-md p-4 -mx-4 -mb-4 md:rounded-b-xl">
            <Button type="button" variant="secondary" onClick={() => setLocation("/")} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
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
