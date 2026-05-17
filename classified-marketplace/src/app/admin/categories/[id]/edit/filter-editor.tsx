"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowUp, ArrowDown, Sliders, CheckCircle2, AlertCircle, Save, Settings, Grid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryIcon, AVAILABLE_ICONS } from "@/components/ui/category-icon";
import { ImageUploader } from "@/components/ui/image-uploader";

interface CustomFilter {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  options: string | null;
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
  customFilters: CustomFilter[];
}

interface FilterEditorProps {
  category: Category;
  globalFilters: CustomFilter[];
  categories: { id: string; name: string }[];
}

export function FilterEditor({ category, globalFilters, categories }: FilterEditorProps) {
  const router = useRouter();

  // Basic Settings States
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [icon, setIcon] = useState(category.icon || "Folder");
  const [image, setImage] = useState(category.image || "");
  const [description, setDescription] = useState(category.description || "");
  const [order, setOrder] = useState(String(category.order));
  const [parentId, setParentId] = useState(category.parentId || "none");

  // Icon Picker Dialog State
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Specifications Register States
  const initialSelectedIds = (category.customFilters || []).map((f) => f.id);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  // Status indicators
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsSuccess, setSpecsSuccess] = useState(false);
  const [specsError, setSpecsError] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate slug dynamically
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    );
    setDetailsSuccess(false);
  };

  const handleToggle = (id: string, checked: boolean) => {
    setSpecsSuccess(false);
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    setSpecsSuccess(false);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) return;

    const updated = [...selectedIds];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setSelectedIds(updated);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setDetailsError("Name and slug are required");
      return;
    }

    setDetailsLoading(true);
    setDetailsError("");
    setDetailsSuccess(false);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      icon: icon.trim() || null,
      image: image.trim() || null,
      description: description.trim() || null,
      order: Number(order) || 0,
      parentId: parentId === "none" ? null : parentId,
    };

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update category details");
      }

      setDetailsSuccess(true);
      router.refresh();
    } catch (err: any) {
      setDetailsError(err.message || "Failed to save category settings");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSaveSpecs = async () => {
    setSpecsLoading(true);
    setSpecsError("");
    setSpecsSuccess(false);

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customFilterIds: selectedIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save category filters");
      }

      setSpecsSuccess(true);
      router.refresh();
    } catch (err: any) {
      setSpecsError(err.message || "Failed to save category specifications");
    } finally {
      setSpecsLoading(false);
    }
  };

  const getFilterById = (id: string) => {
    return globalFilters.find((f) => f.id === id);
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "text":
        return "Text Box";
      case "number":
        return "Numeric";
      case "select":
        return "Dropdown";
      default:
        return t;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Back Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link href="/admin/categories">
          <Button variant="ghost" size="sm" className="flex items-center gap-1.5 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" /> Back to Categories List
          </Button>
        </Link>

        <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-3 py-1.5 rounded-lg border">
          Category ID: {category.id}
        </span>
      </div>

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
          <CategoryIcon name={icon} image={image} className="h-10 w-10 text-primary shrink-0" /> Configure Category: <span className="text-primary">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-base max-w-3xl leading-relaxed">
          Configure all taxonomy settings, vector icons picker popups, parent hierarchy relationship, and register reusable dynamic catalog specifications in one single panel.
        </p>
      </div>

      {/* Basic Settings Form Card */}
      <Card className="border-border shadow-md">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Core Category Settings
          </CardTitle>
          <CardDescription>
            Update metadata slug, category vector icon picker popup, display sorting indices, and parent nested directory structure.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSaveDetails}>
          <CardContent className="p-6 space-y-6">
            {detailsSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                Category core settings have been successfully updated!
              </div>
            )}

            {detailsError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
                {detailsError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-semibold">
                  Category Name
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. SUV Cars"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slug" className="text-sm font-semibold">
                  Category Slug
                </Label>
                <Input
                  id="edit-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setDetailsSuccess(false);
                  }}
                  placeholder="e.g. suv-cars"
                  className="h-10 text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Emojis selector replaced with gorgeous Icon Picker dialog popup */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Category Vector Icon</Label>
                <div
                  onClick={() => setIsIconPickerOpen(true)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/50 hover:border-primary/40 transition-all select-none h-11"
                >
                  <div className="p-1 bg-primary/10 text-primary rounded-lg shrink-0">
                    <CategoryIcon name={icon} image={image} className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">{icon}</span>
                  </div>
                  <Grid className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-parent" className="text-sm font-semibold">
                  Parent Category Hierarchy
                </Label>
                <Select
                  value={parentId}
                  onValueChange={(val) => {
                    setParentId(val);
                    setDetailsSuccess(false);
                  }}
                >
                  <SelectTrigger id="edit-parent" className="h-11 text-sm bg-card">
                    <SelectValue placeholder="Select Parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Treat as Root Category</SelectItem>
                    {categories
                      .filter((c) => c.id !== category.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Image Banner */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Category Thumbnail / Banner Image (Sharp Compressed WebP)</Label>
              <ImageUploader
                value={image}
                onChange={(url) => {
                  setImage(url);
                  setDetailsSuccess(false);
                }}
                placeholder="Click or drag image to compress with Sharp and upload as category banner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="edit-order" className="text-sm font-semibold">
                  Catalog Sorting Order
                </Label>
                <Input
                  id="edit-order"
                  type="number"
                  value={order}
                  onChange={(e) => {
                    setOrder(e.target.value);
                    setDetailsSuccess(false);
                  }}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="edit-description" className="text-sm font-semibold">
                  Brief Catalog Description
                </Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setDetailsSuccess(false);
                  }}
                  placeholder="Describe what items are categorized here..."
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/10 border-t p-6 flex justify-end">
            <Button
              type="submit"
              disabled={detailsLoading}
              className="bg-primary hover:bg-primary/95 text-sm px-6 font-semibold flex items-center gap-2 h-10 shadow-xs"
            >
              <Save className="h-4 w-4" />
              {detailsLoading ? "Saving Settings..." : "Save Category Settings"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Specifications Register Card Block */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight mt-6">Dynamic Catalog Specifications</h2>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Link and prioritize specifications that sellers must configure when posting listings in this category.
        </p>

        {specsSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-sm font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            Dynamic specifications registered successfully!
          </div>
        )}

        {specsError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm font-medium">
            {specsError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Global pool of filters */}
          <Card className="lg:col-span-7 border-border shadow-xs">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" /> Global Pool Registry
              </CardTitle>
              <CardDescription>
                Check options to activate them. Configure options at the global pool settings page.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-3">
              {globalFilters.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 max-h-[550px] overflow-y-auto pr-1">
                  {globalFilters.map((filter) => {
                    const isChecked = selectedIds.includes(filter.id);
                    return (
                      <div
                        key={filter.id}
                        onClick={() => handleToggle(filter.id, !isChecked)}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-primary/5 border-primary/30 shadow-xs"
                            : "bg-card border-border hover:bg-muted/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`filter-${filter.id}`}
                          checked={isChecked}
                          onChange={(e) => handleToggle(filter.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1.5 h-4.5 w-4.5 rounded border-border text-primary focus:ring-primary shrink-0 cursor-pointer accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base text-foreground block truncate">
                              {filter.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground shrink-0 uppercase tracking-wider">
                              {getTypeLabel(filter.type)}
                            </span>
                          </div>
                          {filter.type === "select" && filter.options && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {filter.options.split(",").map((o, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 shrink-0"
                                >
                                  {o.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  <AlertCircle className="h-10 w-10 mx-auto opacity-30 mb-3" />
                  <p className="font-semibold text-base">Specifications Pool is Empty</p>
                  <p className="text-sm mt-1">
                    Go to{" "}
                    <Link href="/admin/filters" className="text-primary hover:underline font-bold">
                      Manage Specifications
                    </Link>{" "}
                    to create global attributes first!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Display order and Save button */}
          <Card className="lg:col-span-5 border-border shadow-xs sticky top-24">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                📂 Active Priorities
              </CardTitle>
              <CardDescription>
                Rearrange visual display hierarchy mapping.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {selectedIds.length > 0 ? (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {selectedIds.map((id, index) => {
                    const filter = getFilterById(id);
                    if (!filter) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 bg-muted/30 border border-border/80 rounded-xl"
                      >
                        <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                          #{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm block truncate">
                            {filter.name}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {getTypeLabel(filter.type)}
                          </span>
                        </div>
                        {/* Order buttons */}
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-muted"
                            disabled={index === 0}
                            onClick={() => moveItem(index, "up")}
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-muted"
                            disabled={index === selectedIds.length - 1}
                            onClick={() => moveItem(index, "down")}
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/10 border border-border rounded-xl">
                  <Sliders className="h-8 w-8 mx-auto opacity-35 mb-2" />
                  <p className="text-xs italic font-medium">No specs registered yet</p>
                  <p className="text-xs mt-1 text-muted-foreground px-4">
                    Check checkboxes in the global list to include custom specs for this category.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-muted/10 border-t p-6">
              <Button
                type="button"
                onClick={handleSaveSpecs}
                disabled={specsLoading}
                className="w-full bg-primary hover:bg-primary/90 text-sm font-semibold h-11 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {specsLoading ? "Saving Dynamic Specs..." : "Save Specifications Register"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

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
                  setDetailsSuccess(false);
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
