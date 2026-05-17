"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactSellerButtonProps {
  adId: string;
  sellerId: string;
}

export function ContactSellerButton({ adId, sellerId }: ContactSellerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, sellerId }),
      });
      if (!res.ok) throw new Error("Failed");
      const { conversationId } = await res.json();
      router.push(`/messages/${conversationId}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className="w-full gap-2"
      variant="outline"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      Send Message
    </Button>
  );
}
