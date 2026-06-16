import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// AI Endpoint 1: Conversational Chatbot (FAQ)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    // Convert history format to Gemini format if appropriate
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start Chat
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `당신은 한글 농기계 대여 플랫폼 '농기계 공유마켓'의 전문 AI 안내원입니다.
농민과 농기계 공유자들에게 플랫폼 이용 방법, 대여 규칙, 결제(토스/카카오페이), 예약 절차, 분쟁 해결, 카카테고리별 농기계(경운기, 트랙터, 관리기, 콤바인, 이앙기 등) 사용 팁을 친절하고 상냥하며 직관적으로 설명하세요.
반드시 한국어로 따뜻하고 예의 바른 말투로 응답해 주세요. 글머리 기호와 문단 나누기를 활용해 읽기 편하게 작성하세요.`,
      },
      history: formattedHistory,
    });

    const result = await chat.sendMessage({ message });
    res.json({ reply: result.text });
  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: "FAQ 챗봇 에러가 발생했습니다: " + err.message });
  }
});

// AI Endpoint 2: Machine Description Synthesizer
app.post("/api/gemini/suggest-description", async (req, res) => {
  try {
    const { title, category, manufacturer, model, year } = req.body;
    if (!title || !category) {
      res.status(400).json({ error: "Title and Category are required." });
      return;
    }

    const prompt = `새로 등록할 농기계의 정보를 바탕으로 농업인을 끌어들일 수 있는 매력적이고 유용하며 신뢰도 높은 한국어 장비 설명을 작성해 주세요.
각 항목 정보:
- 제목: ${title}
- 카테고리: ${category}
- 제조사: ${manufacturer || "미지정"}
- 모델명: ${model || "미지정"}
- 연식: ${year ? year + "년식" : "상태 양호"}

설명에는 다음 요소가 포함되어야 합니다:
1. 해당 기계의 핵심 작업 용도(예: 논 갈기, 밭이랑 만들기 등)
2. 초보 농업인도 안전하게 다룰 수 있는 가이드라인이나 팁
3. 정비 상태나 부속 장치 소개
글은 친근하면서도 전문적인 어조로, 가독성 높은 이모지들과 설명으로 작성해 주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ description: response.text });
  } catch (err: any) {
    console.error("Gemini Suggest Description Error:", err);
    res.status(500).json({ error: "설명 생성에 실패했습니다: " + err.message });
  }
});

// AI Endpoint 3: Price Suggestion
app.post("/api/gemini/suggest-price", async (req, res) => {
  try {
    const { category, manufacturer, model, year } = req.body;
    if (!category) {
      res.status(400).json({ error: "Category is required." });
      return;
    }

    const prompt = `카테고리: ${category}, 제조사: ${manufacturer || "알 수 없음"}, 모델: ${model || "알 수 없음"}, 연식: ${year || "알 수 없음"} 농업 장비의 합리적인 대한민국 농기계 공유마켓 대여 주가를 산출해 주십시오.
다음 JSON 포맷을 엄격히 따라서 출력하십시오:
{
  "hourlyPrice": (시간당 가격 숫자, 원화 단위),
  "dailyPrice": (일 단위 가격 숫자, 원화 단위),
  "weeklyPrice": (주 단위 가격 숫자, 원화 단위),
  "deposit": (보증금 숫자, 원화 단위),
  "rationale": "이 요금을 권장하는 상세 가이드 이유 설명 (한국어)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hourlyPrice: { type: Type.INTEGER },
            dailyPrice: { type: Type.INTEGER },
            weeklyPrice: { type: Type.INTEGER },
            deposit: { type: Type.INTEGER },
            rationale: { type: Type.STRING },
          },
          required: ["hourlyPrice", "dailyPrice", "weeklyPrice", "deposit", "rationale"],
        },
      },
    });

    const resJson = JSON.parse(response.text || "{}");
    res.json(resJson);
  } catch (err: any) {
    console.error("Gemini Suggest Price Error:", err);
    res.status(500).json({ error: "요금 책정 제안에 실패했습니다: " + err.message });
  }
});

// AI Endpoint 4: Agricultural Machinery Recommendations based on agricultural scope
app.post("/api/gemini/recommend", async (req, res) => {
  try {
    const { query, availableMachines } = req.body;
    if (!query) {
      res.status(400).json({ error: "Query is required." });
      return;
    }

    const prompt = `사용자의 질문: "${query}"
현재 플랫폼에 등록된 농기계 목록:
${JSON.stringify(availableMachines || [])}

이 농기계 목록 중에서 사용자의 농경 환경(작업 평수, 수도작/밭농사 목적, 비용 등)에 적합한 기계를 파악하여 가장 우수한 추천 기계를 1~2개 선별하십시오.
목록 내 기계의 ID를 타겟팅하고 권장 이유를 일목요연하게 작성하여 제공해 주세요.
만약 적당한 농기계가 플랫폼에 없다면, 어떤 카테고리의 어떤 기계를 구해야 하는지 조언해 주십시오.
출력 포맷 JSON:
{
  "recommendedMachineIds": ["추천 기계 ID들..."],
  "advice": "사용자 맞춤형 조언 및 가이드 설명 내용 (한국어)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedMachineIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            advice: { type: Type.STRING },
          },
          required: ["recommendedMachineIds", "advice"],
        },
      },
    });

    const resJson = JSON.parse(response.text || "{}");
    res.json(resJson);
  } catch (err: any) {
    console.error("Gemini Recommend Error:", err);
    res.status(500).json({ error: "추천 생성에 실패했습니다: " + err.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Vite middleware setup or Static assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
