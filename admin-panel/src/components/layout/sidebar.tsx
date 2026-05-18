"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Users, Tag, MapPin,
  SlidersHorizontal, LogOut, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ads", label: "İlanlar", icon: Megaphone },
  { href: "/users", label: "Kullanıcılar", icon: Users },
  { href: "/categories", label: "Kategoriler", icon: Tag },
  { href: "/specifications", label: "Specifications", icon: SlidersHorizontal },
  { href: "/locations", label: "Konumlar", icon: MapPin },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 bg-gray-900 text-white flex flex-col z-40 transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-white/10 shrink-0",
          collapsed ? "justify-center px-3 py-[18px]" : "px-4 py-5 gap-2",
        )}
      >
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Admin</p>
            <p className="text-sm text-white/60 mt-0.5 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Genişlet" : "Daralt"}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded shrink-0"
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 pt-3 border-t border-white/10 shrink-0">
        <button
          onClick={logout}
          title={collapsed ? "Çıkış Yap" : undefined}
          className={cn(
            "flex items-center w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
