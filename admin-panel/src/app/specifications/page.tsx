"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { filtersApi, type CustomFilter } from "@/lib/api";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_LABEL: Record<string, string> = { text: "Metin", number: "Sayı", select: "Seçenek" };
const TYPE_VARIANT: Record<string, "default" | "secondary" | "info"> = {
  text: "secondary", number: "info", select: "default",
};

const EMPTY_FORM = { name: "", type: "text", options: "" };
const PAGE_SIZE = 20;

export default function SpecificationsPage() {
  const [filters, setFilters] = useState<CustomFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFilter | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    filtersApi
      .list()
      .then((d) => setFilters(d.filters))
      .catch(() => toast.error("Specifications yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, limit]);

  const filtered = useMemo(() => {
    if (!search.trim()) return filters;
    const q = search.toLowerCase();
    return filters.filter((f) => f.name.toLowerCase().includes(q));
  }, [filters, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (f: CustomFilter) => {
    setEditing(f);
    setForm({ name: f.name, type: f.type, options: f.options ?? "" });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("İsim zorunludur");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      options: form.type === "select" ? (form.options.trim() || undefined) : undefined,
    };
    try {
      if (editing) {
        await filtersApi.update(editing.id, payload);
        toast.success("Specification güncellendi");
      } else {
        await filtersApi.create(payload);
        toast.success("Specification oluşturuldu");
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: CustomFilter) => {
    if (!confirm(`"${f.name}" specification'ını silmek istediğinize emin misiniz?\nBu spec'i kullanan tüm kategorilerden de kaldırılacak.`)) return;
    try {
      await filtersApi.delete(f.id);
      toast.success("Specification silindi");
      load();
    } catch {
      toast.error("Silme başarısız");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Specifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `${filtered.length} / ${filters.length} specification` : `${filters.length} specification`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Spec ara..."
                className="pl-8 pr-8 w-48"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Specification
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Seçenekler</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                      {search ? `"${search}" için specification bulunamadı` : "Henüz specification oluşturulmadı"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_VARIANT[f.type] ?? "secondary"}>
                          {TYPE_LABEL[f.type] ?? f.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {f.type === "select" && f.options ? f.options : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => openEdit(f)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            onClick={() => handleDelete(f)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
            <span>Sayfa {page} / {pages} · {filtered.length} sonuç</span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Specification Düzenle" : "Yeni Specification"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>İsim *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Marka, Renk, Motor Hacmi..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v, options: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Metin — serbest yazı</SelectItem>
                  <SelectItem value="number">Sayı — sayısal değer</SelectItem>
                  <SelectItem value="select">Seçenek — sabit liste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "select" && (
              <div className="space-y-1.5">
                <Label>Seçenekler</Label>
                <Input
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="Kırmızı, Mavi, Yeşil"
                />
                <p className="text-xs text-muted-foreground">Virgülle ayırın</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
