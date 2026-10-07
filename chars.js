import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "outfit-chars";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!url || !token) return res.status(500).json({ error: "no-redis" });
  const redis = new Redis({ url, token });
  try {
    if (req.method === "GET") {
      return res.status(200).json((await redis.hgetall(KEY)) || {});
    }
    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const { name, o } = body || {};
      if (typeof name !== "string" || !name.trim() || name.length > 60 || !o || typeof o !== "object")
        return res.status(400).json({ error: "bad request" });
      const clean = {};
      for (const k of ["skin", "hair", "top", "bottom", "shoes", "hat", "acc", "bg"])
        clean[k] = Math.max(0, Math.min(10, parseInt(o[k]) || 0));
      await redis.hset(KEY, { [name.trim()]: clean });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
}
