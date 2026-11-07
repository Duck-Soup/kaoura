// Καουροημερολόγιο - service worker: κρατά την εφαρμογή διαθέσιμη χωρίς ίντερνετ
var CACHE = "kaoura-v33";
var FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "fb.js", "badge-96.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE && k !== "kaoura-flags"; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Δίκτυο πρώτα (για να έρχονται οι ενημερώσεις), αλλιώς από την cache
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () {
    return caches.match(e.request, {ignoreSearch: true}).then(function (r) { return r || caches.match("index.html"); });
  }));
});

// Καθημερινή ειδοποίηση (έρχεται από τον αποστολέα μέσω Firebase)
self.addEventListener("push", function (e) {
  var p = {}; try { p = e.data ? e.data.json() : {}; } catch (x) {}
  var d = p.data || p;
  if (d.kind === "quote") {
    e.waitUntil(self.registration.showNotification(d.title || d.body || "", {
      body: d.title ? (d.body || "") : "", icon: "icon-192.png", badge: "badge-96.png", tag: "kaoura-quote", data: { kind: "quote" }
    }));
    return;
  }
  e.waitUntil(self.registration.showNotification(d.title || "Καουροημερολόγιο", {
    body: d.body || "Είχες καούρα σήμερα; Πάτα για να το σημειώσεις.",
    icon: "icon-192.png", badge: "badge-96.png", tag: "kaoura-daily", renotify: true,
    data: { day: d.day || "" },
    actions: [{ action: "yes", title: "Ναι, καταχώριση" }, { action: "no", title: "Όχι, καμία" }]
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  if ((e.notification.data || {}).kind === "quote") {
    var home = new URL("./", self.registration.scope).href;
    e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
      for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) return cs[i].focus(); }
      return clients.openWindow(home);
    }));
    return;
  }
  var day = (e.notification.data || {}).day;
  if (!day) { var n = new Date(); day = n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0"); }
  if (e.action === "no") {
    e.waitUntil(caches.open("kaoura-flags").then(function (c) { return c.put("flag/no/" + day, new Response("1")); }));
    return;
  }
  var url = new URL("./?today=1", self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ("navigate" in cs[i]) { return cs[i].navigate(url).then(function (c) { return c ? c.focus() : clients.openWindow(url); }).catch(function () { return clients.openWindow(url); }); } }
    return clients.openWindow(url);
  }));
});
