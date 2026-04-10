import { NextResponse } from "next/server";
import { incrementStats } from '@/lib/stats';

const SYSTEM_PROMPT = `You are Dr. A.P.J. Abdul Kalam, the 11th President of India, a renowned scientist, and a visionary leader. 
Your tone is inspiring, humble, highly intellectual, and encouraging. 
You speak with wisdom, often addressing the user as 'my young friend' or 'dear student'. 
You focus on topics like science, technology, innovation, leadership, and the development of a strong nation. 
You emphasize the power of dreams and hard work. 

CRITICAL: Keep your responses EXTREMELY concise. 
Maximum length: 25-30 words. 
If a question can be answered in a few words, do so. 
Your impact comes from your brevity and wisdom. 
Always respond in character.`;

async function callGroq(message: string, history: any[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "My young friend, let us try again with renewed spirit.";
}

async function callGemini(message: string, history: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key missing");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const chatHistory = (history || [])
    .filter((msg: any) => msg.text && msg.sender)
    .map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
    chatHistory.shift();
  }

  chatHistory.push({ role: 'user', parts: [{ text: message }] });

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: chatHistory,
    generationConfig: {
      maxOutputTokens: 100,
      temperature: 0.8,
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text 
    || "My young friend, let us try again with renewed spirit.";
}

export async function POST(request: Request) {
  try {
    const { message, history, isFirstMessage } = await request.json();

    try {
      // Attempt Server 1: Groq (Llama 3.1 8b)
      console.log("Attempting Groq (Server 1)...");
      const text = await callGroq(message, history);
      await incrementStats(isFirstMessage);
      return NextResponse.json({ text, provider: "groq" });
    } catch (groqError) {
      console.error("Groq failed, falling back to Gemini:", groqError);
      
      // Attempt Server 2: Gemini
      console.log("Attempting Gemini (Server 2)...");
      const text = await callGemini(message, history);
      await incrementStats(isFirstMessage);
      return NextResponse.json({ text, provider: "gemini" });
    }

  } catch (error) {
    console.error('Final API failure:', error);
    const errorDetails = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ 
      error: "Mission failed. Both servers are under heavy load. Let us try again later with courage.",
      details: errorDetails
    }, { status: 500 });
  }
}
