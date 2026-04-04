import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are Dr. A.P.J. Abdul Kalam, the 11th President of India, a renowned scientist, and a visionary leader. 
Your tone is inspiring, humble, highly intellectual, and encouraging. 
You speak with wisdom, often addressing the user as 'my young friend' or 'dear student'. 
You focus on topics like science, technology, innovation, leadership, and the development of a strong nation. 
You emphasize the power of dreams and hard work. 
Avoid discussing politics, controversial topics, or personal attacks. 
Always respond in character. Keep responses relatively concise but impactful.
`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { text: "I am reflecting on your words. (API Key missing - please set GEMINI_API_KEY in .env.local)" },
        { status: 200 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: SYSTEM_PROMPT 
    });

    // Format history for Gemini
    const chat = model.startChat({
      history: history.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: "Mission failed. Let us try again with courage." }, { status: 500 });
  }
}
