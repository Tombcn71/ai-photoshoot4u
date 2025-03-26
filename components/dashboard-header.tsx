import type React from "react"
import { ThemeToggle } from "./theme-toggle"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
}

export default function DashboardHeader({ heading, text, children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 mb-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          {heading}
        </h1>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {children}
      </div>
    </div>
  )
}

