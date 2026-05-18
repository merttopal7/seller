"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { locationsApi, type Country } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  MapPin, Building2, Map, Home,
} from "lucide-react";

type DialogMode = "country" | "state" | "city" | "neighborhood";

interface DialogState {
  mode: DialogMode;
  action: "create" | "edit";
  name: string;
  latitude: string;
  longitude: string;
  editingId?: string;
  parentContext?: {
    countryId?: string;
    stateId?: string;
    cityId?: string;
  };
}

const DIALOG_TITLES: Record<DialogMode, Record<"create" | "edit", string>> = {
  country: { create: "Ülke Ekle", edit: "Ülke Düzenle" },
  state: { create: "İl Ekle", edit: "İl Düzenle" },
  city: { create: "Şehir Ekle", edit: "Şehir Düzenle" },
  neighborhood: { create: "Mahalle Ekle", edit: "Mahalle Düzenle" },
};

export default function LocationsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    locationsApi
      .list()
      .then((d) => setCountries(d.countries))
      .catch(() => toast.error("Konumlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  const openDialog = (
    mode: DialogMode,
    action: "create" | "edit",
    parentContext?: DialogState["parentContext"],
    editing?: { id: string; name: string; latitude?: number | null; longitude?: number | null },
  ) => {
    setDialog({
      mode,
      action,
      name: editing?.name ?? "",
      latitude: editing?.latitude != null ? String(editing.latitude) : "",
      longitude: editing?.longitude != null ? String(editing.longitude) : "",
      editingId: editing?.id,
      parentContext,
    });
  };

  const handleSave = async () => {
    if (!dialog) return;
    const name = dialog.name.trim();
    if (!name) { toast.error("İsim zorunludur"); return; }
    setSaving(true);
    try {
      if (dialog.action === "create") {
        switch (dialog.mode) {
          case "country":
            await locationsApi.createCountry(name);
            break;
          case "state":
            await locationsApi.createState(name, dialog.parentContext!.countryId!);
            break;
          case "city":
            await locationsApi.createCity(name, dialog.parentContext!.stateId!);
            break;
          case "neighborhood":
            await locationsApi.createNeighborhood(
              name,
              dialog.parentContext!.cityId!,
              dialog.latitude ? parseFloat(dialog.latitude) : undefined,
              dialog.longitude ? parseFloat(dialog.longitude) : undefined,
            );
            break;
        }
      } else {
        const id = dialog.editingId!;
        switch (dialog.mode) {
          case "country":
            await locationsApi.updateCountry(id, name);
            break;
          case "state":
            await locationsApi.updateState(id, name);
            break;
          case "city":
            await locationsApi.updateCity(id, name);
            break;
          case "neighborhood":
            await locationsApi.updateNeighborhood(
              id,
              name,
              dialog.latitude ? parseFloat(dialog.latitude) : undefined,
              dialog.longitude ? parseFloat(dialog.longitude) : undefined,
            );
            break;
        }
      }
      toast.success(dialog.action === "create" ? "Oluşturuldu" : "Güncellendi");
      setDialog(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mode: DialogMode, id: string, name: string) => {
    if (!confirm(`"${name}" silinecek. Tüm alt kayıtlar da etkilenebilir. Emin misiniz?`)) return;
    try {
      switch (mode) {
        case "country": await locationsApi.deleteCountry(id); break;
        case "state": await locationsApi.deleteState(id); break;
        case "city": await locationsApi.deleteCity(id); break;
        case "neighborhood": await locationsApi.deleteNeighborhood(id); break;
      }
      toast.success("Silindi");
      load();
    } catch (e: any) {
      toast.error(e.message || "Silme başarısız");
    }
  };

  const totalStates = countries.reduce((s, c) => s + c.states.length, 0);
  const totalCities = countries.reduce(
    (s, c) => s + c.states.reduce((ss, st) => ss + st.cities.length, 0),
    0,
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Konumlar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {countries.length} ülke · {totalStates} il · {totalCities} şehir
            </p>
          </div>
          <Button onClick={() => openDialog("country", "create")}>
            <Plus className="h-4 w-4 mr-2" />
            Ülke Ekle
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : countries.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                Henüz konum eklenmemiş
              </div>
            ) : (
              <div className="divide-y">
                {countries.map((country) => {
                  const countryOpen = expandedCountries.has(country.id);
                  return (
                    <div key={country.id}>
                      {/* Country */}
                      <div className="flex items-center px-4 py-3 hover:bg-muted/40 group">
                        <button
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          onClick={() => setExpandedCountries((s) => toggle(s, country.id))}
                        >
                          {countryOpen
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          }
                          <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="font-medium">{country.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({country.states.length} il)
                          </span>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost" size="sm" className="h-7 text-xs gap-1"
                            onClick={() => openDialog("state", "create", { countryId: country.id })}
                          >
                            <Plus className="h-3 w-3" /> İl Ekle
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => openDialog("country", "edit", undefined, { id: country.id, name: country.name })}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                            onClick={() => handleDelete("country", country.id, country.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* States */}
                      {countryOpen && (
                        <div className="bg-muted/20">
                          {country.states.length === 0 ? (
                            <p className="pl-14 py-3 text-sm text-muted-foreground italic">
                              İl yok
                            </p>
                          ) : (
                            country.states.map((state) => {
                              const stateOpen = expandedStates.has(state.id);
                              return (
                                <div key={state.id}>
                                  {/* State */}
                                  <div className="flex items-center pl-10 pr-4 py-2.5 hover:bg-muted/40 group border-t border-border/40">
                                    <button
                                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                      onClick={() => setExpandedStates((s) => toggle(s, state.id))}
                                    >
                                      {stateOpen
                                        ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      }
                                      <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                      <span className="text-sm">{state.name}</span>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({state.cities.length} şehir)
                                      </span>
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                      <Button
                                        variant="ghost" size="sm" className="h-6 text-xs gap-1"
                                        onClick={() => openDialog("city", "create", { stateId: state.id })}
                                      >
                                        <Plus className="h-3 w-3" /> Şehir
                                      </Button>
                                      <Button
                                        variant="ghost" size="icon" className="h-6 w-6"
                                        onClick={() => openDialog("state", "edit", undefined, { id: state.id, name: state.name })}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost" size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                        onClick={() => handleDelete("state", state.id, state.name)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Cities */}
                                  {stateOpen && (
                                    <div className="bg-muted/30">
                                      {state.cities.length === 0 ? (
                                        <p className="pl-20 py-2.5 text-sm text-muted-foreground italic">
                                          Şehir yok
                                        </p>
                                      ) : (
                                        state.cities.map((city) => {
                                          const cityOpen = expandedCities.has(city.id);
                                          return (
                                            <div key={city.id}>
                                              {/* City */}
                                              <div className="flex items-center pl-16 pr-4 py-2 hover:bg-muted/40 group border-t border-border/30">
                                                <button
                                                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                                  onClick={() => setExpandedCities((s) => toggle(s, city.id))}
                                                >
                                                  {cityOpen
                                                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                  }
                                                  <Map className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                                  <span className="text-sm">{city.name}</span>
                                                  <span className="text-xs text-muted-foreground ml-1">
                                                    ({city.neighborhoods.length} mahalle)
                                                  </span>
                                                </button>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                  <Button
                                                    variant="ghost" size="sm" className="h-6 text-xs gap-1"
                                                    onClick={() => openDialog("neighborhood", "create", { cityId: city.id })}
                                                  >
                                                    <Plus className="h-3 w-3" /> Mahalle
                                                  </Button>
                                                  <Button
                                                    variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => openDialog("city", "edit", undefined, { id: city.id, name: city.name })}
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost" size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                                    onClick={() => handleDelete("city", city.id, city.name)}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>

                                              {/* Neighborhoods */}
                                              {cityOpen && (
                                                <div className="bg-muted/40">
                                                  {city.neighborhoods.length === 0 ? (
                                                    <p className="pl-28 py-2 text-sm text-muted-foreground italic">
                                                      Mahalle yok
                                                    </p>
                                                  ) : (
                                                    city.neighborhoods.map((nb) => (
                                                      <div
                                                        key={nb.id}
                                                        className="flex items-center pl-24 pr-4 py-1.5 hover:bg-muted/50 group border-t border-border/20"
                                                      >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                          <Home className="h-3 w-3 text-purple-400 shrink-0" />
                                                          <span className="text-sm">{nb.name}</span>
                                                          {(nb.latitude != null || nb.longitude != null) && (
                                                            <span className="text-xs text-muted-foreground truncate">
                                                              {nb.latitude?.toFixed(4)}, {nb.longitude?.toFixed(4)}
                                                            </span>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                          <Button
                                                            variant="ghost" size="icon" className="h-6 w-6"
                                                            onClick={() => openDialog("neighborhood", "edit", undefined, nb)}
                                                          >
                                                            <Pencil className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            variant="ghost" size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                                            onClick={() => handleDelete("neighborhood", nb.id, nb.name)}
                                                          >
                                                            <Trash2 className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    ))
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog ? DIALOG_TITLES[dialog.mode][dialog.action] : ""}
            </DialogTitle>
          </DialogHeader>

          {dialog && (
            <div className="space-y-4 py-1">
              <div className="space-y-1.5">
                <Label>İsim *</Label>
                <Input
                  value={dialog.name}
                  onChange={(e) => setDialog((d) => d ? { ...d, name: e.target.value } : null)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                />
              </div>
              {dialog.mode === "neighborhood" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Enlem</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="12.3456"
                      value={dialog.latitude}
                      onChange={(e) => setDialog((d) => d ? { ...d, latitude: e.target.value } : null)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Boylam</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="-1.5678"
                      value={dialog.longitude}
                      onChange={(e) => setDialog((d) => d ? { ...d, longitude: e.target.value } : null)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : dialog?.action === "edit" ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
