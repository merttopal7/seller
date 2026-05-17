"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, placeholder = "Upload category banner or thumbnail image", className = "" }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick size validation (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload image");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Something went wrong during upload");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to upload image");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      console.error("Drop upload error:", err);
      setError(err.message || "Failed to process image upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {value ? (
        // Preview State
        <div className="relative aspect-[3/1] w-full rounded-2xl overflow-hidden border border-border shadow-sm group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded Category Thumbnail"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange("")}
              className="flex items-center gap-1.5 font-bold"
            >
              <X className="h-4 w-4" /> Remove Image
            </Button>
          </div>
        </div>
      ) : (
        // Upload Zone State
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/50 bg-card hover:bg-muted/30 transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[140px] select-none"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {loading ? (
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
                  {placeholder}
                </span>
                <span className="text-xs text-muted-foreground mt-1 block">
                  Drag & drop or click to browse (Max 5MB - compressed automatically)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-destructive mt-1 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
