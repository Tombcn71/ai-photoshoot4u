"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              AI Headshots
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 ml-6">
            <Link
              href="/#how-it-works"
              className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium transition-colors hover:text-primary">
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium transition-colors hover:text-primary">
              FAQ
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/auth/signin" className="hidden md:block">
            <Button variant="gradient" size="sm">
              Sign In
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-50 bg-background border-b md:hidden transition-all duration-300 ease-in-out",
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        )}>
        <div className="container py-4 flex flex-col gap-4">
          <Link
            href="/#how-it-works"
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
            onClick={() => setIsMenuOpen(false)}>
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
            onClick={() => setIsMenuOpen(false)}>
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
            onClick={() => setIsMenuOpen(false)}>
            FAQ
          </Link>
          <div className="border-t my-2"></div>
          <Link
            href="/auth/signin"
            className="px-4 py-2"
            onClick={() => setIsMenuOpen(false)}>
            <Button variant="gradient" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
