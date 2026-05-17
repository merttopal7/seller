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
import { Trash2, Edit, Sliders, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomFilter {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  options: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FilterManagerProps {
  initialFilters: CustomFilter[];
}

export function FilterManager({ initialFilters }: FilterManagerProps) {
  const [filters, setFilters] = useState<CustomFilter[]>(initialFilters);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<CustomFilter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "number" | "select">("text");
  const [options, setOptions] = useState("");

  const resetForm = () => {
    setName("");
    setType("text");
    setOptions("");
    setError("");
    setEditingFilter(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (filter: CustomFilter) => {
    setEditingFilter(filter);
    setName(filter.name);
    setType(filter.type);
    setOptions(filter.options || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) {
      setError("Name and type are required");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      name: name.trim(),
      type,
      options: type === "select" ? options.trim() : null,
    };

    try {
      const url = editingFilter 
        ? `/api/admin/filters/${editingFilter.id}` 
        : "/api/admin/filters";
      const method = editingFilter ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Something went wrong");
      }

      const data = await res.json();
      
      if (editingFilter) {
        setFilters(
          filters.map((f) => (f.id === editingFilter.id ? { ...f, ...data.filter } : f))
        );
      } else {
        setFilters([...filters, data.filter]);
      }

      setIsDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save specification");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? Removing a global specification filter will unregister it from all categories!")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/filters/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete specification");
      }

      setFilters(filters.filter((f) => f.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "text":
        return "Text Input Box";
      case "number":
        return "Numeric Box";
      case "select":
        return "Dropdown Selector";
      default:
        return t;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sliders className="h-7 w-7 text-primary" /> Reusable Specifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure global custom specifications like Color, Year, Fuel Type, or Material to reuse across multiple categories.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Specification
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Global Specifications Pool ({filters.length})</CardTitle>
          <CardDescription>
            These custom specifications can be registered on individual category pages to avoid duplicating setup!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Specification Name</TableHead>
                <TableHead>Input Field Type</TableHead>
                <TableHead>Options (Select Menu Only)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filters.length > 0 ? (
                filters.map((filter) => (
                  <TableRow key={filter.id}>
                    <TableCell className="font-semibold text-base flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-muted-foreground" /> {filter.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {getTypeLabel(filter.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      {filter.type === "select" ? (
                        <div className="flex flex-wrap gap-1">
                          {filter.options?.split(",").map((o, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-muted/40">
                              {o.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">N/A (Any text or number value)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenEdit(filter)}
                        title="Edit Specification Details"
                      >
                        <Edit className="h-4 w-4 text-sky-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(filter.id)}
                        title="Delete Specification"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No specifications configured. Click &quot;Create Specification&quot; to begin building your re-usable attributes pool.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Specification Creation / Editing Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingFilter ? "Edit Specification Details" : "Create Reusable Specification"}</DialogTitle>
            <DialogDescription>
              This filter field can be registered on categories (e.g. Color can be added to Sofas and Cars!).
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Specification Name</Label>
              <Input
                id="filter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Color, Mileage, Year, Material"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Input Field Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Select Input Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input Box</SelectItem>
                  <SelectItem value="number">Numeric Box</SelectItem>
                  <SelectItem value="select">Dropdown Selector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "select" && (
              <div className="space-y-2">
                <Label htmlFor="filter-options">Dropdown Options (comma-separated)</Label>
                <Input
                  id="filter-options"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  placeholder="e.g. gasoline, diesel, electric"
                  required
                />
                <span className="text-xs text-muted-foreground block leading-relaxed">
                  Enter options separated by commas. These will render as select options for sellers and filters for buyers.
                </span>
              </div>
            )}

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
                {loading ? "Saving..." : "Save Specification"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
