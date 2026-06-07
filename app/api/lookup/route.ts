import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const defaultPrompt = `You are an advanced reading assistant. Analyze the user's provided text snippet.
      Provide a response with the following strictly formatted sections using Markdown headings in this exact order:

      ### Summary
      [Provide a concise 1-2 sentence summary of the context or meaning]

      ### Simplified Version
      [Rewrite the entire provided text snippet using simple words and short, direct sentences. Remove complex clauses. CRITICAL: If the text mentions niche historical concepts, specific places, or historical figures that are not common knowledge, wrap them inside a <lookup-term> tag right here in the text so the user can hover over them for context. Example: "This happened during the <lookup-term>Thirty Years' War</lookup-term> in a small town called <lookup-term>Lützen</lookup-term>."]

      ### Vocabulary & Uncommon Words
      [Identify any uncommon, archaic, or advanced words from the original text and define them. CRITICAL: Wrap the exact word being defined inside a <lookup-term> tag, for example: "* **<lookup-term>Obfuscate</lookup-term>**: To render obscure, unclear, or unintelligible."]

      ### Context, People & Places
      [Provide deeper historical background on specific locations, entities, or figures mentioned. CRITICAL: Wrap key nouns inside a <lookup-term> tag, for example: "The battle involved <lookup-term>Gustavus Adolphus</lookup-term>." ]`;

export async function POST(request: Request) {
  try {
    const { text, history = [] } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const systemPrompt = process.env.SYSTEM_PROMPT || defaultPrompt;

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `Analyze this text selection: "${text}"` },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
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
