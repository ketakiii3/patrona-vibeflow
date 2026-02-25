import { v } from "convex/values";
import { action } from "./_generated/server";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "Patrona Safety App" } }
    );
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function sendSMS(phone: string, message: string, textbeltKey: string) {
  if (!textbeltKey) {
    console.log(`[SMS mock] To ${phone}: ${message}`);
    return { ok: true, mock: true };
  }

  const res = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message, key: textbeltKey }),
  });
  return res.json();
}

export const sendEmergencyAlert = action({
  args: {
    userName: v.string(),
    contacts: v.array(
      v.object({
        name: v.string(),
        phone: v.string(),
        relationship: v.optional(v.string()),
      })
    ),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    triggerType: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const textbeltKey = process.env.TEXTBELT_KEY ?? "";
    const frontendUrl = process.env.FRONTEND_URL ?? "https://patrona.vercel.app";

    let locationStr = "Location unavailable";
    let mapsUrl = "";

    if (args.latitude != null && args.longitude != null) {
      locationStr = await reverseGeocode(args.latitude, args.longitude);
      mapsUrl = `https://www.google.com/maps?q=${args.latitude},${args.longitude}`;
    }

    const trackingUrl =
      args.latitude != null && args.longitude != null
        ? `${frontendUrl}/track?lat=${args.latitude}&lng=${args.longitude}&name=${encodeURIComponent(args.userName)}&ts=${Date.now()}`
        : "";

    const results = [];
    for (const contact of args.contacts) {
      let message = `Patrona Alert: ${args.userName} may need help. `;
      message += `Trigger: ${args.triggerType}. `;
      message += `Location: ${locationStr}`;
      if (mapsUrl) message += ` ${mapsUrl}`;
      if (trackingUrl) message += ` Track: ${trackingUrl}`;

      const result = await sendSMS(contact.phone, message, textbeltKey);
      results.push({ phone: contact.phone, ...result });
    }

    return { success: true, results };
  },
});

export const sendAllClear = action({
  args: {
    userName: v.string(),
    contacts: v.array(
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

    const textbeltKey = process.env.TEXTBELT_KEY ?? "";
    const results = [];

    for (const contact of args.contacts) {
      const message = `Patrona Update: ${args.userName} has confirmed they are safe. No further action needed.`;
      const result = await sendSMS(contact.phone, message, textbeltKey);
      results.push({ phone: contact.phone, ...result });
    }

    return { success: true, results };
  },
});
