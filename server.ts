import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get Gemini client
const getAi = (userApiKey?: string) => {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API Key provided. Please set one up in Settings.");
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API Routes
app.post("/api/process-content", async (req, res) => {
  try {
    const { type, content, imageData, userApiKey } = req.body;
    const ai = getAi(userApiKey);

    let response;
    
    if (type === 'image' || type === 'screenshot') {
      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: imageData.split(',')[1] || imageData,
        },
      };
      const textPart = {
        text: "You are Mindspace AI. Extract meaningful text (OCR) from this image. Then, generate a concise title, 3 relevant tags, a 1-sentence summary, and a broad category. Return your response as a JSON object with keys: 'text' (extracted content), 'title', 'tags' (array of strings), 'summary', 'category'.",
      };
      
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json"
        }
      });
    } else {
      // General note or link or quote processing
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Mindspace AI. Analyze this content: "${content}". 
        Generate a concise title, 3 relevant tags, a 1-sentence summary, and a broad category. 
        Return your response as a JSON object with keys: 'title', 'tags' (array of strings), 'summary', 'category'.`,
        config: {
            responseMimeType: "application/json"
        }
      });
    }

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to process content" });
  }
});

app.post("/api/smart-search", async (req, res) => {
  try {
    const { query, items, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    
    const itemsContext = items.map((i: any) => ({
      id: i.id,
      title: i.title,
      tags: i.tags,
      summary: i.summary
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Mindspace Semantic Search. Given this query: "${query}" 
      and these items: ${JSON.stringify(itemsContext)}, 
      find the IDs of the most relevant items (up to 10). 
      Return your response as a JSON object with a key 'relevantIds' containing an array of strings.`,
      config: {
          responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Smart Search Error:", error);
    res.status(500).json({ error: "Failed semantic search" });
  }
});

app.post("/api/analyze-habits", async (req, res) => {
  try {
    const { items, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    
    if (!items || items.length < 3) {
      return res.json({ 
        message: "Collect more memories to generate meaningful insights.",
        metrics: {
          intensity: 0,
          diversity: 0,
          balance: 0
        }
      });
    }

    const itemsContext = items.map((i: any) => ({
      title: i.title,
      type: i.type,
      tags: i.tags,
      summary: i.summary,
      date: new Date(i.createdAt).getHours()
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are Mindspace Algorithm Analyst. Analyze these digital scraps: ${JSON.stringify(itemsContext.slice(0, 30))}.
      Provide a reflective, non-judgmental analysis of the user's digital consumption and thinking patterns.
      Include:
      1. 'themes': Top 3 recurring thematic clusters.
      2. 'rhythm': Analysis of consumption time (late night vs day).
      3. 'balance': Ratio of deep/long-form content vs short scraps.
      4. 'reflection': A supportive, nuanced observation about their current "digital algorithm".
      5. 'metrics': Numerical scores (0-100) for 'Cognitive Clarity', 'Attention Span', and 'Creative Input'.
      
      Return as JSON with keys: themes (array), rhythm (string), balance (string), reflection (string), metrics (object).`,
      config: {
          responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Habit Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze habits" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, contextItems, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    
    const context = contextItems.map((i: any) => 
      `[Memory ${i.type}]: ${i.title} - ${i.content.slice(0, 500)}`
    ).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `You are Mindspace, a calm, humble, and observational reflection companion. 
        Your purpose is to help the user identify patterns in their digital life without judgment or clinical diagnosis.
        Use neutral, supportive language. Respect the philosophy: "Patterns are not identity. You are the best judge of your own character."
        
        The user's memories are:
        ${context}
        
        Recent interaction history:
        ${JSON.stringify(history)}
        
        User: ${message}` }] }
      ]
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to communicate" });
  }
});

app.post("/api/deep-reflection", async (req, res) => {
  try {
    const { items, type, userApiKey } = req.body; // type: 'growth', 'patterns', 'journal-insight'
    const ai = getAi(userApiKey);
    
    const context = items.map((i: any) => 
        `[${new Date(i.createdAt).toLocaleDateString()}] ${i.title}: ${i.summary || i.content.slice(0, 200)}`
    ).join("\n");

    let prompt = "";
    if (type === 'growth') {
        prompt = `Analyze this history of digital memories and thoughts:
        ${context}
        
        Synthesize a "What changed this month?" growth timeline. 
        Focus on recurring emotional themes and how their attention/interests shifted.
        Return as JSON with keys: 'timeline' (array of {label: string, value: string}), 'majorShift' (string).`;
    } else if (type === 'patterns') {
        prompt = `Analyze these memories for "Creative Pattern Recognition":
        ${context}
        
        Link seemingly unrelated ideas. E.g. "Your interest in biology seems linked to your saved quotes about architecture."
        Return as JSON with keys: 'clusters' (array of {name: string, description: string, relatedItemIds: string[]}).`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Reflection Error:", error);
    res.status(500).json({ error: "Reflection failed" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
