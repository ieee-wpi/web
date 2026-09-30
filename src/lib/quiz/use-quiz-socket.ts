"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage } from "../../../game-server/protocol";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "offline";

// Dev: NEXT_PUBLIC_QUIZ_WS_URL=ws://localhost:9001. Production: Apache
// proxies /quiz-ws/ on the same host to the game server.
export function quizWsUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_QUIZ_WS_URL;
  if (fromEnv) return fromEnv.replace(/\/?$/, "/");
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/quiz-ws/`;
}

export function quizHttpUrl(path: string) {
  return quizWsUrl().replace(/^ws/, "http") + path.replace(/^\//, "");
}

type Options = {
  onMessage: (msg: ServerMessage) => void;
  // Called on every (re)connect, so the caller can re-send its resume message.
  onOpen?: (send: (msg: ClientMessage) => void) => void;
};

// One WebSocket with automatic reconnect. Phones drop sockets whenever the
// screen locks, so reconnect immediately when the page becomes visible or the
// network comes back, and otherwise back off from 0.5s up to 8s.
export function useQuizSocket({ onMessage, onOpen }: Options) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const handlers = useRef({ onMessage, onOpen });
  handlers.current = { onMessage, onOpen };

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    let disposed = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (disposed) return;
      clearTimeout(retryTimer);
      const ws = new WebSocket(quizWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setStatus("open");
        handlers.current.onOpen?.(send);
      };
      ws.onmessage = (e) => {
        try {
          handlers.current.onMessage(JSON.parse(e.data as string) as ServerMessage);
        } catch (err) {
          console.error("quiz: bad message", err);
        }
      };
      ws.onclose = () => {
        if (disposed || wsRef.current !== ws) return;
        wsRef.current = null;
        attempt++;
        setStatus(attempt > 6 ? "offline" : "reconnecting");
        const delay = Math.min(8000, 500 * 2 ** (attempt - 1)) * (0.75 + Math.random() * 0.5);
        retryTimer = setTimeout(connect, delay);
      };
    };

    const reconnectNow = () => {
      if (disposed) return;
      const ws = wsRef.current;
      if (document.visibilityState === "visible" && (!ws || ws.readyState === WebSocket.CLOSED)) {
        attempt = 0;
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", reconnectNow);
    window.addEventListener("online", reconnectNow);
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", reconnectNow);
      window.removeEventListener("online", reconnectNow);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [send]);

  return { status, send };
}

// Keep the phone screen on during a game (Android Chrome, iOS 16.4+). The
// lock is released whenever the tab is hidden, so re-acquire on return.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock?.release();
      } catch {
        // Denied (battery saver, unsupported). The reconnect logic covers it.
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release();
    };
  }, [active]);
}

// Counts down to a deadline measured on this device's clock. The server sends
// a remaining duration, not a timestamp, so device clock skew never matters.
export function useCountdown(deadline: number | null) {
  const [remaining, setRemaining] = useState(() => (deadline ? Math.max(0, deadline - performance.now()) : 0));
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setRemaining(Math.max(0, deadline - performance.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}
