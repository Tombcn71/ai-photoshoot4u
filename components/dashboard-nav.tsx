"use client";

import type React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Upload, Image, CreditCard, Users, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Define navigation items
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Home className="mr-2 h-4 w-4" />,
    },
    {
      title: "Generate",
      href: "/dashboard/generate",
      icon: <Upload className="mr-2 h-4 w-4" />,
    },
    {
      title: "Gallery",
      href: "/dashboard/gallery",
      icon: <Image className="mr-2 h-4 w-4" />,
    },
    {
      title: "Team",
      href: "/dashboard/team",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      title: "Billing",
      href: "/dashboard/billing",
      icon: <CreditCard className="mr-2 h-4 w-4" />,
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="grid gap-1">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              pathname === item.href ? "bg-secondary" : ""
            )}>
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}

      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </nav>
  );
}
