import { supabase } from "./lib/supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function registerPushNotifications(userId) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Ο browser δεν υποστηρίζει Service Worker.");
  }

  if (!("PushManager" in window)) {
    throw new Error("Ο browser δεν υποστηρίζει Push Notifications.");
  }

  if (!("Notification" in window)) {
    throw new Error("Ο browser δεν υποστηρίζει Notifications.");
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Δεν έχει οριστεί το VITE_VAPID_PUBLIC_KEY.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Δεν δόθηκε άδεια για ειδοποιήσεις.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const subscriptionJson = subscription.toJSON();

  const endpoint = subscriptionJson.endpoint;

  const p256dh = subscriptionJson.keys?.p256dh;

  const auth = subscriptionJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Δεν ήταν δυνατή η λήψη των Push subscription keys.");
  }

  const { error } = await supabase.from("notification_subscriptions").upsert(
    {
      user_id: userId,
      endpoint,
      p256dh,
      auth,
    },
    {
      onConflict: "user_id,endpoint",
    },
  );

  if (error) {
    console.error("Subscription database error:", error);

    throw error;
  }

  return subscription;
}

export async function unregisterPushNotifications(userId) {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration("/sw.js");

  if (!registration) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;

  await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);

  await subscription.unsubscribe();
}
