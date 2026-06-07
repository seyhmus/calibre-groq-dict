"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Interactive Hover Component that queries Wikipedia with an expanded 50% larger frame
function HoverLookup({ children }: { children: React.ReactNode }) {
  const term = String(children).trim();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const fetchImage = async () => {
    if (fetched || loading) return;
    setLoading(true);
    try {
      // Step A: Search Wikipedia for a closely matching article page title
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const pageTitle = searchData?.query?.search?.[0]?.title;

      if (pageTitle) {
        // Step B: Grab the main page image thumb URL from that specific article (resolution optimized for bigger layout)
        const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`;
        const imgRes = await fetch(imgUrl);
        const imgData = await imgRes.json();
        const pages = imgData?.query?.pages;
        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;

        if (thumbnail) {
          setImageUrl(thumbnail);
        }
      }
    } catch (err) {
      console.error("Failed fetching image preview from Wikipedia", err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  return (
    <span
      className="relative inline-block border-b border-dotted border-indigo-500 text-indigo-600 font-medium cursor-help"
      onMouseEnter={() => {
        setShowPopup(true);
        fetchImage();
      }}
      onMouseLeave={() => setShowPopup(false)}
    >
      {children}

      {showPopup && (
        /* Expanded frame container width set to w-72 */
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-30 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl animate-fade-in block text-center">
          {loading && (
            <span className="text-[11px] text-slate-400 block py-6 animate-pulse">
              Searching images...
            </span>
          )}
          {!loading && imageUrl && (
            /* Using object-contain and an added subtle bg padding for portrait-style canvas files */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={term}
              className="w-full h-52 object-contain rounded-lg bg-slate-900/5 p-1.5"
            />
          )}
          {!loading && !imageUrl && fetched && (
            <span className="text-[11px] text-slate-400 block py-4">
              No illustration found
            </span>
          )}
          <span className="text-xs font-semibold text-slate-700 block mt-2 truncate">
            {term}
          </span>
        </span>
      )}
    </span>
  );
}

function DictionaryContent() {
  const searchParams = useSearchParams();
  const initialText = searchParams.get("word") || "";

  const [selection, setSelection] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [followUpInput, setFollowUpInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (initialText) {
      setSelection(initialText);
      handleLookup(initialText, []);
    }
  }, [initialText]);

  const handleLookup = async (
    textToAnalyze: string,
    currentHistory: Message[],
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze, history: currentHistory }),
      });
      const data = await res.json();

      if (data.result) {
        setMessages([
          ...currentHistory,
          { role: "assistant", content: data.result },
        ]);
      } else {
        setMessages([
          ...currentHistory,
          { role: "assistant", content: "⚠️ Error generating definition." },
        ]);
      }
    } catch (err) {
      setMessages([
        ...currentHistory,
        { role: "assistant", content: "⚠️ Failed to connect to the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpInput.trim() || loading) return;

    const userMessage: Message = { role: "user", content: followUpInput };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setFollowUpInput("");

    await handleLookup(
      selection + `\n\nFollow-up question: ${followUpInput}`,
      updatedHistory.slice(0, -1),
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 min-h-screen flex flex-col justify-between font-sans bg-slate-50 text-slate-900">
      <div className="flex-1 flex flex-col justify-between">
        {/* Accordion Header */}
        <header className="border-b border-slate-200 pb-3 mb-4 backdrop-blur bg-slate-50/80 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-1.5">
              <span>📖</span> Groq Reader Companion
            </h1>
            {selection && (
              <button
                onClick={() => copyToClipboard(selection)}
                className="text-xs text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded transition"
              >
                Copy Full Text
              </button>
            )}
          </div>

          {selection && (
            <div className="mt-2">
              <details className="group bg-slate-100 border border-slate-200/60 rounded-lg overflow-hidden transition-all duration-200">
                <summary className="list-none flex justify-between items-center p-2.5 text-xs text-slate-600 font-medium cursor-pointer select-none hover:bg-slate-200/50">
                  <span className="truncate pr-4 italic">
                    Selected: "
                    {selection.length > 60
                      ? selection.substring(0, 60) + "..."
                      : selection}
                    "
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded bg-white group-open:hidden">
                    Expand
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded bg-white hidden group-open:inline">
                    Collapse
                  </span>
                </summary>
                <div className="p-3 text-xs text-slate-600 border-t border-slate-200/40 bg-slate-50 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {selection}
                </div>
              </details>
            </div>
          )}
        </header>

        {/* Conversation Stream */}
        <div className="space-y-4 flex-1 pb-24">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-sm italic">
              Highlight text inside Calibre to activate your assistant.
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 shadow-sm border group ${
                    isUser
                      ? "bg-indigo-600 text-white border-indigo-700 rounded-tr-none"
                      : "bg-white text-slate-800 border-slate-200/80 rounded-tl-none"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="relative">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={
                          {
                            h3: ({ ...props }) => (
                              <h3
                                className="text-sm font-bold uppercase tracking-wider text-indigo-600 mt-4 mb-1.5 first:mt-0 border-b pb-0.5 border-slate-100"
                                {...props}
                              />
                            ),
                            p: ({ ...props }) => (
                              <p
                                className="text-sm text-slate-700 leading-relaxed mb-2.5 last:mb-0"
                                {...props}
                              />
                            ),
                            ul: ({ ...props }) => (
                              <ul
                                className="list-disc list-inside space-y-1 mb-2 text-sm text-slate-600"
                                {...props}
                              />
                            ),
                            li: ({ ...props }) => (
                              <li className="ml-1" {...props} />
                            ),
                            strong: ({ ...props }) => (
                              <strong
                                className="font-semibold text-slate-900"
                                {...props}
                              />
                            ),
                            // Explicitly extract and pass the children prop to make the linter happy
                            "lookup-term": ({
                              children,
                              ...props
                            }: {
                              children?: React.ReactNode;
                            }) => (
                              <HoverLookup {...props}>{children}</HoverLookup>
                            ),
                          } as Record<string, React.ComponentType<any>>
                        }
                      >
                        {msg.content}
                      </ReactMarkdown>
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="absolute -top-2 -right-2 p-1 bg-slate-50 border rounded text-[10px] text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition shadow-sm"
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start items-center gap-2 text-slate-400 text-xs italic animate-pulse pl-1">
              <div className="flex gap-1 items-center">
                <span
                  className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
              Groq is reading...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Sticky Chat Input */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto px-4 pb-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-md"
          >
            <input
              type="text"
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              placeholder="Ask a follow-up or explore deeper..."
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none bg-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !followUpInput.trim()}
              className="bg-indigo-600 disabled:bg-slate-200 text-white disabled:text-slate-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-slate-500 text-sm">
          Initialising application...
        </div>
      }
    >
      <DictionaryContent />
    </Suspense>
  );
}
