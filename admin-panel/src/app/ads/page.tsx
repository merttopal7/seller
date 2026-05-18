"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { adsApi, type Ad } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, Search, X } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary" | "info" | "outline"> = {
  ACTIVE: "success", PENDING: "warning", REJECTED: "destructive",
  EXPIRED: "secondary", SOLD: "info", DRAFT: "outline",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif", PENDING: "Bekliyor", REJECTED: "Reddedildi",
  EXPIRED: "Süresi Doldu", SOLD: "Satıldı", DRAFT: "Taslak",
};

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(() => {
    setLoading(true);
    adsApi
      .list({ status: status === "all" ? undefined : status, search: search || undefined, page, limit })
      .then((d) => { setAds(d.ads); setTotal(d.pagination.total); setPages(d.pagination.totalPages); })
      .catch(() => toast.error("İlanlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, [status, search, page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status, limit]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await adsApi.updateStatus(id, newStatus);
      toast.success(`İlan ${STATUS_LABEL[newStatus] ?? newStatus} olarak güncellendi`);
      load();
    } catch { toast.error("Güncelleme başarısız"); }
  };

  const deleteAd = async (id: string, title: string) => {
    if (!confirm(`"${title}" ilanını silmek istediğinize emin misiniz?`)) return;
    try {
      await adsApi.delete(id);
      toast.success("İlan silindi");
      load();
    } catch { toast.error("Silme başarısız"); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">İlanlar</h1>
            <p className="text-sm text-muted-foreground mt-1">{total} ilan</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="İlan başlığı ara..."
                className="pl-8 pr-8 w-56"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="PENDING">Bekliyor</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="REJECTED">Reddedildi</SelectItem>
                <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                <SelectItem value="SOLD">Satıldı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İlan</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : ads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      {search ? `"${search}" için ilan bulunamadı` : "İlan bulunamadı"}
                    </TableCell>
                  </TableRow>
                ) : (
                  ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <p className="font-medium max-w-[200px] truncate">{ad.title}</p>
                        {ad.isFeatured && <Badge variant="info" className="mt-0.5 text-xs">Öne Çıkan</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ad.user.name}</TableCell>
                      <TableCell className="text-sm">{ad.category.name}</TableCell>
                      <TableCell className="text-sm font-medium whitespace-nowrap">{formatPrice(ad.price, ad.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[ad.status] ?? "outline"}>{STATUS_LABEL[ad.status] ?? ad.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(ad.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          {(ad.status === "PENDING" || ad.status === "REJECTED") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(ad.id, "ACTIVE")} title="Onayla">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(ad.status === "PENDING" || ad.status === "ACTIVE") && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50" onClick={() => updateStatus(ad.id, "REJECTED")} title="Reddet">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50" onClick={() => deleteAd(ad.id, ad.title)} title="Sil">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
            <span>Sayfa {page} / {pages} · {total} sonuç</span>
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
