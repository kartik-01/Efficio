// Lightweight SSE client for dashboard-app-shell
// Exposes initialize, connect and disconnect functions.
const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/+$/,'');

let tokenGetter: (() => Promise<string | undefined>) | null = null;
let es: EventSource | null = null;
let reconnectTimer: number | null = null;

export function initializeEventsApi(getToken: () => Promise<string | undefined>) {
  tokenGetter = getToken;
}

function getStreamUrl(): string {
  // Handle API_BASE_URL that might already include /api
  const base = API_BASE_URL;
  const hasApi = base.endsWith('/api');
  return hasApi ? `${base}/events/stream` : `${base}/api/events/stream`;
}

export async function connectEvents() {
  if (!tokenGetter) {
    console.warn('eventsApi: not initialized');
    return;
  }

  try {
    const token = await tokenGetter();
    if (!token) {
      console.warn('eventsApi: no token available, skipping EventSource connect');
      return;
    }

    const url = `${getStreamUrl()}?token=${encodeURIComponent(token)}`;

    if (es) {
      try { es.close(); } catch (e) { /* ignore */ }
      es = null;
    }

    es = new EventSource(url);

    es.onopen = () => {
      console.debug('[eventsApi] connected to SSE stream');
      try {
        window.dispatchEvent(new CustomEvent('sse:connected', { detail: { connected: true } }));
      } catch (e) {
        // ignore if CustomEvent isn't supported in some envs
      }
    };

    es.onerror = (err) => {
      console.warn('[eventsApi] EventSource error, will attempt reconnect in 3s', err);
      try {
        window.dispatchEvent(new CustomEvent('sse:disconnected', { detail: { error: String(err) } }));
      } catch (e) {}
      try { es?.close(); } catch (e) {}
      es = null;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectEvents();
      }, 3000);
    };

    // Named events from server - forward as CustomEvents on window with prefix 'sse:'
    const forward = (evName: string) => {
      es?.addEventListener(evName, (ev: MessageEvent) => {
        try {
          const payload = ev.data ? JSON.parse(ev.data) : undefined;
          console.debug(`[eventsApi] received ${evName}`, payload);
          window.dispatchEvent(new CustomEvent(`sse:${evName}`, { detail: payload }));
        } catch (err) {
          console.warn('[eventsApi] failed to parse SSE payload', err);
        }
      });
    };

    forward('notification');
    forward('notification_removed');
    forward('task_updated');
    forward('task_deleted');
    forward('activity');

    // Fallback plain messages
    es.onmessage = (ev) => {
      try {
        const payload = ev.data ? JSON.parse(ev.data) : undefined;
        console.debug('[eventsApi] onmessage', payload);
        window.dispatchEvent(new CustomEvent('sse:message', { detail: payload }));
      } catch (err) {
        console.warn('[eventsApi] failed to parse onmessage payload', err);
      }
    };

  } catch (err) {
    console.error('[eventsApi] connect failed', err);
  }
}

export function disconnectEvents() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (es) {
    try { es.close(); } catch (e) {}
    es = null;
  }
  try {
    window.dispatchEvent(new CustomEvent('sse:disconnected', { detail: { manual: true } }));
  } catch (e) {}
}

export function isEventsApiReady(): boolean {
  return tokenGetter !== null;
}

export default {
  initialize: initializeEventsApi,
  connect: connectEvents,
  disconnect: disconnectEvents,
  isReady: isEventsApiReady,
};
