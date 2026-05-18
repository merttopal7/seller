"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Heart,
  PlusCircle,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";

interface NavUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface NavbarProps {
  user?: NavUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent hidden sm:block">
              MarketPlace
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ads..."
                className="pl-9 pr-4 h-10 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Desktop Actions */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/listings">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>

            {user ? (
              <>
                <Link href="/ads/create">
                  <Button size="sm" variant="gradient" className="gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    Post Ad
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" title="Messages">
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="ghost" size="icon" title="Favorites">
                    <Heart className="h-5 w-5" />
                  </Button>
                </Link>
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full hover:bg-muted px-3 py-1.5 transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-popover shadow-lg py-1 z-50"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" /> My Ads
                      </Link>
                      <Link
                        href="/messages"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageSquare className="h-4 w-4" /> Messages
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" variant="gradient">Sign Up</Button>
                </Link>
              </>
            )}
            <div className="border-l border-border h-5 mx-1" />
            <ModeToggle />
          </nav>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

    </header>

      {/* Mobile sidebar — rendered outside <header> to escape its stacking context */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative z-10 w-72 max-w-[85vw] bg-background h-full flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                  MarketPlace
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <ModeToggle />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link
                href="/listings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                Browse Ads
              </Link>

              {user ? (
                <>
                  <Link
                    href="/ads/create"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Post Ad
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    My Ads
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Messages
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                  >
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    Favorites
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Admin Panel
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Logout at bottom */}
            {user && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive text-sm font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
