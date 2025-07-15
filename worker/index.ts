import { Hono } from "hono";

type Bindings = {
  GEMINI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_HOST: string; // The full URL of your Pinecone index
  APEX_LEGENDS_API_KEY: string;
};

// --- API Response Type Definitions ---
type GeminiChatResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

type GeminiEmbeddingResponse = {
  embedding: {
    values: number[];
  };
};

type PineconeQueryResponse = {
  matches: Array<{
    id: string;
    score: number;
    metadata?: {
      text?: string;
    };
  }>;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- Helper Functions ---

async function createEmbedding(text: string, c: any): Promise<number[]> {
  const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${c.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(embeddingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create embedding. Status: ${response.status}`);
    }
    const data = await response.json<GeminiEmbeddingResponse>();
    return data.embedding.values;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

// --- API Routes ---

// 1. AI Chat Endpoint
app.post("/api/chat", async (c) => {
  try {
    const { message } = await c.req.json<{ message: string }>();
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
        vector: await createEmbedding(message, c),
        topK: 5,
        includeMetadata: true,
      }),
    });

    if (!queryResponse.ok) {
      console.error("Pinecone query error:", await queryResponse.text());
      throw new Error("Failed to query knowledge base.");
    }

    const queryData = await queryResponse.json<PineconeQueryResponse>();
    const context = queryData.matches
      .map((match) => match.metadata?.text ?? "")
      .join("\n\n---\n\n");

    const augmentedPrompt = `
      Context information is provided below.
      ---------------------
      ${context}
      ---------------------
      Given the context information and no prior knowledge, answer the query.
      Query: ${message}
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${c.env.GEMINI_API_KEY}`;
    const llmResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: augmentedPrompt }] }],
      }),
    });

    const data = await llmResponse.json<GeminiChatResponse>();

    if (!llmResponse.ok) {
      console.error("Gemini API Error:", data);
      return c.json({ error: "Failed to get response from AI" }, 500);
    }

    const aiResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I could not get a response.";
    return c.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// 2. Map Rotation Endpoint
app.get("/api/map-rotation", async (c) => {
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

// 3. Player Statistics Endpoint
app.get("/api/player-stats/:platform/:playerName", async (c) => {
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

// 4. Predator Leaderboard Endpoint
app.get("/api/predator", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/predator?auth=${c.env.APEX_LEGENDS_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch Predator leaderboard." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/predator:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// 5. Store Rotation Endpoint
app.get("/api/store", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/store?auth=${c.env.APEX_LEGENDS_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch store rotation." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/store:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// 6. Crafting Rotation Endpoint
app.get("/api/crafting", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/crafting?auth=${c.env.APEX_LEGENDS_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch crafting rotation." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/crafting:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// 7. Game News Endpoint
app.get("/api/news", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/news?auth=${c.env.APEX_LEGENDS_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch game news." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/news:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// 8. Server Status Endpoint
app.get("/api/server-status", async (c) => {
  try {
    const apiUrl = `https://api.mozambiquehe.re/serverstatus?auth=${c.env.APEX_LEGENDS_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("Apex Legends API Error:", await response.text());
      return c.json(
        { error: "Failed to fetch server status." },
        response.status as any
      );
    }

    const data: any = await response.json();
    return c.json(data);
  } catch (error) {
    console.error("Error in /api/server-status:", error);
    return c.json({ error: "An internal error occurred" }, 500);
  }
});

// Health Check Route
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
