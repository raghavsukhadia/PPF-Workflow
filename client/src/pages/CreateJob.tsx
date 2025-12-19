import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useStore, STAGE_TEMPLATES } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Car, User, Calendar as CalendarIcon, Camera, Plus, HardHat } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

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
  promisedDate: z.string().min(1, "Date is required"),
  promisedTime: z.string().min(1, "Time is required"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export default function CreateJob() {
  const [, setLocation] = useLocation();
  const { addJob, servicePackages, teamMembers } = useStore();
  const { toast } = useToast();

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
      promisedDate: "",
      promisedTime: "18:00",
      assignedTo: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const promisedDateTime = new Date(`${values.promisedDate}T${values.promisedTime}`);
    
    const newJob = {
      id: `job-${Date.now()}`,
      jobNo: `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      vehicle: {
        brand: values.brand,
        model: values.model,
        year: values.year,
        color: values.color,
        regNo: values.regNo,
        vin: values.vin || '',
      },
      package: values.package,
      status: 'active' as const,
      promisedDate: promisedDateTime.toISOString(),
      currentStage: 1,
      assignedTo: values.assignedTo ? values.assignedTo : undefined, // Top level assignment
      stages: STAGE_TEMPLATES.map((t, i) => ({
        ...t,
        status: i === 0 ? 'in-progress' : 'pending',
        checklist: t.checklist.map(c => ({ item: c, checked: false })),
        photos: [],
        assignedTo: values.assignedTo ? values.assignedTo : undefined, // Also assign to stages
        startedAt: i === 0 ? new Date().toISOString() : undefined
      })),
      createdAt: new Date().toISOString(),
      priority: 'normal' as const
    };

    // @ts-ignore
    addJob(newJob);
    
    toast({
      title: "Job Card Created",
      description: `Job ${newJob.jobNo} has been successfully created.`,
    });
    
    setLocation(`/jobs/${newJob.id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-display font-bold">New Job Card</h2>
          <p className="text-muted-foreground">Vehicle Inward & Customer Details</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Customer & Job Info */}
            <div className="lg:col-span-1 space-y-8">
               {/* Customer Details */}
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
                           <Input placeholder="e.g. Rahul Sharma" {...field} />
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
                           <Input placeholder="+91 98765 43210" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </CardContent>
               </Card>

               {/* Job Details */}
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
                             <SelectTrigger>
                               <SelectValue placeholder="Select package" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {servicePackages.map((pkg) => (
                               <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
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
                             <SelectTrigger>
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

                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="promisedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="promisedTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
                 </CardContent>
               </Card>
            </div>

            {/* Right Column - Vehicle & Photos */}
            <div className="lg:col-span-2 space-y-8">
               {/* Vehicle Details */}
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
                           <Input placeholder="e.g. Porsche" {...field} />
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
                           <Input placeholder="e.g. 911" {...field} />
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
                           <Input placeholder="2024" {...field} />
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
                           <Input placeholder="Blue" {...field} />
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
                           <Input placeholder="MH-01-AB-1234" {...field} />
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
                           <Input placeholder="Last 6 digits" {...field} />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </CardContent>
               </Card>

               {/* Before Photos */}
               <Card className="glass-card border-border/50">
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <div className="p-2 bg-primary/10 rounded-lg text-primary"><Camera className="w-5 h-5" /></div>
                     <CardTitle>Inward Photos</CardTitle>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                     {['Front', 'Back', 'Left', 'Right', 'Roof', 'Interior'].map((label, i) => (
                       <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                         <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-1" />
                         <span className="text-[10px] text-muted-foreground font-medium uppercase">{label}</span>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4 sticky bottom-4 z-10 pt-4 border-t border-border/50 bg-background/80 backdrop-blur-md p-4 -mx-4 -mb-4 md:rounded-b-xl">
            <Button type="button" variant="secondary" onClick={() => setLocation("/")}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
              <Save className="w-4 h-4 mr-2" />
              Create Job Card
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
