
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { FileText, LogOut } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: NavItem[];
  onLogout: () => void;
  pathname: string;
}

const NavLink = ({ item, isExpanded, pathname }: { item: NavItem, isExpanded: boolean, pathname: string }) => {
  const isActive = pathname === item.href;
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary",
              !isExpanded && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className={cn("truncate", !isExpanded && "sr-only")}>{item.label}</span>
          </Link>
        </TooltipTrigger>
        {!isExpanded && (
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};


const SidebarContent = ({ menuItems, onLogout, pathname, isExpanded }: { menuItems: NavItem[], onLogout: () => void, pathname: string, isExpanded: boolean }) => (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileText className="h-6 w-6 text-primary" />
           <span className={cn("truncate", !isExpanded && "sr-only")}>InvoicePilot</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {menuItems.map(item => <NavLink key={item.href} item={item} isExpanded={isExpanded} pathname={pathname} />)}
        </nav>
      </div>
      <div className="mt-auto p-4">
         <TooltipProvider delayDuration={0}>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" className={cn("w-full", !isExpanded && "justify-center")} onClick={onLogout}>
                        <LogOut className="h-5 w-5" />
                        <span className={cn("ml-3", !isExpanded && "sr-only")}>Logout</span>
                    </Button>
                </TooltipTrigger>
                 {!isExpanded && (
                    <TooltipContent side="right">Logout</TooltipContent>
                )}
            </Tooltip>
         </TooltipProvider>
      </div>
    </div>
);


export function Sidebar({ isOpen, onClose, menuItems, onLogout, pathname }: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetTrigger asChild>
          <div />
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 md:hidden">
            <SheetTitle className="sr-only">Main Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigation links for the application.</SheetDescription>
           <SidebarContent menuItems={menuItems} onLogout={onLogout} pathname={pathname} isExpanded={true} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:fixed md:inset-y-0 md:flex md:flex-col md:border-r md:bg-muted/40 transition-all duration-300 z-40",
          isOpen ? "md:w-64" : "md:w-20"
        )}
      >
        <SidebarContent menuItems={menuItems} onLogout={onLogout} pathname={pathname} isExpanded={isOpen} />
      </div>
    </>
  );
}
