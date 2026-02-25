import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    safeWord: v.string(),
    homeAddress: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  emergencyContacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    relationship: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  locationPings: defineTable({
    sessionId: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    timestamp: v.float64(),
  }).index("by_sessionId", ["sessionId"]),
});
