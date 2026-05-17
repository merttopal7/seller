import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LayoutDashboard, Users, FileText, ArrowLeft, ShieldAlert, FolderTree, Sliders, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar Admin Navigation */}
      <aside className="w-full md:w-64 bg-card border-r border-border shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)]">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <ShieldAlert className="h-5 w-5" /> Admin Control
          </div>
          <Link href="/">
            <Button variant="ghost" size="icon" title="Back to site">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Dashboard Stats
          </Link>
          <Link
            href="/admin/ads"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Manage Listings
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Manage Users
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            Manage Categories
          </Link>
          <Link
            href="/admin/locations"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Manage Locations
          </Link>
          <Link
            href="/admin/filters"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            <Sliders className="h-4 w-4 text-muted-foreground" />
            Manage Specifications
          </Link>
        </nav>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
    </div>
  );
}
