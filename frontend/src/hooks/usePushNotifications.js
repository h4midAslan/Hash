import { useEffect } from "react";
import api from "../api/client";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem("push_subscribed")) return;

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const reg = await navigator.serviceWorker.ready;
        const { data } = await api.get("/push/vapid-public-key");
        const applicationServerKey = urlBase64ToUint8Array(data.public_key);

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const keys = sub.toJSON().keys;
        await api.post("/push/subscribe", {
          endpoint: sub.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });

        localStorage.setItem("push_subscribed", "1");
      } catch {}
    };

    setup();
  }, []);
}
