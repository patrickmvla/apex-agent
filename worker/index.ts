import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";

type Bindings = {
  GEMINI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_HOST: string;
  APEX_LEGENDS_API_KEY: string;
};

type ChatHistoryItem = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type PineconeQueryResponse = {
  matches: Array<{
    id: string;
    score: number;
    metadata?: {
      text?: string;
      pageTitle?: string;
      sectionTitle?: string;
      source?: string;
    };
  }>;
};

const app = new Hono<{ Bindings: Bindings }>();

async function createEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });

  const embedding = result.embeddings?.[0]?.values;

  if (!embedding) {
    console.error("Embedding creation failed. API response:", result);
    throw new Error("Failed to create embedding for the provided text.");
  }

  return embedding;
}

const api = new Hono<{ Bindings: Bindings }>();

api.post("/chat", async (c) => {
  try {
    const { message, history = [] } = await c.req.json<{
      message: string;
      history?: ChatHistoryItem[];
    }>();
    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    const queryResponse = await fetch(`${c.env.PINECONE_HOST}/query`, {
      method: "POST",
      headers: {
        "Api-Key": c.env.PINECONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector: await createEmbedding(message, c.env.GEMINI_API_KEY),
        topK: 7,
        includeMetadata: true,
      }),
    });

    if (!queryResponse.ok) {
      console.error("Pinecone query error:", await queryResponse.text());
      throw new Error("Failed to query knowledge base.");
    }

    const queryData = await queryResponse.json<PineconeQueryResponse>();

    const contextDocuments = queryData.matches.map((match) => ({
      text: match.metadata?.text ?? "",
      source: match.metadata?.pageTitle ?? "Unknown Source",
    }));

    const context = contextDocuments
      .map((doc) => `Source: ${doc.source}\nContent: ${doc.text}`)
      .join("\n\n---\n\n");

    const formattedHistory = history
      .map(
        (msg) => `${msg.role === "user" ? "User" : "AI"}: ${msg.parts[0].text}`
      )
      .join("\n");

    const augmentedPrompt = `You are "Apex Intel," an expert AI assistant for the game Apex Legends.
Your task is to answer the user's query based ONLY on the provided context information. Do not use any prior knowledge.

Based on the user's query and the provided context, generate a single, valid JSON object with the following structure:
{
  "answer": "Your detailed, helpful answer to the query goes here. Use markdown for formatting like lists or tables.",
  "sources": ["Source Page Title 1", "Source Page Title 2"]
}

The "sources" array should contain the unique page titles of the context documents you used to formulate your answer.

### CONTEXT INFORMATION ###
${context}
### END CONTEXT ###

### CHAT HISTORY ###
${formattedHistory}
### END CHAT HISTORY ###

### USER QUERY ###
${message}
### END USER QUERY ###

JSON Response:`;

    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: augmentedPrompt,
    });

    const rawResponse = response.text;

    if (!rawResponse) {
      return c.json({ error: "AI returned an empty response." }, 500);
    }

    try {
      const jsonString = rawResponse.substring(
        rawResponse.indexOf("{"),
        rawResponse.lastIndexOf("}") + 1
      );
      const jsonResponse = JSON.parse(jsonString);
      return c.json(jsonResponse);
    } catch (e) {
      console.error(
        "Failed to parse JSON response from AI:",
        e,
        "\nRaw response was:",
        rawResponse
      );
      return c.json({
        answer:
          "I couldn't generate a structured response, but here is the raw text: " +
          rawResponse,
        sources: [...new Set(contextDocuments.map((doc) => doc.source))],
      });
    }
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

api.get("/map-rotation", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/maprotation?auth=${c.env.APEX_LEGENDS_API_KEY}&version=2`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch map rotation data." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/map-rotation:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

api.get("/player-stats/:platform/:playerName", async (c) => {
  try {
    const platform = c.req.param("platform");
    const playerName = c.req.param("playerName");

    if (!platform || !playerName) {
      return c.json({ error: "Platform and playerName are required." }, 400);
    }

    const apiUrl = `https://api.mozambiquehe.re/bridge?auth=${c.env.APEX_LEGENDS_API_KEY}&player=${playerName}&platform=${platform}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch player statistics." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error(`Error in /api/player-stats:`, error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api", api);

export default app;
