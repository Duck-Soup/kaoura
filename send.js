// Καουροημερολόγιο - στέλνει την καθημερινή ειδοποίηση.
// Τρέχει αυτόματα από το GitHub Actions κάθε 30 λεπτά.
const { quoteFor } = require("./phrases.js");
const MESSAGES = [
  { title: "Είχες καούρα σήμερα;", body: "Πάτα για να το σημειώσεις στο ημερολόγιο." },
  { title: "Μην ξεχάσεις το ημερολόγιο", body: "Πώς ήταν η μέρα σου σήμερα;" }
];

function localNow(tz, now) {
  const parts = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(now).forEach(p => { parts[p.type] = p.value; });
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hm: `${parts.hour}:${parts.minute}` };
}

async function run({ db, messaging, FieldPath, now = new Date(), force = false, log = console.log }) {
  const users = await db.collection("users").listDocuments();
  let sent = 0;
  for (const u of users) {
    const pref = u.collection("meta").doc("push");
    const ps = await pref.get();
    if (!ps.exists) continue;
    const p = ps.data();
    const tokens = Object.keys(p.tokens || {});
    if (!tokens.length) continue;
    let tz = p.tz || "Europe/Athens";
    try { localNow(tz, now); } catch (e) { tz = "Europe/Athens"; }
    const { day, hm } = localNow(tz, now);
    let us = null;
    const userDoc = async () => (us = us || await u.get());

    // --- Πρωί: η φράση της ημέρας ---
    if (force || (hm >= "08:00" && p.mSentDay !== day)) {
      const ud = await userDoc();
      const name = (ud.exists && ud.data().cfg && ud.data().cfg.name) || "";
      const body = quoteFor(name, day);
      sent += await sendAll(messaging, pref, FieldPath, tokens, { kind: "quote", body, day }, log, u.id);
      if (!force) await pref.set({ mSentDay: day }, { merge: true });
      log(`${u.id}: φράση ημέρας (${hm} ${tz})`);
    }

    // --- Βράδυ: «Είχες καούρα σήμερα;» ---
    if (!p.on) continue;
    if (!force) {
      if (hm < (p.time || "21:00")) continue;
      if (p.sentDay === day) continue;
      const ud = await userDoc();
      let logged = false;
      try { logged = !!JSON.parse((ud.exists && ud.data().data) || "{}")[day]; } catch (e) {}
      if (logged) { await pref.set({ sentDay: day }, { merge: true }); log(`${u.id}: έχει ήδη καταχωρίσει σήμερα`); continue; }
    }
    const dayNum = Math.floor(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / 864e5);
    const m = MESSAGES[dayNum % MESSAGES.length];
    sent += await sendAll(messaging, pref, FieldPath, tokens, { title: m.title, body: m.body, day }, log, u.id);
    if (!force) await pref.set({ sentDay: day }, { merge: true });
    log(`${u.id}: βραδινή υπενθύμιση (${hm} ${tz})`);
  }
  log(`Σύνολο ειδοποιήσεων: ${sent}`);
  return sent;
}
async function sendAll(messaging, pref, FieldPath, tokens, data, log, uid) {
  let n = 0;
  for (const t of tokens) {
    try {
      await messaging.send({ token: t, data, webpush: { headers: { Urgency: "high", TTL: "14400" } } });
      n++;
    } catch (e) {
      const code = (e && (e.code || (e.errorInfo && e.errorInfo.code))) || "";
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) {
        await pref.update(new FieldPath("tokens", t), require_delete());
        log(`${uid}: αφαιρέθηκε παλιό κινητό`);
      } else log(`${uid}: σφάλμα αποστολής ${code}`);
    }
  }
  return n;
}
let require_delete = () => null;
module.exports = { run, localNow, setDelete: f => { require_delete = f; } };

if (require.main === module) {
  const admin = require("firebase-admin");
  const { getFirestore, FieldPath, FieldValue } = require("firebase-admin/firestore");
  const { getMessaging } = require("firebase-admin/messaging");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
  require_delete = () => FieldValue.delete();
  run({ db: getFirestore(), messaging: getMessaging(), FieldPath, force: process.env.FORCE === "true" })
    .then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
