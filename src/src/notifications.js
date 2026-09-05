/* =========================================================
   MY DEBTS - PUSH NOTIFICATIONS
========================================================= */

import { supabase } from "./lib/supabaseClient";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/* ---------------------------------------------------------
   REGISTER SERVICE WORKER
--------------------------------------------------------- */

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Το συγκεκριμένο browser δεν υποστηρίζει Service Worker.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
  });

  await navigator.serviceWorker.ready;

  return registration;
}

/* ---------------------------------------------------------
   REQUEST NOTIFICATION PERMISSION
--------------------------------------------------------- */

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Το συγκεκριμένο browser δεν υποστηρίζει notifications.");
  }

  const permission = await Notification.requestPermission();

  return permission;
}

/* ---------------------------------------------------------
   SUBSCRIBE DEVICE TO PUSH
--------------------------------------------------------- */

export async function subscribeToPush(session) {
  if (!session?.user?.id) {
    throw new Error("Δεν υπάρχει συνδεδεμένος χρήστης.");
  }

  if (!("PushManager" in window)) {
    throw new Error(
      "Το συγκεκριμένο browser δεν υποστηρίζει Push Notifications.",
    );
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    throw new Error("Λείπει το VITE_VAPID_PUBLIC_KEY από το environment.");
  }

  /* Register Service Worker */
  const registration = await registerServiceWorker();

  /* Request permission */
  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    throw new Error("Η άδεια για notifications δεν δόθηκε.");
  }

  /* Existing subscription */
  let subscription = await registration.pushManager.getSubscription();

  /* Create new subscription */
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const subscriptionJSON = subscription.toJSON();

  if (
    !subscriptionJSON.endpoint ||
    !subscriptionJSON.keys?.p256dh ||
    !subscriptionJSON.keys?.auth
  ) {
    throw new Error("Μη έγκυρο Push Subscription.");
  }

  /* Save subscription in Supabase */
  const { error } = await supabase.from("notification_subscriptions").upsert(
    {
      user_id: session.user.id,
      endpoint: subscriptionJSON.endpoint,
      p256dh: subscriptionJSON.keys.p256dh,
      auth: subscriptionJSON.keys.auth,
    },
    {
      onConflict: "user_id,endpoint",
    },
  );

  if (error) {
    console.error("Notification subscription error:", error);

    throw error;
  }

  return subscription;
}

/* ---------------------------------------------------------
   UNSUBSCRIBE DEVICE
--------------------------------------------------------- */

export async function unsubscribeFromPush(session) {
  if (!session?.user?.id) {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration("/");

  if (!registration) {
    return;
  }

  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const endpoint = subscription.endpoint;

  await subscription.unsubscribe();

  const { error } = await supabase
    .from("notification_subscriptions")
    .delete()
    .eq("user_id", session.user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Notification unsubscribe error:", error);
  }
}

/* ---------------------------------------------------------
   SAVE NOTIFICATION SETTINGS
--------------------------------------------------------- */

export async function saveNotificationSettings(session, enabled, daysBefore) {
  if (!session?.user?.id) {
    throw new Error("Δεν υπάρχει συνδεδεμένος χρήστης.");
  }

  const { error } = await supabase.from("notification_settings").upsert(
    {
      user_id: session.user.id,
      enabled,
      days_before: Number(daysBefore),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    console.error("Notification settings error:", error);

    throw error;
  }
}

/* ---------------------------------------------------------
   LOAD NOTIFICATION SETTINGS
--------------------------------------------------------- */

export async function loadNotificationSettings(session) {
  if (!session?.user?.id) {
    return {
      enabled: false,
      days_before: 3,
    };
  }

  const { data, error } = await supabase
    .from("notification_settings")
    .select("enabled, days_before")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("Load notification settings error:", error);

    throw error;
  }

  return (
    data || {
      enabled: false,
      days_before: 3,
    }
  );
}
