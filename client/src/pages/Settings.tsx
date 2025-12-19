import { useStore, User } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Package, 
  Users, 
  Settings as SettingsIcon,
  Shield,
  Save
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { 
    servicePackages, 
    addServicePackage, 
    removeServicePackage,
    teamMembers,
    addTeamMember,
    removeTeamMember
  } = useStore();
  const { toast } = useToast();

  // Package State
  const [newPackage, setNewPackage] = useState("");

  // Team State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Technician");

  const handleAddPackage = () => {
    if (newPackage.trim()) {
      addServicePackage(newPackage.trim());
      setNewPackage("");
      toast({ title: "Package Added", description: `${newPackage} is now available.` });
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: newMemberName.trim(),
        role: newMemberRole as any
      };
      addTeamMember(newUser);
      setNewMemberName("");
      toast({ title: "Team Member Added", description: `${newUser.name} added to the team.` });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold">System Settings</h2>
          <p className="text-muted-foreground">Manage Master Data & Configurations</p>
        </div>
      </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2 mb-8">
          <TabsTrigger value="packages">Service Packages</TabsTrigger>
          <TabsTrigger value="team">Team Management</TabsTrigger>
        </TabsList>

        {/* Service Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <CardTitle>Service Packages Master</CardTitle>
              </div>
              <CardDescription>Define the service packages available for job cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input 
                  placeholder="Enter new package name (e.g. Interior Detail)" 
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  className="bg-secondary/50"
                />
                <Button onClick={handleAddPackage} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>

              <div className="grid gap-3">
                {servicePackages.map((pkg, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <span className="font-medium">{pkg}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeServicePackage(pkg)}
                      className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Team & Access Control</CardTitle>
              </div>
              <CardDescription>Manage your staff and their roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    placeholder="Staff Name" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="w-48 space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="Technician">Technician</option>
                    <option value="Advisor">Advisor</option>
                    <option value="QC">QC</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <Button onClick={handleAddMember} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          {member.role}
                        </div>
                      </div>
                    </div>
                    {member.role !== 'Admin' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeTeamMember(member.id)}
                        className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
