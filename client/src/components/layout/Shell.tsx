import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Car
} from "lucide-react";
import { useState } from "react";
import { useStore, USERS } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser, setCurrentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href}>
      <button 
        onClick={() => setIsOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
          location === href 
            ? "bg-primary/10 text-primary border border-primary/20" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight leading-none text-foreground">PPF MASTER</h1>
            <p className="text-xs text-muted-foreground font-medium mt-1">Workshop OS</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</div>
        <NavItem href="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/create-job" icon={PlusCircle} label="New Job Card" />
        <NavItem href="/kanban" icon={ClipboardList} label="Kanban Board" />
        <div className="h-4"></div>
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</div>
        <NavItem href="/settings" icon={Settings} label="Settings" />
      </div>

      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {currentUser.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.role}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
             onClick={() => {
                // Cycle users for demo purposes
                const nextIndex = (USERS.findIndex(u => u.id === currentUser.id) + 1) % USERS.length;
                setCurrentUser(USERS[nextIndex]);
             }}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar/80 backdrop-blur-md border-b border-sidebar-border z-40 px-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
               <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg">PPF MASTER</span>
         </div>
         <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-border bg-sidebar">
              <SidebarContent />
            </SheetContent>
         </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen transition-all">
        <div className="h-full p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
