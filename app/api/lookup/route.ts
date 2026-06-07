import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { text, history = [] } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const systemPrompt = `You are an advanced reading assistant. Analyze the user's provided text snippet.
Provide a response with the following strictly formatted sections using Markdown headings:

### Summary
[Provide a concise 1-2 sentence summary of the context or meaning]

### Vocabulary & Uncommon Words
[Identify any uncommon, archaic, or advanced words and define them. If none, write "None identified."]

### Context, People & Places
[Explain any historical figures, specific locations, events, or niche concepts that are not widely known. If none, write "None identified."]`;

    // Explicitly type the array using Groq's ChatCompletionMessageParam type
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `Analyze this text selection: "${text}"` },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages, // Look ma, no 'as any'!
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
    });

    const responseText =
      chatCompletion.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
