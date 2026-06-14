"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/assessment", label: "Career Assessment", icon: "📋" },
    { href: "/chat", label: "Aria Advisor", icon: "💬" },
    { href: "/roadmap", label: "Study Roadmap", icon: "🗺️" },
    { href: "/portfolio", label: "Portfolio Review", icon: "📂" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-zinc-800/50">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold font-display tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          CareerLens  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono ml-1">AI</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)] font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent hover:border-zinc-800/40"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Badge (Static Mock) */}
        <div className="flex items-center gap-3 hover:opacity-95 transition-all cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">User</p>
            <p className="text-[10px] text-zinc-500">Student Profile</p>
          </div>
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              PS
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
          </div>
        </div>
      </div>
    </header>
  );
}
