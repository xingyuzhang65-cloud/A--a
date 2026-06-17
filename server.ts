import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for GoogleGenAI to ensure it never crashes if API key is absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API Route: AI Cargo Assistant
app.post("/api/assistant", async (req, res) => {
  try {
    const { prompt, waybills } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    // Attempt to use Gemini
    try {
      const ai = getGeminiClient();
      const datasetContext = JSON.stringify(waybills || [], null, 2);

      const systemInstruction = `你是一位全能的安速货运 (ANSU Logistics) 智能物流数据高级分析助手。
你需要协助总管理员(调度长)进行业务运单分析。你的任务是根据用户提供的运单 JSON 数据进行专业、简练的总结、统计、查询和答复。
所有的回答必须严格依据这一【当前业务运单JSON数据表】：
${datasetContext}

请使用专业且和蔼的中文，可以使用 Markdown 表格、加粗和列表来对数据进行梳理。如果用户问及的数据在表中不存在，请如实告知。`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // low temperature for precise factual reasoning
        }
      });

      const reply = response.text || "我无法为您生成相关回复，请微调提示词重新提交。";
      res.json({ reply });
    } catch (apiError: any) {
      console.warn("Gemini API not available or failed:", apiError.message);
      
      // Fallback rule-based smart response based on keywords for excellent resilience if key is unset!
      const query = String(prompt).toLowerCase();
      let reply = "抱歉，由于未检测到有效的 `GEMINI_API_KEY`，智能服务正处于本地离线演示模式。您可以通过以下本地匹配回答或在【右上角全局设置-Secrets】中填充密钥：\n\n";

      if (query.includes("扣货") || query.includes("查验") || query.includes("问题")) {
        reply += "📦 **本地分析结果：**\n根据当前的装箱清单，目前有一票处于**【扣货】**状态：\n- **运单号**：`ANSU2026060108`（凯旋玩具，由于儿童磁力玩具需补充品牌授权处于深圳查验中，专职跟单：王晶）";
      } else if (query.includes("飞洋") || query.includes("飞洋电商")) {
        reply += "🎯 **商户信息反馈(飞洋电商)：**\n共有 3 票入仓承运单，目的地均为 `US-ONT8`：\n- `ANSU2026060101`（美森正班/卡派，ETA: 06-25）\n- `ANSU2026060109`（美森/UPS，ETA: 06-29）\n- `ANSU2026060112`（以星快船/卡派，ETA: 07-03）\n- 申报货值共 $43,800 USD。";
      } else if (query.includes("统计") || query.includes("汇总") || query.includes("申报")) {
        reply += "📊 **业务运单大盘摘要：**\n本地共录入 12 条重要业务运单：\n- 状态占比：入仓(5票)、出库(2票)、出仓(1票)、运输(2票)、签收(1票)、扣货(1票)、取消(1票)\n- 活跃渠道：美森正班-定提、以星限时达、空运普货线、中欧卡航货班。";
      } else {
        reply += "💡 **本地小管家推荐**：\n您可以提问关于：主要客户（飞洋电商、智创科技等）、异常情况或运单概览。离线状态下同样支持完整的列表筛选和录单持久化操作哦！";
      }

      res.json({ reply });
    }
  } catch (err: any) {
    console.error("Endpoint error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// 2. Integration with Vite devserver or Production Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite Middlewares in Development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve Static Build Files in Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANSU Logistics Platform (Express + Vite Server) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
