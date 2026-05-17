"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminAdActions({
  adId,
  currentStatus,
}: {
  adId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "REJECTED") => {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete ad");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex justify-end gap-1">
      {currentStatus !== "ACTIVE" && (
        <Button
          onClick={() => handleUpdateStatus("ACTIVE")}
          disabled={!!loading}
          variant="ghost"
          size="icon"
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Approve Listing"
        >
          {loading === "ACTIVE" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      )}

      {currentStatus !== "REJECTED" && (
        <Button
          onClick={() => handleUpdateStatus("REJECTED")}
          disabled={!!loading}
          variant="ghost"
          size="icon"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          title="Reject Listing"
        >
          {loading === "REJECTED" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      )}

      <Button
        onClick={handleDelete}
        disabled={!!loading}
        variant="ghost"
        size="icon"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Delete Permanently"
      >
        {loading === "delete" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
