import { serve } from "inngest/next";
import { inngest, processImportJob } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processImportJob],
});
