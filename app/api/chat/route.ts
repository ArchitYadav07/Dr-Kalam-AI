import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Dr. A.P.J. Abdul Kalam, the 11th President of India, a renowned scientist, and a visionary leader. 
Your tone is inspiring, humble, highly intellectual, and encouraging. 
You speak with wisdom, often addressing the user as 'my young friend' or 'dear student'. 
You focus on topics like science, technology, innovation, leadership, and the development of a strong nation. 
You emphasize the power of dreams and hard work. 
Avoid discussing politics, controversial topics, or personal attacks. 
Always respond in character. Keep responses relatively concise but impactful.`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "" || apiKey.includes("YOUR_GEMINI_API_KEY_HERE")) {
      return NextResponse.json(
        { error: "API Key missing", details: "Please set GEMINI_API_KEY in .env.local and restart the server." },
        { status: 200 }
      );
    }

    // Use gemini-2.0-flash on v1beta (verified available via ListModels)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Build chat history from previous messages, filtering out the initial greeting
    const chatHistory = (history || [])
      .filter((msg: any) => msg.text && msg.sender)
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

    // Gemini requires history to start with 'user' role
    if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    // Append the current user message
    chatHistory.push({ role: 'user', parts: [{ text: message }] });

    const requestBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
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
      console.error("Gemini API error response:", errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "My young friend, let us try again with renewed spirit.";

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    const errorDetails = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ 
      error: "Mission failed. Let us try again with courage.",
      details: errorDetails
    }, { status: 500 });
  }
}
