var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
var getAi = (userApiKey) => {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No Gemini API Key provided. Please set one up in Settings.");
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.post("/api/process-content", async (req, res) => {
  try {
    const { type, content, imageData, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    let response;
    if (type === "image" || type === "screenshot") {
      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: imageData.split(",")[1] || imageData
        }
      };
      const textPart = {
        text: "You are Mindspace AI. Extract meaningful text (OCR) from this image. Then, generate a concise title, 3 relevant tags, a 1-sentence summary, and a broad category. Return your response as a JSON object with keys: 'text' (extracted content), 'title', 'tags' (array of strings), 'summary', 'category'."
      };
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json"
        }
      });
    } else {
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
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to process content" });
  }
});
app.post("/api/smart-search", async (req, res) => {
  try {
    const { query, items, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    const itemsContext = items.map((i) => ({
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
  } catch (error) {
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
    const itemsContext = items.map((i) => ({
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
  } catch (error) {
    console.error("Habit Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze habits" });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, contextItems, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    const context = contextItems.map(
      (i) => `[Memory ${i.type}]: ${i.title} - ${i.content.slice(0, 500)}`
    ).join("\n");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: "user", parts: [{ text: `You are Mindspace, a calm, humble, and observational reflection companion. 
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
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Failed to communicate" });
  }
});
app.post("/api/deep-reflection", async (req, res) => {
  try {
    const { items, type, userApiKey } = req.body;
    const ai = getAi(userApiKey);
    const context = items.map(
      (i) => `[${new Date(i.createdAt).toLocaleDateString()}] ${i.title}: ${i.summary || i.content.slice(0, 200)}`
    ).join("\n");
    let prompt = "";
    if (type === "growth") {
      prompt = `Analyze this history of digital memories and thoughts:
        ${context}
        
        Synthesize a "What changed this month?" growth timeline. 
        Focus on recurring emotional themes and how their attention/interests shifted.
        Return as JSON with keys: 'timeline' (array of {label: string, value: string}), 'majorShift' (string).`;
    } else if (type === "patterns") {
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
  } catch (error) {
    console.error("Reflection Error:", error);
    res.status(500).json({ error: "Reflection failed" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
