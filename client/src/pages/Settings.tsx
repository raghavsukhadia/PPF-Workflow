import { 
  useServicePackages, useCreateServicePackage, useDeleteServicePackage, 
  useUsers, useCreateUser, useDeleteUser,
  usePpfProducts, useCreatePpfProduct, useDeletePpfProduct,
  usePpfRolls, useCreatePpfRoll, useDeletePpfRoll, useUpdatePpfRoll,
  ApiPpfProduct
} from "@/lib/api";
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
  Layers,
  CircleDot,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Settings() {
  const { data: servicePackages, isLoading: packagesLoading } = useServicePackages();
  const createPackage = useCreateServicePackage();
  const deletePackage = useDeleteServicePackage();
  const { data: teamMembers, isLoading: usersLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const { data: ppfProducts, isLoading: productsLoading } = usePpfProducts();
  const createProduct = useCreatePpfProduct();
  const deleteProduct = useDeletePpfProduct();
  const { data: ppfRolls, isLoading: rollsLoading } = usePpfRolls();
  const createRoll = useCreatePpfRoll();
  const deleteRoll = useDeletePpfRoll();
  const updateRoll = useUpdatePpfRoll();
  const { toast } = useToast();

  const [newPackage, setNewPackage] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Installer");

  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductType, setNewProductType] = useState("Clear");
  const [newProductWidth, setNewProductWidth] = useState("1520");

  const [newRollId, setNewRollId] = useState("");
  const [newRollProductId, setNewRollProductId] = useState("");
  const [newRollBatch, setNewRollBatch] = useState("");
  const [newRollLength, setNewRollLength] = useState("");

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

  const handleAddProduct = () => {
    if (newProductName.trim() && newProductBrand.trim()) {
      createProduct.mutate(
        {
          name: newProductName.trim(),
          brand: newProductBrand.trim(),
          type: newProductType,
          widthMm: parseInt(newProductWidth) || 1520
        },
        {
          onSuccess: () => {
            setNewProductName("");
            setNewProductBrand("");
            setNewProductType("Clear");
            setNewProductWidth("1520");
            toast({ title: "PPF Product Added", description: `${newProductBrand} ${newProductName} is now available.` });
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
        description: "Please fill in product name and brand."
      });
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    deleteProduct.mutate(id, {
      onSuccess: () => {
        toast({ title: "PPF Product Removed", description: `${name} has been removed.` });
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

  const handleAddRoll = () => {
    if (newRollId.trim() && newRollProductId && newRollLength) {
      createRoll.mutate(
        {
          rollId: newRollId.trim(),
          productId: newRollProductId,
          batchNo: newRollBatch.trim() || undefined,
          totalLengthMm: parseInt(newRollLength) * 1000,
          status: "active"
        },
        {
          onSuccess: () => {
            setNewRollId("");
            setNewRollProductId("");
            setNewRollBatch("");
            setNewRollLength("");
            toast({ title: "PPF Roll Added", description: `Roll ${newRollId} added to inventory.` });
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
        description: "Please fill in roll ID, select a product, and enter length."
      });
    }
  };

  const handleDeleteRoll = (id: string, rollId: string) => {
    deleteRoll.mutate(id, {
      onSuccess: () => {
        toast({ title: "PPF Roll Removed", description: `Roll ${rollId} has been removed.` });
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

  const handleMarkRollDepleted = (id: string, rollId: string) => {
    updateRoll.mutate(
      { id, data: { status: "depleted" } },
      {
        onSuccess: () => {
          toast({ title: "Roll Marked Depleted", description: `Roll ${rollId} is now depleted.` });
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
  };

  const getProductById = (productId: string): ApiPpfProduct | undefined => {
    return ppfProducts?.find(p => p.id === productId);
  };

  const getRollUsagePercent = (roll: { totalLengthMm: number; usedLengthMm: number }) => {
    return Math.round((roll.usedLengthMm / roll.totalLengthMm) * 100);
  };

  const getRemainingLength = (roll: { totalLengthMm: number; usedLengthMm: number }) => {
    return ((roll.totalLengthMm - roll.usedLengthMm) / 1000).toFixed(1);
  };

  if (packagesLoading || usersLoading || productsLoading || rollsLoading) {
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
        <TabsList className="w-full max-w-2xl grid grid-cols-4 mb-8">
          <TabsTrigger value="packages">Service Packages</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="ppf-products">PPF Products</TabsTrigger>
          <TabsTrigger value="ppf-rolls">PPF Rolls</TabsTrigger>
        </TabsList>

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
                  data-testid="input-package-name"
                />
                <Button onClick={handleAddPackage} className="bg-primary hover:bg-primary/90" data-testid="button-add-package">
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

        <TabsContent value="ppf-products" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <CardTitle>PPF Products Master</CardTitle>
              </div>
              <CardDescription>Define PPF film brands and types available in your shop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <Input 
                    placeholder="e.g., XPEL, 3M, SunTek" 
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-product-brand"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input 
                    placeholder="e.g., Ultimate Plus, Pro Series" 
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-product-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Film Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    data-testid="select-product-type"
                  >
                    <option value="Clear">Clear (Gloss)</option>
                    <option value="Matte">Matte</option>
                    <option value="Satin">Satin</option>
                    <option value="Colored">Colored</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Roll Width (mm)</label>
                  <Input 
                    type="number"
                    placeholder="1520" 
                    value={newProductWidth}
                    onChange={(e) => setNewProductWidth(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-product-width"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90" data-testid="button-add-product">
                  <Plus className="w-4 h-4 mr-2" /> Add PPF Product
                </Button>
              </div>

              <div className="grid gap-3">
                {ppfProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors" data-testid={`product-${product.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.brand} - {product.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{product.type}</Badge>
                          <span>•</span>
                          <span>{product.widthMm}mm width</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteProduct(product.id, `${product.brand} ${product.name}`)}
                      className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {(!ppfProducts || ppfProducts.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No PPF products added yet</p>
                    <p className="text-sm">Add your first product above to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ppf-rolls" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-primary" />
                <CardTitle>PPF Roll Inventory</CardTitle>
              </div>
              <CardDescription>Track individual PPF rolls and their usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Roll ID</label>
                  <Input 
                    placeholder="e.g., XPEL-001" 
                    value={newRollId}
                    onChange={(e) => setNewRollId(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-roll-id"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PPF Product</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newRollProductId}
                    onChange={(e) => setNewRollProductId(e.target.value)}
                    data-testid="select-roll-product"
                  >
                    <option value="">Select a product...</option>
                    {ppfProducts?.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.brand} - {product.name} ({product.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Number (Optional)</label>
                  <Input 
                    placeholder="e.g., B2024-001" 
                    value={newRollBatch}
                    onChange={(e) => setNewRollBatch(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-roll-batch"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Length (meters)</label>
                  <Input 
                    type="number"
                    placeholder="e.g., 15" 
                    value={newRollLength}
                    onChange={(e) => setNewRollLength(e.target.value)}
                    className="bg-secondary/50"
                    data-testid="input-roll-length"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleAddRoll} 
                  className="bg-primary hover:bg-primary/90" 
                  data-testid="button-add-roll"
                  disabled={!ppfProducts || ppfProducts.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add PPF Roll
                </Button>
              </div>

              {(!ppfProducts || ppfProducts.length === 0) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Add PPF Products first before adding rolls.</span>
                </div>
              )}

              <div className="grid gap-3">
                {ppfRolls?.map((roll) => {
                  const product = getProductById(roll.productId);
                  const usagePercent = getRollUsagePercent(roll);
                  const remaining = getRemainingLength(roll);
                  
                  return (
                    <div key={roll.id} className="p-4 rounded-xl bg-secondary/30 border border-border/50 group hover:border-primary/30 transition-colors" data-testid={`roll-${roll.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            roll.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            roll.status === 'depleted' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            <CircleDot className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{roll.rollId}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{product?.brand} {product?.name}</span>
                              {roll.batchNo && (
                                <>
                                  <span>•</span>
                                  <span>Batch: {roll.batchNo}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={roll.status === 'active' ? 'default' : 'secondary'} className={
                            roll.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            roll.status === 'depleted' ? 'bg-red-500/20 text-red-400' :
                            ''
                          }>
                            {roll.status}
                          </Badge>
                          {roll.status === 'active' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkRollDepleted(roll.id, roll.rollId)}
                              className="text-xs text-muted-foreground hover:text-yellow-400"
                              data-testid={`button-deplete-roll-${roll.id}`}
                            >
                              Mark Depleted
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteRoll(roll.id, roll.rollId)}
                            className="text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                            data-testid={`button-delete-roll-${roll.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Usage: {usagePercent}%</span>
                          <span className="text-muted-foreground">{remaining}m remaining of {(roll.totalLengthMm / 1000).toFixed(1)}m</span>
                        </div>
                        <Progress value={usagePercent} className="h-2" />
                      </div>
                    </div>
                  );
                })}
                {(!ppfRolls || ppfRolls.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CircleDot className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No PPF rolls in inventory</p>
                    <p className="text-sm">Add rolls to track usage and stock</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
