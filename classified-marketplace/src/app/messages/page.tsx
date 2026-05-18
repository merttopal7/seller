import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { MessageSquare, ChevronRight } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Messages" };

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getConversations(token: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  } catch {
    return [];
  }
}

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/messages");

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";
  const conversations = await getConversations(token);

  return (
    <>
      {/* Mobile: full conversation list */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </h1>
          {conversations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Contact a seller to start a conversation.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv: any) => {
                const lastMsg = conv.messages?.[0];
                const other = conv.otherUser;
                const adImage = conv.ad?.images?.[0]?.url;
                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                  >
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white font-bold text-sm">
                        {other?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                          {other?.name ?? "Unknown"}
                        </p>
                        {lastMsg && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatRelativeDate(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.ad && <p className="text-xs text-primary truncate">{conv.ad.title}</p>}
                      {lastMsg && (
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {lastMsg.senderId === session.id ? "You: " : ""}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                    {adImage && (
                      <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-muted">
                        <Image src={adImage} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop: empty state (sidebar handles the list) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <MessageSquare className="h-14 w-14 opacity-15" />
        <p className="text-sm">Select a conversation to start messaging</p>
      </div>
    </>
  );
}
