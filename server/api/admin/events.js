import { listEvents } from "../../lib/store.js";

export default async function handler(req, res) {
  const token = req.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const siteKey = req.query.siteKey || "default";
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || "100", 10)));
  const rows = listEvents(siteKey, limit);
  res.json({ ok: true, events: rows });
}
