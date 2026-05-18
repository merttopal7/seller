"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adSchema, type AdInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Plus, Trash, Sliders, Upload, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/map-picker"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full rounded-xl bg-muted/50 animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>
});

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  customFilters?: Array<{
    name: string;
    type: string;
    options: string[];
  }>;
}

// Recursively traverse parent categories to gather all custom filters
function getAllFiltersForCategory(catId: string, categories: CategoryOption[]): any[] {
  const filters: any[] = [];
  const visited = new Set<string>();
  
  let currentId: string | undefined | null = catId;
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const cat = categories.find((c) => c.id === currentId);
    if (!cat) break;
    
    if (cat.customFilters && cat.customFilters.length > 0) {
      filters.unshift(...cat.customFilters);
    }
    
    currentId = cat.parentId;
  }
  
  // Deduplicate filters by name to prevent overlapping specs
  const uniqueFilters: any[] = [];
  const names = new Set<string>();
  for (const f of filters) {
    if (!names.has(f.name)) {
      names.add(f.name);
      uniqueFilters.push(f);
    }
  }
  
  return uniqueFilters;
}

export function CreateAdForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState<CategoryOption[]>([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [draftAdId, setDraftAdId] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]); // Ouagadougou default
  const [selectedMapCoords, setSelectedMapCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.countries) {
          setLocations(data.countries);
          if (data.countries.length > 0) {
            setSelectedCountryName(data.countries[0].name);
            setValue("country", data.countries[0].name, { shouldValidate: true });
          }
        }
      })
      .catch((err) => console.error("Error loading locations:", err));
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AdInput>({
    resolver: zodResolver(adSchema) as any,
    defaultValues: {
      currency: "USD",
      country: "",
      state: "",
      city: "",
      location: "",
    },
  });

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmitStep2 = async (data: AdInput) => {
    setError("");
    setIsDraftSaving(true);

    try {
      const payload = {
        ...data,
        description: descriptionHtml || data.description,
        images: images,
        customValues,
        status: "DRAFT", // Crucial: "İf user gone on step 1 show it draft"
      };

      const url = draftAdId ? `/api/ads/${draftAdId}` : "/api/ads";
      const method = draftAdId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save draft listing");
      }

      setDraftAdId(json.ad.id);
      setStep(3); // Advance to Step 3 (Image Upload)
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong saving draft");
    } finally {
      setIsDraftSaving(false);
    }
  };

  const hasChildren = (catId: string) => {
    return categories.some((c) => c.parentId === catId);
  };

  return (
    <div className="space-y-8 bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-sm">
      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between mb-8 select-none">
        {[
          { num: 1, label: "Category Selection" },
          { num: 2, label: "Basic Informations" },
          { num: 3, label: "Image Upload" },
          { num: 4, label: "Last Check" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-initial">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step === s.num
                ? "bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary/20"
                : step > s.num
                ? "bg-green-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}>
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${
              step === s.num ? "text-primary" : "text-muted-foreground"
            }`}>
              {s.label}
            </span>
            {s.num < 4 && (
              <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-300 ${
                step > s.num ? "bg-green-600" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: Category Selection */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="font-bold text-lg mb-1">Select Category</h3>
            <p className="text-sm text-muted-foreground">Select the most relevant category for your listing.</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search category (e.g. BMW, Sofas, Electronics...)"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              className="pl-10"
            />
            <span className="absolute left-3.5 top-3 text-muted-foreground text-sm">🔍</span>
            {categorySearchQuery && (
              <button
                onClick={() => setCategorySearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground bg-muted px-1.5 py-0.5 rounded-md"
              >
                Clear
              </button>
            )}
          </div>

          {categorySearchQuery ? (
            /* Search Results View */
            <div className="border rounded-2xl p-4 bg-card space-y-2 max-h-[350px] overflow-y-auto">
              {(() => {
                const results = categories.filter((c) =>
                  c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                );
                
                if (results.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-8">No matching categories found.</p>;
                }

                return results.map((cat) => {
                  // Build full path for user review
                  const path = [];
                  let curr: CategoryOption | undefined = cat;
                  while (curr) {
                    path.unshift(curr.name);
                    curr = categories.find((c) => c.id === curr?.parentId);
                  }
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setValue("categoryId", cat.id, { shouldValidate: true });
                        // Populate path state for explorer matching
                        const fullPath = [];
                        let temp: CategoryOption | undefined = cat;
                        while (temp) {
                          fullPath.unshift(temp);
                          temp = categories.find((c) => c.id === temp?.parentId);
                        }
                        setSelectedPath(fullPath);
                        setCategorySearchQuery(""); // Clear search
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all hover:bg-primary/5 flex items-center justify-between ${
                        selectedCategoryId === cat.id
                          ? "border-primary bg-primary/5 font-bold"
                          : "border-border"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-semibold">{cat.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {path.join(" ➔ ")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                        {hasChildren(cat.id) ? "Folder" : "Select ✓"}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          ) : (
            /* Tree Navigation View */
            <div className="space-y-4">
              {/* Breadcrumb Trail */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs bg-muted/30 p-3 rounded-xl border select-none">
                <button
                  onClick={() => setSelectedPath([])}
                  className={`hover:text-primary transition-colors ${
                    selectedPath.length === 0 ? "font-bold text-primary" : "text-muted-foreground"
                  }`}
                >
                  Categories
                </button>
                {selectedPath.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">➔</span>
                    <button
                      onClick={() => setSelectedPath(selectedPath.slice(0, idx + 1))}
                      className={`hover:text-primary transition-colors ${
                        idx === selectedPath.length - 1 ? "font-bold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </button>
                  </div>
                ))}
              </div>

              {/* Subcategories drill down list */}
              <div className="border rounded-2xl p-2 bg-card max-h-[350px] overflow-y-auto divide-y divide-border/60">
                {(() => {
                  const currentLevelParentId =
                    selectedPath.length > 0 ? selectedPath[selectedPath.length - 1].id : null;
                  
                  const levelCategories = categories.filter(
                    (c) => (c.parentId || null) === currentLevelParentId
                  );

                  return levelCategories.map((cat) => {
                    const isDirectlySelected = selectedCategoryId === cat.id;
                    const childrenCount = categories.filter((c) => c.parentId === cat.id).length;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (childrenCount > 0) {
                            setSelectedPath([...selectedPath, cat]);
                          } else {
                            setSelectedCategoryId(cat.id);
                            setValue("categoryId", cat.id, { shouldValidate: true });
                          }
                        }}
                        className={`w-full text-left p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between text-sm ${
                          isDirectlySelected ? "bg-primary/5 font-semibold text-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{childrenCount > 0 ? "📂" : "📄"}</span>
                          <span className="font-semibold">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {childrenCount > 0 && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                              {childrenCount} subcategories
                            </span>
                          )}
                          <span>{childrenCount > 0 ? "➔" : isDirectlySelected ? "✓ Selected" : "Select"}</span>
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Next Button */}
          {selectedCategoryId && (
            <div className="p-4 border border-green-600/20 rounded-2xl bg-green-500/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-green-600 dark:text-green-400 font-bold block">✓ Category Selected</span>
                <span className="text-sm font-semibold block">
                  {(() => {
                    const path = [];
                    let curr = categories.find((c) => c.id === selectedCategoryId);
                    while (curr) {
                      path.unshift(curr.name);
                      curr = categories.find((c) => c.id === curr?.parentId);
                    }
                    return path.join(" ➔ ");
                  })()}
                </span>
              </div>
              <Button
                onClick={() => setStep(2)}
                variant="gradient"
                className="gap-1.5 font-bold shadow-sm"
              >
                Next Step ➔
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Basic Informations */}
      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmitStep2)} className="space-y-6 animate-in fade-in duration-300">
          {/* Selected category breadcrumb display */}
          <div className="p-3 bg-muted/40 border rounded-xl text-xs flex justify-between items-center">
            <div>
              <span className="text-muted-foreground block">Selected Category:</span>
              <span className="font-bold">
                {(() => {
                  const path = [];
                  let curr = categories.find((c) => c.id === selectedCategoryId);
                  while (curr) {
                    path.unshift(curr.name);
                    curr = categories.find((c) => c.id === curr?.parentId);
                  }
                  return path.join(" ➔ ");
                })()}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs"
            >
              🔄 Change
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Ad Title</Label>
            <Input
              id="title"
              placeholder="e.g. iPhone 15 Pro Max 256GB - Unlocked"
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category Custom Specifications (Dynamic Inheritance) */}
          {(() => {
            const allFilters = selectedCategoryId ? getAllFiltersForCategory(selectedCategoryId, categories) : [];
            if (allFilters.length === 0) return null;
            return (
              <div className="space-y-4 border border-border p-4 rounded-xl bg-muted/20">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                  <Sliders className="h-4 w-4" /> Category Specifications (Inherited)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allFilters.map((filter: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <Label htmlFor={`cf-${filter.name}`}>{filter.name}</Label>
                      {filter.type === "select" ? (
                        <select
                          id={`cf-${filter.name}`}
                          value={customValues[filter.name] || ""}
                          onChange={(e) => setCustomValues({ ...customValues, [filter.name]: e.target.value })}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="">Select {filter.name}</option>
                          {filter.options?.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={`cf-${filter.name}`}
                          type={filter.type === "number" ? "number" : "text"}
                          value={customValues[filter.name] || ""}
                          onChange={(e) => setCustomValues({ ...customValues, [filter.name]: e.target.value })}
                          placeholder={`Enter ${filter.name.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Price & Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                {...register("price", { valueAsNumber: true })}
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                {...register("currency")}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="TRY">TRY (₺)</option>
              </select>
            </div>
          </div>

          {/* Country, State, City, & Neighborhood Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              {locations.length > 0 ? (
                <select
                  id="country"
                  value={selectedCountryName}
                  onChange={(e) => {
                    const countryName = e.target.value;
                    setSelectedCountryName(countryName);
                    setValue("country", countryName, { shouldValidate: true });
                    
                    // Reset others
                    setSelectedStateName("");
                    setValue("state", "");
                    setSelectedCityName("");
                    setValue("city", "");
                    setValue("location", "");
                  }}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select Country</option>
                  {locations.map((country: any) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="country"
                  placeholder="e.g. Burkina Faso"
                  {...register("country")}
                />
              )}
            </div>

            {/* State Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="state">State / Province</Label>
              {locations.length > 0 && selectedCountryName ? (
                (() => {
                  const countryObj = locations.find((c) => c.name === selectedCountryName);
                  const states = countryObj?.states || [];
                  return (
                    <select
                      id="state"
                      value={selectedStateName}
                      onChange={(e) => {
                        const stateName = e.target.value;
                        setSelectedStateName(stateName);
                        setValue("state", stateName, { shouldValidate: true });
                        
                        // Reset others
                        setSelectedCityName("");
                        setValue("city", "");
                        setValue("location", "");
                      }}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select State</option>
                      {states.map((state: any) => (
                        <option key={state.id} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  );
                })()
              ) : (
                <Input
                  id="state"
                  placeholder="e.g. Centre"
                  {...register("state")}
                  className={errors.state ? "border-destructive" : ""}
                  disabled={locations.length > 0 && !selectedCountryName}
                />
              )}
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state.message as string}</p>
              )}
            </div>

            {/* City Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              {locations.length > 0 && selectedStateName ? (
                (() => {
                  const countryObj = locations.find((c) => c.name === selectedCountryName);
                  const stateObj = countryObj?.states?.find((s: any) => s.name === selectedStateName);
                  const cities = stateObj?.cities || [];
                  return (
                    <select
                      id="city"
                      value={selectedCityName}
                      onChange={(e) => {
                        const cityName = e.target.value;
                        setSelectedCityName(cityName);
                        setValue("city", cityName, { shouldValidate: true });
                        setValue("location", ""); // reset neighborhood
                      }}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select City</option>
                      {cities.map((city: any) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  );
                })()
              ) : (
                <Input
                  id="city"
                  placeholder="e.g. Ouagadougou"
                  {...register("city")}
                  className={errors.city ? "border-destructive" : ""}
                  disabled={locations.length > 0 && !selectedStateName}
                />
              )}
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>

            {/* Neighborhood Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Area / Neighborhood</Label>
              {locations.length > 0 && selectedCityName ? (
                (() => {
                  const countryObj = locations.find((c) => c.name === selectedCountryName);
                  const stateObj = countryObj?.states?.find((s: any) => s.name === selectedStateName);
                  const cityObj = stateObj?.cities?.find((c: any) => c.name === selectedCityName);
                  const neighborhoods = cityObj?.neighborhoods || [];
                  return (
                    <select
                      id="location"
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue("location", val, { shouldValidate: true });
                        const n = neighborhoods.find((n: any) => n.name === val);
                        if (n && n.latitude && n.longitude) {
                          setMapCenter([n.latitude, n.longitude]);
                          setValue("latitude", n.latitude);
                          setValue("longitude", n.longitude);
                          setSelectedMapCoords([n.latitude, n.longitude]);
                        } else {
                          setSelectedMapCoords(null);
                          setValue("latitude", null as any);
                          setValue("longitude", null as any);
                        }
                      }}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Neighborhood</option>
                      {neighborhoods.map((n: any) => (
                        <option key={n.id} value={n.name}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  );
                })()
              ) : (
                <Input
                  id="location"
                  placeholder="e.g. Patte d'Oie"
                  {...register("location")}
                  className={errors.location ? "border-destructive" : ""}
                  disabled={locations.length > 0 && !selectedCityName}
                />
              )}
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location.message}</p>
              )}
            </div>
          </div>



          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <RichTextEditor
              value={descriptionHtml}
              onChange={(html) => {
                setDescriptionHtml(html);
                setValue("description", html, { shouldValidate: true });
              }}
              placeholder="Describe your item details, condition, specs, etc..."
              error={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
              ◀ Back to Categories
            </Button>
            <Button type="submit" className="flex-1 gap-2 font-bold" variant="gradient" disabled={isDraftSaving}>
              {isDraftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Draft...
                </>
              ) : (
                "Next: Upload Images ➔"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Image Upload */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Images Gallery */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Images Gallery</Label>
            
            {/* Visual Dropzone Area */}
            <div
              onClick={() => document.getElementById("ad-file-upload")?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/30 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px] select-none"
            >
              <input
                type="file"
                id="ad-file-upload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  
                  setIsUploading(true);
                  try {
                    const uploadPromises = Array.from(files).map(async (file) => {
                      if (file.size > 5 * 1024 * 1024) {
                        alert(`File ${file.name} exceeds 5MB size limit.`);
                        return null;
                      }
                      
                      const formData = new FormData();
                      formData.append("file", file);
                      
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      if (!res.ok) throw new Error("Upload failed");
                      const data = await res.json();
                      return data.url;
                    });
                    
                    const uploadedUrls = await Promise.all(uploadPromises);
                    const validUrls = uploadedUrls.filter((url): url is string => !!url);
                    setImages((prev) => [...prev, ...validUrls]);
                  } catch (err) {
                    alert("Failed to upload and compress one or more listing images");
                  } finally {
                    setIsUploading(false);
                    e.target.value = "";
                  }
                }}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-sm font-semibold text-muted-foreground animate-pulse">
                    Compressing with Sharp & uploading...
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground block">
                      Upload Product Photos
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      Click to browse or drag & drop multiple files (compressed automatically, Max 5MB each)
                    </span>
                  </div>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border p-3 rounded-2xl bg-muted/20">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border bg-background shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="Preview" className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105" />
                    {/* Hover Overlay with Delete Button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                        title="Remove image"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              If no images are provided, a random placeholder image will be assigned automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
            >
              ◀ Back to Details
            </Button>
            <Button
              type="button"
              variant="gradient"
              className="flex-1 gap-2 font-bold"
              disabled={isDraftSaving}
              onClick={async () => {
                setIsDraftSaving(true);
                setError("");
                try {
                  const res = await fetch(`/api/ads/${draftAdId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      images,
                      status: "DRAFT" // Keep status as DRAFT
                    }),
                  });
                  if (!res.ok) throw new Error("Failed to save draft images");
                  setStep(4);
                } catch (err: any) {
                  setError(err.message || "Failed to save draft images");
                } finally {
                  setIsDraftSaving(false);
                }
              }}
            >
              {isDraftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Images...
                </>
              ) : (
                "Next: Last Check ➔"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Last Check */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-5 border rounded-2xl bg-card space-y-4 shadow-xs">
            <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2 text-primary">
              <span>📝</span> Listing Details Review
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Ad Title</span>
                <span className="font-semibold text-base block mt-0.5">{getValues("title")}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Category</span>
                <span className="font-semibold text-base block mt-0.5">
                  {(() => {
                    const path = [];
                    let curr = categories.find((c) => c.id === selectedCategoryId);
                    while (curr) {
                      path.unshift(curr.name);
                      curr = categories.find((c) => c.id === curr?.parentId);
                    }
                    return path.join(" ➔ ");
                  })()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Price & Currency</span>
                <span className="font-bold text-base text-primary block mt-0.5">
                  {getValues("price")} {getValues("currency")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Location</span>
                <span className="font-semibold text-base block mt-0.5">
                  {getValues("city")}, {getValues("location")}
                </span>
              </div>
            </div>

            <div className="text-sm pt-3 border-t">
              <span className="text-muted-foreground block text-xs mb-2">Description</span>
              <div
                className="rich-text-render text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: descriptionHtml || getValues("description") || "" }}
              />
            </div>

            {/* Custom Filters Review */}
            {Object.keys(customValues).length > 0 && (
              <div className="text-sm pt-4 border-t space-y-2">
                <span className="text-muted-foreground block text-xs font-semibold">Specifications</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(customValues).map(([key, val]) => (
                    <div key={key} className="bg-muted/40 p-2 rounded-lg flex justify-between">
                      <span className="text-xs text-muted-foreground">{key}</span>
                      <span className="text-xs font-bold">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Images Preview */}
          <div className="p-5 border rounded-2xl bg-card space-y-3 shadow-xs">
            <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2 text-primary">
              <span>📷</span> Photos Gallery Review
            </h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="Review" className="object-cover h-full w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No photos uploaded. A placeholder banner will be assigned.</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="flex-1"
            >
              ◀ Back to Photos
            </Button>
            <Button
              type="button"
              variant="gradient"
              onClick={async () => {
                setIsDraftSaving(true);
                setError("");
                try {
                  const res = await fetch(`/api/ads/${draftAdId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      status: "PENDING" // Final publish triggers moderation/active status!
                    }),
                  });
                  if (!res.ok) throw new Error("Failed to publish listing");
                  router.push(`/ads/${draftAdId}`);
                  router.refresh();
                } catch (err: any) {
                  setError(err.message || "Failed to publish listing");
                } finally {
                  setIsDraftSaving(false);
                }
              }}
              className="flex-1 gap-2 font-bold"
              disabled={isDraftSaving}
            >
              {isDraftSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Listing 🚀"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
