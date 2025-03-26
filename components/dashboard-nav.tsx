"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, Briefcase, CreditCard, Home, Image, Mail, Settings, Upload, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardNavProps {
  isBusinessAdmin?: boolean
}

export default function DashboardNav({ isBusinessAdmin = false }: DashboardNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: isBusinessAdmin ? "/dashboard/business" : "/dashboard",
      icon: Home,
    },
    {
      title: "Generate",
      href: "/dashboard/generate",
      icon: Upload,
    },
    {
      title: "Gallery",
      href: "/dashboard/gallery",
      icon: Image,
    },
    ...(isBusinessAdmin
      ? [
          {
            title: "Team",
            href: "/dashboard/business#team-management",
            icon: Users,
          },
          {
            title: "Invitations",
            href: "/dashboard/business#invitations",
            icon: Mail,
          },
          {
            title: "Reports",
            href: "/dashboard/business/reports",
            icon: BarChart,
          },
        ]
      : [
          {
            title: "Team",
            href: "/dashboard/team",
            icon: Users,
          },
        ]),
    {
      title: "Billing",
      href: isBusinessAdmin ? "/dashboard/business#purchase-credits" : "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
    ...(!isBusinessAdmin
      ? [
          {
            title: "Business Upgrade",
            href: "/dashboard/settings/business",
            icon: Briefcase,
          },
        ]
      : []),
  ]

  return (
    <nav className="grid items-start gap-2 p-2">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className={cn("w-full justify-start", pathname === item.href && "bg-secondary")}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}

