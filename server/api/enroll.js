// server/api/enroll.js — CORS-wrapped
import { extractFeatures, mergeProfile } from "../lib/model.js";
import { getProfile, putProfile, pushEvent } from "../lib/store.js";
import { withCORS } from "./_cors.js";

async function parseJSON(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function core(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  try {
    const { siteKey, userId, events } = await parseJSON(req);
    if (!siteKey || !userId || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "bad_input" });
    }

    const sample = extractFeatures(events);
    const existing = getProfile(siteKey, userId);
    const profile = mergeProfile(existing, sample);
    putProfile(siteKey, userId, profile);

    pushEvent(siteKey, { type: "enroll", userId, score: 1, meta: { sample: sample.n } });

    return res.json({ ok: true, profile: { vec: profile.vec, n: profile.n } });
  } catch (e) {
    console.error("Enroll API Error:", e);
    res.status(500).json({ error: "server" });
  }
}

export default withCORS(core);
