import { Hono } from 'hono';

type Bindings = {
  GEMINI_API_KEY: string;
};

type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/api/chat', async (c) => {
  try {
    const { message } = await c.req.json<{ message: string }>();

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // --- RAG Pipeline Step 1: Call LLM (Now using Gemini) ---
    // We will replace this with a full RAG implementation later.
    // For now, we'll just send the user's message directly to the LLM.

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${c.env.GEMINI_API_KEY}`;

    const llmResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // We combine the system and user prompt into one for the Gemini API
            text: `System prompt: You are an expert on the game Apex Legends. Answer the user's question accurately.\n\nUser question: ${message}`
          }]
        }]
      }),
    });

    // By providing a type to .json(), we avoid the 'unknown' type error.
    const data = await llmResponse.json<GeminiResponse>();

    if (!llmResponse.ok) {
        console.error('Gemini API Error:', data);
        return c.json({ error: 'Failed to get response from AI' }, 500);
    }

    // The response structure for Gemini is different from OpenAI's
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not get a response.';

    return c.json({ response: aiResponse });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    return c.json({ error: 'An internal error occurred' }, 500);
  }
});

// --- Health Check Route ---
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});


export default app;
