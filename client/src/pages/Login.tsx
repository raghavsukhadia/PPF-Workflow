import { useState } from "react";
import { useLocation } from "wouter";
import { useStore, User } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Car, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useStore();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        const adminUser: User = {
          id: "admin-1",
          name: "Admin User",
          role: "Admin"
        };
        login(adminUser);
        toast({
          title: "Welcome back",
          description: "Successfully logged in as Admin.",
        });
        setLocation("/");
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Invalid username or password.",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-20" />

      <Card className="w-full max-w-md glass-card border-border/50 relative z-10 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-display font-bold">PPF MASTER</CardTitle>
          <CardDescription>Workshop Operating System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username"
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary/50 border-border"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/50 border-border"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Secure Workshop Access</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
