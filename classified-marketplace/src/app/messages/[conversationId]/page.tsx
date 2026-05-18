import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { ChatWindow } from "@/components/messages/chat-window";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ conversationId: string }>;
}

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function getConversationData(conversationId: string, token: string) {
  const res = await fetch(`${BACKEND_URL}/api/messages/${conversationId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 403 || res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conversationId } = await params;
  const session = await getSession();
  if (!session) return { title: "Messages" };
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";
  const data = await getConversationData(conversationId, token);
  const other = data?.conversation?.participants?.find(
    (p: any) => p.userId !== session.id
  )?.user;
  return { title: other ? `Chat with ${other.name}` : "Messages" };
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=/messages/${conversationId}`);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";
  const data = await getConversationData(conversationId, token);
  if (!data) notFound();

  const { conversation, messages } = data;
  const otherParticipant = conversation.participants.find(
    (p: any) => p.userId !== session.id
  );
  const otherUser = otherParticipant?.user ?? { id: "", name: "Unknown", avatar: null };

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border shrink-0">
        <Link href="/messages" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {otherUser.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherUser.name}</p>
          {conversation.ad && (
            <Link
              href={`/ads/${conversation.ad.id}`}
              className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
            >
              {conversation.ad.title}
              {conversation.ad.price && (
                <span className="font-semibold ml-1">
                  · {formatPrice(conversation.ad.price, conversation.ad.currency)}
                </span>
              )}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </Link>
          )}
        </div>

        {/* Ad thumbnail */}
        {conversation.ad?.images?.[0]?.url && (
          <Link href={`/ads/${conversation.ad.id}`} className="shrink-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
              <Image
                src={conversation.ad.images[0].url}
                alt={conversation.ad.title}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
          </Link>
        )}
      </div>

      {/* Chat window (client component handles real-time) */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          conversationId={conversationId}
          initialMessages={messages}
          currentUserId={session.id}
          otherUser={otherUser}
        />
      </div>
    </div>
  );
}
