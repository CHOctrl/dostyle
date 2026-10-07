import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const KEY = "outfit-chars";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json((await redis.hgetall(KEY)) || {});
    }
    if (req.method === "POST") {
      const { name, o } = req.body || {};
      if (typeof name !== "string" || !name.trim() || name.length > 60 || !o || typeof o !== "object")
        return res.status(400).json({ error: "bad request" });
      const clean = {};
      for (const k of ["skin", "hair", "top", "bottom", "shoes", "hat", "acc", "bg"])
        clean[k] = Math.max(0, Math.min(10, parseInt(o[k]) || 0));
      await redis.hset(KEY, { [name.trim()]: clean });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: "server error" });
  }
}
