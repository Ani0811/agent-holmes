"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { InvestigationEvent } from "./api";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useInvestigationStream(caseId?: string) {
  const [events, setEvents] = useState<InvestigationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [phase, setPhase] = useState<string>("discovery");
  const [isSolved, setIsSolved] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalCloseRef = useRef(false);

  const connect = useCallback(() => {
    if (!caseId) return;

    try {
      isIntentionalCloseRef.current = false;
      const url = `${WS_BASE}/cases/${caseId}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Heartbeat ping every 15 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const payload: InvestigationEvent = JSON.parse(event.data);

          // Ignore pong heartbeats
          if ((payload as unknown as Record<string, unknown>).type === "pong") return;

          setEvents((prev) => {
            // Avoid duplicate events if replayed with matching IDs
            if (payload.id && prev.some((e) => e.id === payload.id)) {
              return prev;
            }
            return [...prev, payload];
          });

          // Track state transitions
          const phaseVal = (payload.data as Record<string, string> | null | undefined)?.phase;
          if (payload.event_type === "phase_change" && phaseVal) {
            setPhase(phaseVal);
          } else if (payload.event_type === "case_solved") {
            setIsSolved(true);
            setPhase("report");
          } else if (payload.event_type === "case_failed") {
            setIsSolved(false);
            setPhase("report");
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = () => {
        if (isIntentionalCloseRef.current) return;
        console.debug(`WebSocket stream disconnected for case ${caseId}`);
        setError("Live connection interrupted. Reconnecting or using snapshot polling.");
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    } catch (err: unknown) {
      if (!isIntentionalCloseRef.current) {
        setError(err instanceof Error ? err.message : "Failed to initiate WebSocket connection");
      }
    }
  }, [caseId]);

  useEffect(() => {
    connect();

    return () => {
      isIntentionalCloseRef.current = true;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onerror = null;
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    events,
    isConnected,
    phase,
    isSolved,
    error,
    reconnect: connect,
  };
}
