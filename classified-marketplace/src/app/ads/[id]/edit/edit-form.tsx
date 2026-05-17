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

interface ImageType {
  url: string;
}

interface AdWithImages {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  city: string;
  country?: string;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  categoryId: string;
  images: ImageType[];
  customValues?: Record<string, string>;
}

export function EditAdForm({
  ad,
  categories,
}: {
  ad: AdWithImages;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>(ad.images.map((i) => i.url));
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(ad.categoryId);
  const [customValues, setCustomValues] = useState<Record<string, string>>(ad.customValues || {});
  const [descriptionHtml, setDescriptionHtml] = useState(ad.description || "");
 
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedCountryName, setSelectedCountryName] = useState(ad.country || "Burkina Faso");
  const [selectedStateName, setSelectedStateName] = useState(ad.state || "");
  const [selectedCityName, setSelectedCityName] = useState(ad.city || "");
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    ad.latitude && ad.longitude ? [ad.latitude, ad.longitude] : [12.3714, -1.5197]
  );
  const [selectedMapCoords, setSelectedMapCoords] = useState<[number, number] | null>(
    ad.latitude && ad.longitude ? [ad.latitude, ad.longitude] : null
  );

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.countries) {
          setLocations(data.countries);
        }
      })
      .catch((err) => console.error("Error loading locations:", err));
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdInput>({
    resolver: zodResolver(adSchema) as any,
    defaultValues: {
      title: ad.title,
      description: ad.description,
      price: ad.price,
      currency: ad.currency,
      location: ad.location,
      city: ad.city,
      country: ad.country || "Burkina Faso",
      latitude: ad.latitude,
      longitude: ad.longitude,
      categoryId: ad.categoryId,
    },
  });

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdInput) => {
    setError("");

    try {
      const payload = {
        ...data,
        description: descriptionHtml || data.description,
        images: images.length > 0 ? images : [`https://picsum.photos/seed/${ad.id}/800/600`],
        customValues,
      };

      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to update ad");
        return;
      }

      router.push(`/ads/${ad.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Ad Title</Label>
        <Input
          id="title"
          placeholder="e.g. iPhone 15 Pro Max"
          {...register("title")}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          {...register("categoryId")}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setValue("categoryId", e.target.value, { shouldValidate: true });
            // If they switch back to initial category, restore initial values, otherwise clear
            if (e.target.value === ad.categoryId) {
              setCustomValues(ad.customValues || {});
            } else {
              setCustomValues({});
            }
          }}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Category Custom Filters Specs */}
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

      {/* Price */}
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

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                
                // Reset city and neighborhood
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

        {/* City Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          {locations.length > 0 && selectedCountryName ? (
            (() => {
              const countryObj = locations.find((c) => c.name === selectedCountryName);
              const cities = countryObj?.cities || [];
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
              disabled={locations.length > 0 && !selectedCountryName}
            />
          )}
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        {/* Neighborhood Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="location">Area / Neighborhood</Label>
          {locations.length > 0 && selectedCountryName && selectedCityName ? (
            (() => {
              const countryObj = locations.find((c) => c.name === selectedCountryName);
              const cityObj = countryObj?.cities?.find((c: any) => c.name === selectedCityName);
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

      {/* Map Location */}
      <div className="space-y-1.5 z-0">
        <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Pin Exact Location (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">Click on the map to set the precise location. If you don't pick one, the center of the selected neighborhood will be used.</p>
        <MapPicker 
          center={mapCenter} 
          selectedLocation={selectedMapCoords}
          onLocationSelect={(lat, lng) => {
            setSelectedMapCoords([lat, lng]);
            setValue("latitude", lat, { shouldValidate: true });
            setValue("longitude", lng, { shouldValidate: true });
          }} 
        />
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
          placeholder="Detailed description..."
          error={!!errors.description}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Images */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Images Gallery</Label>
        
        {/* Visual Dropzone Area */}
        <div
          onClick={() => document.getElementById("ad-edit-file-upload")?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/30 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px] select-none"
        >
          <input
            type="file"
            id="ad-edit-file-upload"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              
              setIsUploading(true);
              try {
                // Upload all selected files concurrently!
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
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <Trash className="h-5 w-5 text-white hover:text-red-400 transition-colors" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1 gap-2" variant="gradient" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save Changes"
          )}
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" onClick={() => router.back()} variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
