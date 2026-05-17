import { cookies } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Eye, AlertTriangle } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getStats() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch admin stats");
    }

    const data = await res.json();
    return {
      users: data.stats.totalUsers,
      ads: data.stats.totalAds,
      activeAds: data.stats.activeAds,
      pendingAds: data.stats.pendingAds,
      views: data.stats.totalViews,
      recentAds: data.recentAds || [],
      recentUsers: data.recentUsers || [],
    };
  } catch (error) {
    console.error("Failed to load admin stats:", error);
    return {
      users: 0,
      ads: 0,
      activeAds: 0,
      pendingAds: 0,
      views: 0,
      recentAds: [],
      recentUsers: [],
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time statistics and overview of MarketPlace portal.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium uppercase">Total Users</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium uppercase">Total Ads</CardDescription>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeAds} active • {stats.pendingAds} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium uppercase">Total Views</CardDescription>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-medium uppercase">Pending Ads</CardDescription>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.pendingAds}
            </div>
            {stats.pendingAds > 0 && (
              <Link href="/admin/ads" className="text-xs text-primary hover:underline block mt-1">
                Review pending ads →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Ads Listings</CardTitle>
            <CardDescription>Latest classified ads posted on the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentAds.map((ad: any) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium truncate max-w-[150px]">
                      <Link href={`/ads/${ad.id}`} className="hover:underline">
                        {ad.title}
                      </Link>
                    </TableCell>
                    <TableCell>{ad.user.name}</TableCell>
                    <TableCell>{formatPrice(ad.price, ad.currency)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ad.status === "ACTIVE"
                            ? "success"
                            : ad.status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {ad.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users Registration</CardTitle>
            <CardDescription>Latest users signed up on the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
