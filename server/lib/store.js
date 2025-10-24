// store.js — simple in-memory store (fine for demos; replace with DB later)
import { nanoid } from "nanoid";

const tenants = new Map(); // siteKey -> { users: Map(userId -> profile), events: [] }

export function ensureTenant(siteKey) {
  if (!tenants.has(siteKey)) tenants.set(siteKey, { users: new Map(), events: [] });
  return tenants.get(siteKey);
}

export function putProfile(siteKey, userId, profile) {
  ensureTenant(siteKey).users.set(userId, profile);
}

export function getProfile(siteKey, userId) {
  return ensureTenant(siteKey).users.get(userId) || null;
}

export function pushEvent(siteKey, evt) {
  const t = ensureTenant(siteKey);
  const row = { id: nanoid(8), ts: Date.now(), ...evt };
  t.events.unshift(row);
  if (t.events.length > 5000) t.events.pop();
  return row;
}

export function listEvents(siteKey, limit = 100) {
  return ensureTenant(siteKey).events.slice(0, limit);
}
