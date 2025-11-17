import Link from "next/link";
import { ReactNode } from "react";
import { requireCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/navigation/SignOutButton";
import { MobileNav } from "@/components/navigation/MobileNav";

const navItems = [
      { href: "/home", label: "Constellation" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/missions", label: "Missions" },
      { href: "/missions/calendar", label: "Calendar" },
      { href: "/network", label: "Orbit" },
      { href: "/gallery", label: "Gallery" },
      { href: "/admin", label: "Admin" },
    ];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#050113] to-black text-white safe-area-inset">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link 
            href="/missions" 
            className="text-base font-semibold tracking-widest sm:text-lg min-w-[120px]"
          >
            CALI LIGHTS
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-white transition py-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile Navigation */}
          <MobileNav items={navItems} />
          
          {/* User Info - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="hidden lg:inline text-white/60 text-xs">
              {user.name ?? user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 pb-safe">
        {children}
      </main>
    </div>
  );
}
