"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminUserActions({
  userId,
  currentStatus,
  isSelf,
}: {
  userId: string;
  currentStatus: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleStatus = async () => {
    const targetStatus = currentStatus === "ACTIVE" ? "BANNED" : "ACTIVE";
    if (
      targetStatus === "BANNED" &&
      !confirm("Are you sure you want to ban this user? They will not be able to log in.")
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
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
      setLoading(false);
    }
  };

  if (isSelf) return null;

  return (
    <div className="flex justify-end gap-1">
      {currentStatus === "ACTIVE" ? (
        <Button
          onClick={handleToggleStatus}
          disabled={loading}
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Ban User"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <Button
          onClick={handleToggleStatus}
          disabled={loading}
          variant="ghost"
          size="icon"
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Activate User"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
