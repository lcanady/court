/**
 * Player game WebSocket — connects to engine WS (not admin hub).
 * Auth: { type: "auth", token }. Commands: { msg: "look" }.
 */
import { onUnmounted, ref, type Ref } from "vue";
import type { GameMessage } from "@/components/GameOutput.vue";
import { getToken } from "@/api/client";

export type GameSocketStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

/**
 * HTTPS → same-origin `/ws` (Caddy TLS → engine :4202).
 * HTTP local → direct `ws://host:wsPort`.
 */
function wsUrlFromConfig(wsPort: number): string {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  if (location.protocol === "https:") {
    return `${proto}//${location.host}/ws`;
  }
  const host = location.hostname;
  if (location.port && String(wsPort) === location.port) {
    return `${proto}//${location.host}/ws`;
  }
  return `${proto}//${host}:${wsPort}`;
}

async function resolveWsUrl(): Promise<string> {
  if (location.protocol === "https:") {
    return wsUrlFromConfig(4202);
  }
  try {
    const res = await fetch("/api/v1/config");
    if (res.ok) {
      const data = await res.json() as {
        server?: { ws?: number; wsPort?: number };
      };
      const port = Number(
        data.server?.wsPort ?? data.server?.ws ?? 4202,
      );
      if (Number.isFinite(port) && port > 0) {
        return wsUrlFromConfig(port);
      }
    }
  } catch {
    /* fall through */
  }
  return wsUrlFromConfig(4202);
}

export function useGameSocket(opts?: {
  maxMessages?: number;
}): {
  messages: Ref<GameMessage[]>;
  status: Ref<GameSocketStatus>;
  error: Ref<string>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendCmd: (line: string) => void;
} {
  const maxMessages = opts?.maxMessages ?? 500;
  const messages = ref<GameMessage[]>([]);
  const status = ref<GameSocketStatus>("idle");
  const error = ref("");
  let socket: WebSocket | null = null;

  function push(m: GameMessage): void {
    messages.value = [...messages.value, m].slice(-maxMessages);
  }

  function disconnect(): void {
    if (socket) {
      try {
        socket.close();
      } catch {
        /* ignore */
      }
      socket = null;
    }
    status.value = "closed";
  }

  async function connect(): Promise<void> {
    disconnect();
    error.value = "";
    const token = getToken();
    if (!token) {
      error.value = "Not signed in.";
      status.value = "error";
      return;
    }

    status.value = "connecting";
    const url = await resolveWsUrl();

    await new Promise<void>((resolve) => {
      try {
        socket = new WebSocket(url);
      } catch (e: unknown) {
        error.value = e instanceof Error
          ? e.message
          : "WebSocket failed";
        status.value = "error";
        resolve();
        return;
      }

      socket.onopen = () => {
        status.value = "open";
        socket?.send(
          JSON.stringify({ type: "auth", token }),
        );
        // Enter the world
        setTimeout(() => {
          socket?.send(JSON.stringify({ msg: "look" }));
        }, 200);
        resolve();
      };

      socket.onmessage = (ev) => {
        try {
          const payload = JSON.parse(String(ev.data)) as {
            msg?: string;
            data?: Record<string, unknown>;
          };
          if (
            payload.msg != null ||
            (payload.data && Object.keys(payload.data).length)
          ) {
            push({
              msg: payload.msg,
              data: payload.data,
              at: Date.now(),
            });
          }
        } catch {
          push({ msg: String(ev.data), at: Date.now() });
        }
      };

      socket.onerror = () => {
        error.value = "Connection error";
        status.value = "error";
        resolve();
      };

      socket.onclose = () => {
        status.value = "closed";
        socket = null;
        resolve();
      };
    });
  }

  function sendCmd(line: string): void {
    const t = line.trim();
    if (!t || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    // Echo local command quietly
    push({ msg: `%ch>%cn ${t}`, at: Date.now() });
    socket.send(JSON.stringify({ msg: t }));
  }

  onUnmounted(() => disconnect());

  return {
    messages,
    status,
    error,
    connect,
    disconnect,
    sendCmd,
  };
}
