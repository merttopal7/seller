"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Sliders, FolderPlus, Grid } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CategoryIcon, AVAILABLE_ICONS } from "@/components/ui/category-icon";
import { ImageUploader } from "@/components/ui/image-uploader";

interface CustomFilterSpec {
  name: string;
  type: "text" | "number" | "select";
  options?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  description: string | null;
  order: number;
  parentId: string | null;
  customFilters: any; // Relation array or format mapped
  parent?: { id: string; name: string } | null;
  _count?: { ads: number };
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // Form states (Create only)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("Folder");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [parentId, setParentId] = useState("none");

  const resetForm = () => {
    setName("");
    setSlug("");
    setIcon("Folder");
    setImage("");
    setDescription("");
    setOrder("0");
    setParentId("none");
    setError("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug dynamically
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setError("Name and slug are required");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name,
      slug,
      icon: icon || null,
      image: image || null,
      description: description || null,
      order: Number(order) || 0,
      parentId: parentId === "none" ? null : parentId,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await res.json();
      
      setCategories([...categories, data.category]);
      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Deleting a category will delete all ads within it!")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete category");
      }

      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Helper to format specs visually
  const formatFilterSpecs = (cat: Category) => {
    if (!cat.customFilters) return <span className="text-muted-foreground text-xs italic">None set</span>;
    let specs: CustomFilterSpec[] = [];
    try {
      specs = typeof cat.customFilters === "string" ? JSON.parse(cat.customFilters) : cat.customFilters;
    } catch {
      return <span className="text-muted-foreground text-xs italic">None set</span>;
    }

    if (!specs || specs.length === 0) return <span className="text-muted-foreground text-xs italic">None set</span>;

    return (
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-xs font-semibold mr-1 text-primary">{specs.length} Custom Filters:</span>
        {specs.slice(0, 3).map((s, idx) => (
          <Badge key={idx} variant="outline" className="text-xs bg-muted/40">
            {s.name}
          </Badge>
        ))}
        {specs.length > 3 && (
          <Badge variant="outline" className="text-xs bg-muted">
            +{specs.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Categories</h1>
          <p className="text-muted-foreground mt-1">
            Build multi-level hierarchy catalog and configure specifications filters.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <FolderPlus className="h-4 w-4" /> Create Category
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Product Categories ({categories.length})</CardTitle>
          <CardDescription>
            Root and subcategories tree structure with dynamic specifications filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Icon</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Dynamic Filters</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <CategoryIcon name={cat.icon} image={cat.image} className="h-6 w-6 text-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {cat.slug}
                    </TableCell>
                    <TableCell>
                      {cat.parent ? (
                        <Badge variant="secondary" className="font-medium">
                          {cat.parent.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Root Category</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 max-w-[280px]">
                        {formatFilterSpecs(cat)}
                        <Link href={`/admin/categories/${cat.id}/edit`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs flex items-center gap-1 text-primary hover:text-primary hover:bg-primary/5 w-fit p-0">
                            <Sliders className="h-3 w-3" />
                            Configure &rarr;
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {cat.order}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/categories/${cat.id}/edit`}>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Configure Category & Specifications"
                        >
                          <Edit className="h-4 w-4 text-sky-500" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(cat.id)}
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No categories defined. Click &quot;Create Category&quot; to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Creation Modal (simplified) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Assign parent hierarchy and catalog sorting details. Configure custom filters on the dedicated page.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Sedan Cars"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-slug">Category Slug</Label>
                <Input
                  id="cat-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. sedan-cars"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Category Icon</Label>
                <div
                  onClick={() => setIsIconPickerOpen(true)}
                  className="flex items-center gap-3 p-2 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all select-none h-10"
                >
                  <div className="p-1 bg-primary/10 text-primary rounded-lg shrink-0">
                    <CategoryIcon name={icon} className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">{icon}</span>
                  </div>
                  <Grid className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="cat-parent">Parent Category</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="cat-parent">
                    <SelectValue placeholder="Select Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Root Category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Image Banner / Thumbnail */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Category Thumbnail / Banner Image</Label>
              <ImageUploader
                value={image}
                onChange={setImage}
                placeholder="Upload banner or thumbnail for this category"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-order">Sorting Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Input
                  id="cat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GORGEOUS VECTOR ICON PICKER MODAL POPUP */}
      <Dialog open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              🎨 Choose Category Icon
            </DialogTitle>
            <DialogDescription>
              Select a vector icon that best represents this category across the marketplace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto p-1.5">
            {AVAILABLE_ICONS.map((ico) => (
              <button
                key={ico.name}
                type="button"
                onClick={() => {
                  setIcon(ico.name);
                  setIsIconPickerOpen(false);
                }}
                className={`flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 text-center select-none ${
                  icon === ico.name
                    ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-border hover:border-primary/50 hover:bg-muted bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${icon === ico.name ? "bg-primary/10" : "bg-muted"}`}>
                  <CategoryIcon name={ico.name} className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold block truncate max-w-full leading-tight">
                  {ico.name}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsIconPickerOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
