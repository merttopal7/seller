"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatRelativeDate } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null };
}

interface ChatWindowProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherUser: { id: string; name: string; avatar: string | null };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function ChatWindow({
  conversationId,
  initialMessages,
  currentUserId,
  otherUser,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect socket
  useEffect(() => {
    let mounted = true;

    async function connect() {
      const res = await fetch("/api/auth/token");
      if (!res.ok) return;
      const { token } = await res.json();
      if (!token || !mounted) return;

      const socket = io(BACKEND_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        if (!mounted) return;
        setConnected(true);
        socket.emit("join_conversation", conversationId);
        socket.emit("mark_read", conversationId);
      });

      socket.on("disconnect", () => mounted && setConnected(false));

      socket.on("new_message", (msg: Message) => {
        if (!mounted) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mark as read if it's from the other user
        if (msg.senderId !== currentUserId) {
          socket.emit("mark_read", conversationId);
        }
      });

      socket.on("user_typing", ({ name }: { userId: string; name: string }) => {
        if (!mounted) return;
        setTypingUser(name);
      });

      socket.on("user_stopped_typing", () => {
        if (!mounted) return;
        setTypingUser(null);
      });

      socketRef.current = socket;
    }

    connect();

    return () => {
      mounted = false;
      socketRef.current?.emit("leave_conversation", conversationId);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("typing_start", conversationId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing_stop", conversationId);
    }, 1500);
  }, [conversationId]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || !socketRef.current) return;

    setSending(true);
    setInput("");

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketRef.current.emit("typing_stop", conversationId);

    socketRef.current.emit(
      "send_message",
      { conversationId, content },
      (result: { error?: string; message?: Message }) => {
        setSending(false);
        if (result?.error) {
          setInput(content); // restore on error
        }
      }
    );
  }, [input, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}
            >
              {!isMe && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
                  {msg.sender.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                <p className="leading-relaxed break-words">{msg.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    isMe ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
                  )}
                >
                  {formatRelativeDate(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUser && (
          <div className="flex gap-2 items-center">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {typingUser.charAt(0).toUpperCase()}
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border p-3 flex gap-2 items-center">
        <Input
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 h-10"
          disabled={sending}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!connected && (
        <p className="text-[11px] text-center text-amber-600 pb-1">
          Reconnecting…
        </p>
      )}
    </div>
  );
}
