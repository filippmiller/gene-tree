"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export function Nav() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  };

  const navItems = [
    { href: "/app", label: "Dashboard" },
    { href: "/people", label: "People" },
    { href: "/relations", label: "Relations" },
  ];

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "default" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

