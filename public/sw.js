/* =========================================================
   MY DEBTS - PUSH NOTIFICATIONS SERVICE WORKER
========================================================= */

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "MY DEBTS",
      body: event.data ? event.data.text() : "Νέα ειδοποίηση",
    };
  }

  const title = data.title || "MY DEBTS";

  const options = {
    body: data.body || "Έχεις μια νέα ειδοποίηση.",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: {
      url: data.url || "/",
    },
    vibrate: [200, 100, 200],
    tag: data.tag || "my-debts-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }

        return null;
      }),
  );
});
