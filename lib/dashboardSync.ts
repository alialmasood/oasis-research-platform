export type DashboardUpdatePayload = {
  type?: string;
  reason?: string;
  ts?: number;
};

const DASHBOARD_SYNC_CHANNEL = "dashboard-sync";

export function notifyDashboardUpdate(reason?: string) {
  if (typeof window === "undefined") return;
  const payload: DashboardUpdatePayload = {
    type: "dashboard:update",
    reason,
    ts: Date.now(),
  };

  try {
    const channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch (_) {
    // BroadcastChannel قد لا يكون متاحًا في بعض البيئات
  }

  window.dispatchEvent(new CustomEvent("dashboard:update", { detail: payload }));
}

export function onDashboardUpdate(handler: (payload?: DashboardUpdatePayload) => void) {
  if (typeof window === "undefined") return () => undefined;

  let channel: BroadcastChannel | null = null;
  const handleMessage = (event: MessageEvent) => handler(event.data as DashboardUpdatePayload);
  const handleDom = (event: Event) => handler((event as CustomEvent).detail as DashboardUpdatePayload);

  try {
    channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
    channel.addEventListener("message", handleMessage);
  } catch (_) {
    // تجاهل
  }

  window.addEventListener("dashboard:update", handleDom);

  return () => {
    if (channel) {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    }
    window.removeEventListener("dashboard:update", handleDom);
  };
}
