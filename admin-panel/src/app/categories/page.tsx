"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { categoriesApi, type Category } from "@/lib/api";
import { toast } from "sonner";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight,
  Car, Bike, Truck, Home, Key, Tag, Briefcase, Smartphone, Monitor,
  Headphones, Shirt, Footprints, Sparkles, Sofa, Refrigerator, Lamp,
  Tree, Newspaper, Wrench, Lightbulb, Dumbbell, Book, Star, Layout, Map,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  car: Car, bike: Bike, truck: Truck, home: Home, key: Key, tag: Tag,
  briefcase: Briefcase, smartphone: Smartphone, monitor: Monitor,
  headphones: Headphones, shirt: Shirt, footprints: Footprints,
  sparkles: Sparkles, sofa: Sofa, refrigerator: Refrigerator,
  lamp: Lamp, tree: Tree, newspaper: Newspaper, wrench: Wrench,
  lightbulb: Lightbulb, dumbbell: Dumbbell, book: Book, star: Star,
  layout: Layout, map: Map,
};

function CategoryIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon.toLowerCase()];
  if (Icon) return <Icon className="h-5 w-5 text-muted-foreground" />;
  return <span className="text-xl">{icon}</span>;
}

const PAGE_SIZE = 20;

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    categoriesApi
      .list()
      .then((d) => setCategories(d.categories))
      .catch(() => toast.error("Kategoriler yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, limit]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      await categoriesApi.delete(cat.id);
      toast.success("Kategori silindi");
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
            <h1 className="text-2xl font-bold tracking-tight">Kategoriler</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `${filtered.length} / ${categories.length} kategori` : `${categories.length} kategori`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim veya slug ara..."
                className="pl-8 pr-8 w-52"
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
            <Button onClick={() => router.push("/categories/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kategori
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İkon</TableHead>
                  <TableHead>İsim</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Üst Kategori</TableHead>
                  <TableHead>Sıra</TableHead>
                  <TableHead>İlan</TableHead>
                  <TableHead>Spec</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted animate-pulse rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      {search ? `"${search}" için kategori bulunamadı` : "Kategori bulunamadı"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((cat) => (
                    <TableRow
                      key={cat.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/categories/${cat.id}`)}
                    >
                      <TableCell>
                        {cat.image
                          ? <img src={cat.image} alt="" className="h-8 w-8 rounded object-cover" />
                          : cat.icon
                            ? <CategoryIcon icon={cat.icon} />
                            : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{cat.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cat.parent?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{cat.order}</TableCell>
                      <TableCell className="text-sm">{cat._count?.ads ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cat.customFilters?.length ?? 0}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-end gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => router.push(`/categories/${cat.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            onClick={() => handleDelete(cat)}
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
            <span>Sayfa {page} / {pages} · {filtered.length} kategori</span>
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
