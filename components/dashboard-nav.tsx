"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Upload, Image, CreditCard, Users } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export default function DashboardNav() {
  const pathname = usePathname();

  // Define navigation items - removing any business or settings references
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
    </nav>
  );
}
