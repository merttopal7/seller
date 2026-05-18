"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statsApi, type Stats } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { Users, Megaphone, Eye, Clock, CheckCircle } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary" | "info" | "outline"> = {
  ACTIVE: "success",
  PENDING: "warning",
  REJECTED: "destructive",
  EXPIRED: "secondary",
  SOLD: "info",
  DRAFT: "outline",
};

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value.toLocaleString("tr-TR")}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Genel bakış</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-20 animate-pulse bg-muted rounded" />
                  </CardContent>
                </Card>
              ))
            : [
                { title: "Kullanıcılar", value: stats?.totalUsers ?? 0, icon: Users },
                { title: "Toplam İlan", value: stats?.totalAds ?? 0, icon: Megaphone },
                { title: "Aktif İlanlar", value: stats?.activeAds ?? 0, icon: CheckCircle },
                { title: "Bekleyen", value: stats?.pendingAds ?? 0, icon: Clock },
                { title: "Görüntüleme", value: stats?.totalViews ?? 0, icon: Eye },
              ].map((s) => <StatCard key={s.title} {...s} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Son İlanlar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {stats?.recentAds.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{ad.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ad.user.name} · {ad.category.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold">
                          {formatPrice(ad.price, ad.currency)}
                        </span>
                        <Badge variant={STATUS_VARIANT[ad.status] ?? "outline"}>
                          {ad.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Son Kayıtlar</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {stats?.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 mr-3">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{user.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
