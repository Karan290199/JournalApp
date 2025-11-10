/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { addEntry, queryEntries, JournalCategory } from "@/lib/journalMemory";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages || [];
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Invalid messages format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY)?.trim();
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable is not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const google = createGoogleGenerativeAI({
    apiKey: apiKey,
  });

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages,
      system: `
        You are a journaling assistant.
        - Add or recall journal entries.
        - When the user says "remind me..." or asks to set a reminder, automatically use the addJournalEntry tool with categories including "reminder" and then reply with a friendly confirmation like "Reminder set: [content]"
        - When the user mentions something they want to remember or note down, use addJournalEntry with categories including "note"
        - When the user mentions shopping items or things to buy, use addJournalEntry with categories including "shopping"
        - When the user asks to query, search, find, or recall journal entries (e.g., "what did I note about...", "show me reminders about...", "find entries about..."), automatically use the queryJournal tool with the topic they're asking about
        - Never perform unrelated tasks like math or trivia.
        - If the question is off-topic, reply:
          "I'm only a journaling app. I can't do that."
      `,
      tools: {
        addJournalEntry: {
          description:
            "Add a new entry to the journal. Use this when the user wants to set a reminder, save a note, or add shopping items. Provide all relevant categories (you can select multiple).",
          inputSchema: z.object({
            content: z.string(),
            categories: z
              .array(z.enum(Object.values(JournalCategory)))
              .min(1, "Select at least one category"),
          }),
          execute: async ({ content, categories }) => {
            addEntry(content, categories as JournalCategory[]);
            const joined = categories.join(", ");
            return `Added ${joined} entry: "${content}"`;
          },
        },
        queryJournal: {
          description: "Query journal entries by topic. Use this when the user asks to search, find, query, or recall journal entries. Extract the topic/keyword from their query.",
          inputSchema: z.object({ topic: z.string() }),
          execute: async ({ topic }) => {
            const matches = queryEntries(topic);
            if (!matches.length) return "No matching entries found.";
            return matches.map((e) => `• ${e.content}`).join("\n");
          },
        },
      },
    });

    const [assistantTextRaw, toolResults, responseMetadata] = await Promise.all([
      result.text,
      result.toolResults.catch(() => [] as unknown[]),
      result.response.catch(() => undefined),
    ]);

    let assistantText = assistantTextRaw?.trim()
      ? assistantTextRaw.trim()
      : Array.isArray(toolResults) && toolResults.length > 0
        ? toolResults
            .map((toolResult: any) => {
              const resultCandidate = (() => {
                if (typeof toolResult?.output === "string") return toolResult.output;
                if (Array.isArray(toolResult?.output)) {
                  return toolResult.output
                    .map((part: any) => {
                      if (typeof part === "string") return part;
                      if (typeof part?.text === "string") return part.text;
                      return "";
                    })
                    .filter(Boolean)
                    .join(" ");
                }
                if (toolResult?.output?.text) return String(toolResult.output.text);
                if (toolResult?.output?.content) return String(toolResult.output.content);

                if (typeof toolResult?.result === "string") return toolResult.result;
                if (toolResult?.result?.text) return String(toolResult.result.text);
                if (toolResult?.result?.content) return String(toolResult.result.content);

                return JSON.stringify(toolResult?.output ?? toolResult?.result ?? "");
              })();

              return resultCandidate;
            })
            .filter((value: string | undefined) => Boolean(value && value.trim()))
            .join("\n") || ""
        : "";

    if (!assistantText && responseMetadata?.messages) {
      const assistantMessages = responseMetadata.messages.filter((msg: any) => msg.role === "assistant");
      const candidate = assistantMessages
        .map((msg: any) => {
          if (typeof msg?.content === "string") return msg.content;
          if (Array.isArray(msg?.content)) {
            return msg.content
              .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
              .join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join("\n")
        .trim();

      if (candidate) {
        assistantText = candidate;
      }
    }

    if (!assistantText) {
      console.warn("Assistant produced no text output.");
      assistantText = "I'm sorry, I couldn't find anything to share right now.";
    }

    return new Response(assistantText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Error in streamText:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate response", 
        details: error?.message || String(error) 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}
