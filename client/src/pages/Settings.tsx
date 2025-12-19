import { useServicePackages, useCreateServicePackage, useDeleteServicePackage, useUsers, useCreateUser, useDeleteUser } from "@/lib/api";
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
  const { data: servicePackages, isLoading: packagesLoading } = useServicePackages();
  const createPackage = useCreateServicePackage();
  const deletePackage = useDeleteServicePackage();
  const { data: teamMembers, isLoading: usersLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();

  // Package State
  const [newPackage, setNewPackage] = useState("");

  // Team State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Installer");

  const handleAddPackage = () => {
    if (newPackage.trim()) {
      createPackage.mutate(
        { name: newPackage.trim() },
        {
          onSuccess: () => {
            setNewPackage("");
            toast({ title: "Package Added", description: `${newPackage} is now available.` });
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message
            });
          }
        }
      );
    }
  };

  const handleDeletePackage = (id: string, name: string) => {
    deletePackage.mutate(id, {
      onSuccess: () => {
        toast({ title: "Package Removed", description: `${name} has been removed.` });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      }
    });
  };

  const handleAddMember = () => {
    if (newMemberName.trim() && newMemberUsername.trim() && newMemberPassword.trim()) {
      createUser.mutate(
        {
          username: newMemberUsername.trim(),
          password: newMemberPassword.trim(),
          name: newMemberName.trim(),
          role: newMemberRole
        },
        {
          onSuccess: () => {
            setNewMemberName("");
            setNewMemberUsername("");
            setNewMemberPassword("");
            toast({ title: "Team Member Added", description: `${newMemberName} added to the team.` });
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message
            });
          }
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all fields (name, username, and password)."
      });
    }
  };

  const handleDeleteMember = (id: string, name: string) => {
    deleteUser.mutate(id, {
      onSuccess: () => {
        toast({ title: "Team Member Removed", description: `${name} has been removed.` });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      }
    });
  };

  if (packagesLoading || usersLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground" data-testid="loading-state">
        Loading settings...
      </div>
    );
  }

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
                {servicePackages?.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors" data-testid={`package-${pkg.id}`}>
                    <span className="font-medium">{pkg.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                      data-testid={`button-delete-package-${pkg.id}`}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    placeholder="Staff Name" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-member-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input 
                    placeholder="Username for login" 
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-member-username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input 
                    type="password"
                    placeholder="Password" 
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-member-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    data-testid="select-member-role"
                  >
                    <option value="Installer">Installer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddMember} className="bg-primary hover:bg-primary/90" data-testid="button-add-member">
                  <Plus className="w-4 h-4 mr-2" /> Add Team Member
                </Button>
              </div>

              <div className="space-y-3">
                {teamMembers?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors" data-testid={`member-${member.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          <span>{member.role}</span>
                          <span>•</span>
                          <span>{member.username}</span>
                        </div>
                      </div>
                    </div>
                    {member.role !== 'Admin' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                        data-testid={`button-delete-member-${member.id}`}
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
