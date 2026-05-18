"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  ad?: { title: string; images?: { url: string }[] };
  otherUser?: { id: string; name: string; avatar: string | null } | null;
  messages?: { id: string; content: string; senderId: string; createdAt: string }[];
  unreadCount: number;
}

export function SidebarConversations({
  conversations,
  currentUserId,
}: {
  conversations: Conversation[];
  currentUserId: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Messages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-10 px-4">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname === `/messages/${conv.id}`;
            const lastMsg = conv.messages?.[0];
            const other = conv.otherUser;
            const adImage = conv.ad?.images?.[0]?.url;

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 hover:bg-muted/60 transition-colors border-b border-border/40",
                  isActive && "bg-muted"
                )}
              >
                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white font-bold text-sm">
                    {other?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {other?.name ?? "Unknown"}
                    </p>
                    {lastMsg && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeDate(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.ad && (
                    <p className="text-[11px] text-primary truncate">{conv.ad.title}</p>
                  )}
                  {lastMsg && (
                    <p className={cn("text-xs truncate mt-0.5", conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {lastMsg.senderId === currentUserId ? "You: " : ""}
                      {lastMsg.content}
                    </p>
                  )}
                </div>
                {adImage && (
                  <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted">
                    <Image src={adImage} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
