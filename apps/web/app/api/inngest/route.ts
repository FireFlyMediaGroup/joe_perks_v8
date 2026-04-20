import { inngestServeHandlers } from "@/lib/inngest/functions";

export const runtime = "nodejs";

export const { GET, POST, PUT } = inngestServeHandlers;
