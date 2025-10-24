import { extractFeatures, compareProfiles } from "../../lib/model.js";
import { getProfile, pushEvent } from "../../lib/store.js";

const DEFAULT_THRESHOLD = 0.75;

async function parseJSON(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  try {
    const { siteKey, userId, events, threshold } = await parseJSON(req);
    if (!siteKey || !userId || !Array.isArray(events))
      return res.status(400).json({ error: "bad_input" });

    const profile = getProfile(siteKey, userId);
    if (!profile) return res.status(404).json({ error: "no_profile" });

    const sample = extractFeatures(events);
    const cmp = compareProfiles(profile, sample);
    const th = typeof threshold === "number" ? threshold : DEFAULT_THRESHOLD;
    const verified = cmp.score >= th;

    pushEvent(siteKey, {
      type: "verify",
      userId,
      score: cmp.score,
      meta: { similarity: cmp.similarity, coverage: cmp.coverage },
    });

    return res.json({
      ok: true,
      verified,
      score: cmp.score,
      similarity: cmp.similarity,
      coverage: cmp.coverage,
      usedThreshold: th,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server" });
  }
}
