// Vercel serverless function — supports BOTH providers:
//   GEMINI_API_KEY    → Google AI Studio (free tier) + Google Search grounding
//   ANTHROPIC_API_KEY → Claude + web_search
// If both are set, Gemini is used first.
// Frontend sends: { system, user }  →  returns: { text }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST only" } });
  }
  const { system, user } = req.body || {};
  if (!system || !user) {
    return res.status(400).json({ error: { message: "Missing system/user in body" } });
  }

  const GEMINI = process.env.GEMINI_API_KEY;
  const ANTHROPIC = process.env.ANTHROPIC_API_KEY;

  try {
    if (GEMINI) {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI,
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              // Gemini 2.5 Flash is a thinking model — disable thinking so the
              // full token budget goes to the JSON answer instead of reasoning.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      const data = await upstream.json();
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          error: { message: data?.error?.message || `Gemini error ${upstream.status}` },
        });
      }
      const cand = data?.candidates?.[0];
      const text = (cand?.content?.parts || [])
        .map(p => p.text || "")
        .join("");
      if (!text) {
        return res.status(502).json({
          error: { message: `Gemini returned empty text (finishReason: ${cand?.finishReason || "unknown"}). Try again.` },
        });
      }
      return res.status(200).json({ text, provider: "gemini" });
    }

    if (ANTHROPIC) {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: user }],
        }),
      });
      const data = await upstream.json();
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          error: { message: data?.error?.message || `Anthropic error ${upstream.status}` },
        });
      }
      const text = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");
      return res.status(200).json({ text, provider: "anthropic" });
    }

    return res.status(500).json({
      error: { message: "No API key configured. Set GEMINI_API_KEY (Google AI Studio) or ANTHROPIC_API_KEY in environment variables." },
    });
  } catch (e) {
    return res.status(502).json({ error: { message: e.message } });
  }
}