"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

interface AppShellContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellContextType | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within AppShell");
  }
  return context;
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Load collapsed state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe localStorage read
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
    setMounted(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
      }}
    >
      <div className="min-h-screen bg-background">
        {/* ═══════════════════════════════════════════════════════════════════════
           DESKTOP SIDEBAR
           ═══════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
           MOBILE OVERLAY & SIDEBAR
           ═══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              mobileNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Slide-out sidebar */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-transform duration-500 ease-cinematic",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileNavOpen(false)}
            />
          </div>

          {/* Mobile top bar */}
          <MobileNav onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
           MAIN CONTENT AREA
           ═══════════════════════════════════════════════════════════════════════ */}
        <main
          className={cn(
            "min-h-screen transition-all duration-500 ease-cinematic",
            // Desktop: offset by sidebar width
            sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]",
            // Mobile: add top padding for mobile nav bar
            "pt-14 lg:pt-0"
          )}
        >
          {children}
        </main>
      </div>
    </AppShellContext.Provider>
  );
}
