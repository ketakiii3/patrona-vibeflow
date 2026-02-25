import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const upsertPing = mutation({
  args: {
    sessionId: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    timestamp: v.float64(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("locationPings")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        latitude: args.latitude,
        longitude: args.longitude,
        timestamp: args.timestamp,
      });
    } else {
      await ctx.db.insert("locationPings", {
        sessionId: args.sessionId,
        latitude: args.latitude,
        longitude: args.longitude,
        timestamp: args.timestamp,
      });
    }

    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const oldPings = await ctx.db
      .query("locationPings")
      .filter((q) => q.lt(q.field("timestamp"), twelveHoursAgo))
      .collect();
    for (const ping of oldPings) {
      await ctx.db.delete(ping._id);
    }
  },
});

export const getLocation = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const ping = await ctx.db
      .query("locationPings")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!ping) return null;

    return {
      latitude: ping.latitude,
      longitude: ping.longitude,
      timestamp: ping.timestamp,
    };
  },
});
