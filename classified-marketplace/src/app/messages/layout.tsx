import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { HideFooter } from "./_components/hide-footer";
import { SidebarConversations } from "./_components/sidebar-conversations";
import { MessageSquare } from "lucide-react";

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

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";
  const conversations = session ? await getConversations(token) : [];

  return (
    <>
      <HideFooter />
      <div className="fixed inset-x-0 top-16 bottom-0 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-80 border-r border-border flex-col bg-background shrink-0">
          <SidebarConversations
            conversations={conversations}
            currentUserId={session?.id ?? ""}
          />
        </aside>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </>
  );
}
