"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

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

      socket.on("connect", () => mounted && setConnected(true));
      socket.on("disconnect", () => mounted && setConnected(false));

      socketRef.current = socket;
    }

    connect();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, connected };
}
