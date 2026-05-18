"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { usersApi, type User } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Ban, CheckCircle } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    usersApi
      .list({ page, limit })
      .then((d) => {
        setUsers(d.users);
        setTotal(d.pagination.total);
        setPages(d.pagination.totalPages);
      })
      .catch(() => toast.error("Kullanıcılar yüklenemedi"))
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [limit]);

  const toggleBan = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "BANNED" : "ACTIVE";
    const msg = newStatus === "BANNED"
      ? `"${user.name}" banlanacak. Emin misiniz?`
      : `"${user.name}" banı kaldırılacak. Emin misiniz?`;
    if (!confirm(msg)) return;
    try {
      await usersApi.updateStatus(user.id, newStatus);
      toast.success(newStatus === "BANNED" ? "Kullanıcı banlandı" : "Ban kaldırıldı");
      load();
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} kullanıcı</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "ACTIVE" ? "success" : "destructive"}>
                          {user.status === "ACTIVE" ? "Aktif" : "Banlı"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {user.role !== "ADMIN" && (
                            <Button
                              variant="ghost" size="sm"
                              className={user.status === "ACTIVE"
                                ? "text-destructive hover:text-destructive hover:bg-red-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                              onClick={() => toggleBan(user)}
                            >
                              {user.status === "ACTIVE"
                                ? <><Ban className="h-3.5 w-3.5 mr-1.5" />Banla</>
                                : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Banı Kaldır</>
                              }
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <PageSizeSelect value={limit} onChange={(v) => setLimit(v)} />
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Sayfa {page} / {pages} · {total} kullanıcı</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
