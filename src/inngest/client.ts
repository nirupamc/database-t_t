// Lightweight fallback Inngest client to avoid import errors in environments
// where the real Inngest SDK is not configured. Replace with actual client when available.
export const inngest = {
  async send(event: { name: string; data?: Record<string, unknown>; ts?: number }) {
    console.log("[Inngest] send called (stub)", event);
    return { ids: [] as string[] };
  },
};
