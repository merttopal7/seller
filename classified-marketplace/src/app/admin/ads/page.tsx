import { cookies } from "next/headers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";
import { AdminAdActions } from "./actions";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

export default async function AdminAdsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  let ads: any[] = [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/ads`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      ads = data.ads || [];
    }
  } catch (error) {
    console.error("Failed to load admin ads list:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Listings</h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, reject, or delete marketplace ads.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Classified Ads Listings ({ads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    <Link href={`/ads/${ad.id}`} className="hover:underline font-semibold block">
                      {ad.title}
                    </Link>
                    <span className="text-xs text-muted-foreground block truncate">{ad.city}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium">{ad.user.name}</span>
                    <span className="text-xs text-muted-foreground block">{ad.user.email}</span>
                  </TableCell>
                  <TableCell>{ad.category.name}</TableCell>
                  <TableCell>{formatPrice(ad.price, ad.currency)}</TableCell>
                  <TableCell>{formatDate(ad.createdAt)}</TableCell>
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
                  <TableCell className="text-right">
                    <AdminAdActions adId={ad.id} currentStatus={ad.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
