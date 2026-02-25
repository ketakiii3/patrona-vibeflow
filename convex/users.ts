import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkId = identity.subject;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) return null;

    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      name: user.name,
      homeAddress: user.homeAddress ?? "",
      safeWord: user.safeWord,
      emergencyContacts: contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship ?? "",
      })),
    };
  },
});

export const saveUser = mutation({
  args: {
    name: v.string(),
    homeAddress: v.optional(v.string()),
    safeWord: v.string(),
    emergencyContacts: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        relationship: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    let userId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        homeAddress: args.homeAddress ?? "",
        safeWord: args.safeWord,
      });
      userId = existing._id;

      const oldContacts = await ctx.db
        .query("emergencyContacts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const c of oldContacts) {
        await ctx.db.delete(c._id);
      }
    } else {
      userId = await ctx.db.insert("users", {
        clerkId,
        name: args.name,
        homeAddress: args.homeAddress ?? "",
        safeWord: args.safeWord,
      });
    }

    for (const contact of args.emergencyContacts) {
      await ctx.db.insert("emergencyContacts", {
        userId,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship ?? "",
      });
    }
  },
});
