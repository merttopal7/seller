"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { categoriesApi, filtersApi, type Category, type CustomFilter } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import Link from "next/link";

const EMPTY_FORM = { name: "", slug: "", icon: "", image: "", description: "", order: "0", parentId: "" };
const TYPE_LABEL: Record<string, string> = { text: "Metin", number: "Sayı", select: "Seçenek" };

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allFilters, setAllFilters] = useState<CustomFilter[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [attachedFilters, setAttachedFilters] = useState<CustomFilter[]>([]);
  const [addFilterId, setAddFilterId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsData, filtersData] = await Promise.all([
        categoriesApi.list(),
        filtersApi.list(),
      ]);
      setAllCategories(catsData.categories);
      setAllFilters(filtersData.filters);

      if (!isNew) {
        const catData = await categoriesApi.get(id);
        const cat = catData.category;
        setForm({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon ?? "",
          image: cat.image ?? "",
          description: cat.description ?? "",
          order: String(cat.order),
          parentId: cat.parentId ?? "",
        });
        setAttachedFilters(cat.customFilters ?? []);
      }
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, ...(isNew ? { slug: slugify(name) } : {}) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("İsim ve slug zorunludur");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim() || undefined,
      image: form.image.trim() || undefined,
      description: form.description.trim() || undefined,
      order: parseInt(form.order) || 0,
      parentId: form.parentId || undefined,
      customFilterIds: attachedFilters.map((f) => f.id),
    };
    try {
      if (isNew) {
        const res = await categoriesApi.create(payload);
        toast.success("Kategori oluşturuldu");
        router.push(`/categories/${res.category.id}`);
      } else {
        await categoriesApi.update(id, payload);
        toast.success("Kategori güncellendi");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFilter = async () => {
    if (!addFilterId) return;
    const filter = allFilters.find((f) => f.id === addFilterId);
    if (!filter || attachedFilters.some((f) => f.id === filter.id)) return;
    const updated = [...attachedFilters, filter];
    setAttachedFilters(updated);
    setAddFilterId("");
    if (!isNew) {
      try {
        await categoriesApi.update(id, { customFilterIds: updated.map((f) => f.id) });
      } catch {
        toast.error("Spec eklenemedi");
        setAttachedFilters(attachedFilters);
      }
    }
  };

  const handleRemoveFilter = async (filterId: string) => {
    const prev = attachedFilters;
    const updated = attachedFilters.filter((f) => f.id !== filterId);
    setAttachedFilters(updated);
    if (!isNew) {
      try {
        await categoriesApi.update(id, { customFilterIds: updated.map((f) => f.id) });
      } catch {
        toast.error("Spec kaldırılamadı");
        setAttachedFilters(prev);
      }
    }
  };

  const availableFilters = allFilters.filter(
    (f) => !attachedFilters.some((a) => a.id === f.id),
  );
  const topLevelCats = allCategories.filter((c) => !c.parentId && c.id !== id);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/categories">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "Yeni Kategori" : (form.name || "Kategori Düzenle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? "Yeni bir kategori oluşturun" : "Kategori bilgilerini düzenleyin"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Basic Info ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>İsim *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Elektronik"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Slug *</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                      placeholder="elektronik"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>İkon</Label>
                    <Input
                      value={form.icon}
                      onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                      placeholder="smartphone veya 📱"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sıra</Label>
                    <Input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                      min={0}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Görsel URL</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Üst Kategori</Label>
                  <Select
                    value={form.parentId || "none"}
                    onValueChange={(v) => setForm((f) => ({ ...f, parentId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Üst kategori yok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Üst kategori yok —</SelectItem>
                      {topLevelCats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Açıklama</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Kısa açıklama (opsiyonel)"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Kaydediliyor..." : isNew ? "Oluştur" : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Specifications ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Specifications</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Bu kategorideki ilanlar için özel alanlar
                    </p>
                  </div>
                  <Link href="/specifications">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Tümünü Yönet
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableFilters.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={addFilterId} onValueChange={setAddFilterId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Spec ekle..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFilters.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({TYPE_LABEL[f.type] ?? f.type})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleAddFilter} disabled={!addFilterId}>
                      Ekle
                    </Button>
                  </div>
                )}

                {attachedFilters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Bu kategoriye henüz specification eklenmedi
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attachedFilters.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between px-4 py-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">{f.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABEL[f.type] ?? f.type}
                          </Badge>
                          {f.type === "select" && f.options && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {f.options}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50 shrink-0"
                          onClick={() => handleRemoveFilter(f.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {allFilters.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Henüz hiç specification yok.{" "}
                    <Link href="/specifications" className="underline underline-offset-2">
                      Specification oluştur
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
