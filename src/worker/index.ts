import { Hono } from "hono";
import { Pinecone } from "@pinecone-database/pinecone";

type Bindings = {
  GEMINI_API_KEY: string;
  PINECONE_API_KEY: string;
  PINECONE_INDEX_NAME: string;
};

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

const app = new Hono<{ Bindings: Bindings }>();

/**
 * Creates a vector embedding for a given text using Google's embedding model.
 * @param text The text to embed.
 * @param c The Hono context, used to access environment variables.
 * @returns A promise that resolves to the embedding vector (an array of numbers).
 */
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


app.post("/api/chat", async (c) => {
  try {
    const { message } = await c.req.json<{ message: string }>();
    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

   
    const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY });
    const pineconeIndex = pinecone.index(c.env.PINECONE_INDEX_NAME);

    // --- RAG Pipeline ---

    // 1. Create an embedding for the user's question.
    const questionEmbedding = await createEmbedding(message, c);

    // 2. Query Pinecone to find the most relevant context.
    const queryResponse = await pineconeIndex.query({
      vector: questionEmbedding,
      topK: 5, // Get the top 5 most relevant text chunks
      includeMetadata: true,
    });

    const context = queryResponse.matches
      .map((match) => (match?.metadata as { text: string })?.text ?? "")
      .join("\n\n---\n\n");

    // 3. Construct the augmented prompt for the LLM.
    const augmentedPrompt = `
      Context information is provided below.
      ---------------------
      ${context}
      ---------------------
      Given the context information and no prior knowledge, answer the query.
      Query: ${message}
    `;

    // 4. Call the Gemini LLM with the augmented prompt.
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

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
