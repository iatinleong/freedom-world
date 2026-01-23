import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API client
// Note: In a real app, use an environment variable. For this prototype, we'll assume it's passed or set.
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash';
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
        responseMimeType: "application/json",
    }
});

export async function generateGameResponse(systemPrompt: string, userPrompt: string) {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY.");
    }

    try {
        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt);
        const response = result.response;

        return {
            text: response.text(),
            usage: response.usageMetadata
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

export async function generateStorySummary(previousSummary: string, newContent: string) {
    if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
    }

    const prompt = `
你是一個專業的劇情摘要助手。
請將以下「舊的劇情摘要」與「新增的劇情對話」合併，重新撰寫成一段不會太長的流暢劇情摘要。
摘要應包含重要的人名、地點、發生的事件以及當前的處境。
請使用第三人稱，並保留武俠小說的語感。

舊摘要：
${previousSummary || "（無）"}

新增劇情：
${newContent}

請回傳 JSON 格式：
{
  "summary": "合併後的新摘要內容..."
}
    `.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return {
            text: response.text(),
            usage: response.usageMetadata
        };
    } catch (error) {
        console.error("Summary Generation Error:", error);
        return null;
    }
}
