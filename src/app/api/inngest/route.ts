import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendRoundReminder } from "@/inngest/functions/round-reminder";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendRoundReminder],
});

