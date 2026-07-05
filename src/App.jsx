import { useState, useRef } from "react";

const PAIRS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY",
  "AUDUSD", "USDCAD", "NZDUSD", "USDCHF",
  "EURJPY", "GBPJPY", "BTCUSD", "XAGUSD",
];

const STEPS = [
  "📡  STEP 1 — FETCH MARKET DATA",
  "📊  STEP 2 — CALCULATE INDICATORS",
  "🏗   STEP 3 — DETECT MARKET STRUCTURE",
  "💧  STEP 4 — CHECK ICT LIQUIDITY",
  "📰  STEP 5 — READ NEWS SENTIMENT",
  "🛡   STEP 6 — VALIDATE RISK",
  "⚡  STEP 7 — BUILD FINAL SIGNAL",
];

const C = {
  bg:      "#04091a",
  panel:   "#07101f",
  border:  "#0d1f38",
  accent:  "#00aaff",
  green:   "#00e070",
  red:     "#ff1f44",
  yellow:  "#ffcc00",
  text:    "#9ab8d8",
  dim:     "#1e3454",
  dimText: "#4a6880",
};

function getSYS(p) {
  return `You are a professional institutional trader, ICT/SMC expert, and quantitative analyst with 20+ years experience.

Use web_search to get LIVE DATA: current ${p} price, recent price action context, today's economic calendar events, DXY/USD index level, relevant market news.

Apply the full 7-step ICT/SMC institutional framework. Return ONLY valid compact JSON — no markdown, no code blocks, no preamble, no explanation:

{"pair":"${p}","price":"","session":"Asian/London/New York","step1":"MTF bias 1-2 sentences","step2":{"bull":0,"bear":0,"trend":"Bullish/Bearish/Ranging","note":"indicator summary"},"step3":{"structure":"Bullish/Bearish/Ranging","note":"BOS CHOCH detail 1 sentence"},"step4":{"ob":"OB price level","target":"liquidity target price","note":"FVG sweep detail 1 sentence"},"step5":{"class":"Strong Bullish/Bullish/Neutral/Bearish/Strong Bearish","note":"news driver 1 sentence"},"step6":{"valid":true,"rr":"1:X.X","note":"risk note 1 sentence"},"bull":65,"bear":35,"decision":"BUY","confidence":65,"entry":"price-price","sl":"price","tp1":"price","tp2":"price","tp3":"price","reasons":{"structure":"confluence detail","liquidity":"confluence detail","indicators":"confluence detail","news":"confluence detail","risk":"confluence detail"}}

ABSOLUTE RULES:
1. decision = BUY or SELL — NEVER WAIT, NEUTRAL, HOLD, NO TRADE
2. bull + bear = 100 exactly
3. RR >= 1:2 mandatory  
4. Prioritize: liquidity sweeps → market structure → indicators
5. Think like smart money — target stops, sweep liquidity, follow institutional flow`;
}

function badgeColor(badge) {
  if (!badge) return C.yellow;
  const b = badge.toLowerCase();
  if (b.includes("bull") || b.includes("buy") || b.includes("✓") || b.includes("valid") || b === "ranging") return C.green;
  if (b.includes("bear") || b.includes("sell") || b.includes("✗") || b.includes("invalid")) return C.red;
  return C.yellow;
}

function Row({ label, val, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "4px 0", borderBottom: `1px solid ${C.dim}`, fontSize: "11px",
    }}>
      <span style={{ color: C.dimText }}>{label}</span>
      <span style={{ color, fontWeight: "700", letterSpacing: "0.5px" }}>{val || "—"}</span>
    </div>
  );
}

function StepCard({ label, note, badge }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "7px 9px", marginBottom: "5px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
        <span style={{ fontSize: "8px", color: C.accent, letterSpacing: "1.5px" }}>{label}</span>
        {badge && (
          <span style={{
            fontSize: "8px", fontWeight: "700", letterSpacing: "0.5px",
            color: badgeColor(badge), background: C.bg,
            padding: "1px 6px", borderRadius: "2px", border: `1px solid ${C.dim}`,
          }}>{badge.toUpperCase()}</span>
        )}
      </div>
      <div style={{ fontSize: "10px", color: C.dimText, lineHeight: "1.55" }}>{note || "—"}</div>
    </div>
  );
}

export default function App() {
  const [pair, setPair]       = useState("XAUUSD");
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [result, setResult]   = useState(null);
  const [rawText, setRawText] = useState("");
  const [err, setErr]         = useState(null);
  const [ts, setTs]           = useState(null);
  const timerRef = useRef(null);

  const analyze = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setRawText("");
    setErr(null);
    setStepIdx(0);

    timerRef.current = setInterval(() => {
      setStepIdx(s => (s < 6 ? s + 1 : s));
    }, 1500);

    try {
      // Calls the backend proxy — it uses GEMINI_API_KEY (Google AI Studio, free tier)
      // if set, otherwise ANTHROPIC_API_KEY. Key never appears in the browser.
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: getSYS(pair),
          user: `Analyze ${pair}. UTC: ${new Date().toUTCString()}. Search live price + news first. Return compact JSON only — no markdown.`,
        }),
      });

      clearInterval(timerRef.current);
      setStepIdx(6);

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `API error ${res.status}`);
      }

      const data  = await res.json();
      const text  = data.text || "";
      setRawText(text);

      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON found in response.");
      setResult(JSON.parse(m[0]));
      setTs(new Date().toLocaleTimeString());
    } catch (e) {
      setErr(e.message);
    } finally {
      clearInterval(timerRef.current);
      setLoading(false);
      setStepIdx(-1);
    }
  };

  const isBuy = result?.decision === "BUY";
  const sc    = isBuy ? C.green : C.red;

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      fontFamily: "'Courier New', Courier, monospace",
      color: C.text, padding: "13px", boxSizing: "border-box",
      maxWidth: "560px", margin: "0 auto",
    }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "10px", marginBottom: "12px" }}>
        <div style={{ fontSize: "8px", color: C.accent, letterSpacing: "5px", marginBottom: "2px" }}>
          ◈ SARUON INSTITUTIONAL TRADING SYSTEMS v2.0 ◈
        </div>
        <div style={{
          fontSize: "17px", fontWeight: "900", letterSpacing: "2px",
          color: "#d8eeff", textShadow: `0 0 16px ${C.accent}44`,
        }}>
          AI FOREX MARKET ANALYZER
        </div>
        <div style={{ fontSize: "9px", color: C.dimText, marginTop: "2px" }}>
          7-STEP ICT / SMC ◆ SMART MONEY ◆ INSTITUTIONAL GRADE
        </div>
      </div>

      {/* ── PAIR SELECTOR ── */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "8px", color: C.dimText, letterSpacing: "3px", marginBottom: "5px" }}>▸ SELECT INSTRUMENT</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {PAIRS.map(p => {
            const active = pair === p;
            return (
              <button
                key={p}
                onClick={() => !loading && setPair(p)}
                style={{
                  background: active ? C.accent : C.panel,
                  color: active ? "#000" : C.dimText,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  borderRadius: "3px", padding: "4px 9px", fontSize: "10px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontWeight: active ? "900" : "normal",
                  boxShadow: active ? `0 0 10px ${C.accent}55` : "none",
                }}
              >{p}</button>
            );
          })}
        </div>
      </div>

      {/* ── ANALYZE BUTTON ── */}
      <button
        onClick={analyze}
        disabled={loading}
        style={{
          width: "100%", borderRadius: "5px", padding: "11px 0",
          fontSize: "12px", fontWeight: "900", letterSpacing: "3px",
          fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "10px",
          background: loading ? C.panel : `linear-gradient(90deg, #001866, #0044bb, ${C.accent})`,
          color: loading ? C.dimText : "#fff",
          border: `1px solid ${loading ? C.border : C.accent}`,
          boxShadow: loading ? "none" : `0 0 22px ${C.accent}44`,
        }}
      >
        {loading ? `⏳  ANALYZING ${pair}...` : `⚡  ANALYZE ${pair}`}
      </button>

      {/* ── STEP PROGRESS ── */}
      {loading && (
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "10px 12px", marginBottom: "10px" }}>
          {STEPS.map((s, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "3px 0", fontSize: "9px",
                color: done ? C.green : active ? C.accent : C.dim,
                borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
                paddingLeft: "7px", marginLeft: "-7px",
              }}>
                <span style={{ width: "10px" }}>{done ? "✓" : active ? "▶" : "○"}</span>
                <span>{s}</span>
                {active && <span style={{ marginLeft: "auto", color: C.accent }}>▓▓░░</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ERROR ── */}
      {err && (
        <div style={{ background: "#100007", border: `1px solid ${C.red}`, borderRadius: "4px", padding: "10px", marginBottom: "10px" }}>
          <div style={{ color: C.red, fontSize: "9px", letterSpacing: "2px", marginBottom: "4px" }}>⚠  ANALYSIS ERROR</div>
          <div style={{ color: "#ff6677", fontSize: "10px", lineHeight: "1.5" }}>{err}</div>
          {rawText && (
            <details style={{ marginTop: "7px" }}>
              <summary style={{ color: C.dimText, fontSize: "9px", cursor: "pointer" }}>▸ Raw Response</summary>
              <pre style={{ fontSize: "8px", color: C.dimText, marginTop: "4px", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: "120px", overflow: "auto" }}>
                {rawText.slice(0, 600)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* ── SIGNAL RESULT ── */}
      {result && (() => {
        const r          = result;
        const confidence = r.confidence ?? (isBuy ? r.bull : r.bear) ?? 0;

        return (
          <div>
            {/* Decision Banner */}
            <div style={{
              background: isBuy ? "#001208" : "#110004",
              border: `2px solid ${sc}`, borderRadius: "6px",
              padding: "14px", marginBottom: "8px", textAlign: "center",
              boxShadow: `0 0 30px ${sc}33`,
            }}>
              <div style={{ fontSize: "8px", color: sc, letterSpacing: "5px", marginBottom: "2px" }}>
                ◆ FINAL SIGNAL — {r.pair} ◆
              </div>
              <div style={{
                fontSize: "54px", fontWeight: "900", color: sc,
                letterSpacing: "8px", lineHeight: "1.1",
                textShadow: `0 0 40px ${sc}, 0 0 80px ${sc}55`,
              }}>
                {r.decision}
              </div>
              <div style={{ fontSize: "13px", color: "#d8eeff", marginTop: "4px" }}>
                CONFIDENCE: <b style={{ color: sc, fontSize: "15px" }}>{confidence}%</b>
              </div>
              {r.price && (
                <div style={{ fontSize: "10px", color: C.dimText, marginTop: "3px" }}>
                  PRICE: {r.price} &nbsp;|&nbsp; SESSION: {r.session || "—"}
                </div>
              )}
              {ts && <div style={{ fontSize: "8px", color: C.dim, marginTop: "2px" }}>ANALYZED AT {ts}</div>}
            </div>

            {/* Probability Bar */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "8px 10px", marginBottom: "7px" }}>
              <div style={{ fontSize: "8px", color: C.accent, letterSpacing: "3px", marginBottom: "5px" }}>WEIGHTED PROBABILITY</div>
              <div style={{ display: "flex", height: "12px", borderRadius: "2px", overflow: "hidden", border: `1px solid ${C.dim}`, marginBottom: "4px" }}>
                <div style={{ width: `${r.bull || 0}%`, background: `linear-gradient(90deg, #001f0a, ${C.green})`, transition: "width 0.6s" }} />
                <div style={{ width: `${r.bear || 0}%`, background: `linear-gradient(90deg, ${C.red}, #1f0007)`, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                <span style={{ color: C.green }}>◆ BULLISH  {r.bull || 0}%</span>
                <span style={{ color: C.red }}>BEARISH  {r.bear || 0}% ◆</span>
              </div>
            </div>

            {/* Trade Levels */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "8px 10px", marginBottom: "7px" }}>
              <div style={{ fontSize: "8px", color: C.accent, letterSpacing: "3px", marginBottom: "6px" }}>TRADE LEVELS</div>
              {[
                ["ENTRY ZONE",    r.entry,        "#d8eeff"],
                ["STOP LOSS",     r.sl,           C.red],
                ["TAKE PROFIT 1", r.tp1,          C.green],
                ["TAKE PROFIT 2", r.tp2,          C.green],
                ["TAKE PROFIT 3", r.tp3,          C.green],
                r.step6?.rr ? ["R:R RATIO", r.step6.rr, C.yellow] : null,
              ].filter(Boolean).map(([label, val, color]) => (
                <Row key={label} label={label} val={val} color={color} />
              ))}
            </div>

            {/* Step Analysis */}
            <StepCard label="STEP 1 — MARKET OVERVIEW" note={r.step1} badge={null} />
            <StepCard label="STEP 2 — INDICATORS"      note={r.step2?.note} badge={r.step2?.trend} />
            <StepCard label="STEP 3 — MARKET STRUCTURE" note={r.step3?.note} badge={r.step3?.structure} />
            <StepCard
              label="STEP 4 — ICT LIQUIDITY"
              note={[r.step4?.ob, r.step4?.target, r.step4?.note].filter(Boolean).join("  |  ")}
              badge={null}
            />
            <StepCard label="STEP 5 — NEWS SENTIMENT"  note={r.step5?.note} badge={r.step5?.class} />
            <StepCard label="STEP 6 — RISK VALIDATION" note={r.step6?.note} badge={r.step6?.valid ? "✓ VALID" : "✗ INVALID"} />

            {/* Confluence Breakdown */}
            {r.reasons && (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", padding: "8px 10px", marginBottom: "8px" }}>
                <div style={{ fontSize: "8px", color: C.accent, letterSpacing: "3px", marginBottom: "6px" }}>CONFLUENCE BREAKDOWN</div>
                {[
                  ["MARKET STRUCTURE  (30%)", r.reasons.structure],
                  ["ICT LIQUIDITY     (25%)", r.reasons.liquidity],
                  ["INDICATORS        (20%)", r.reasons.indicators],
                  ["NEWS SENTIMENT    (15%)", r.reasons.news],
                  ["RISK VALIDATION   (10%)", r.reasons.risk],
                ].map(([label, val]) => val ? (
                  <div key={label} style={{ marginBottom: "7px" }}>
                    <div style={{ fontSize: "8px", color: C.dimText, marginBottom: "1px" }}>▸ {label}</div>
                    <div style={{ fontSize: "10px", color: C.dimText, lineHeight: "1.5" }}>{val}</div>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={analyze}
              disabled={loading}
              style={{
                width: "100%", background: C.panel,
                border: `1px solid ${C.border}`,
                color: loading ? C.dim : C.text,
                borderRadius: "4px", padding: "8px",
                fontSize: "10px", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", letterSpacing: "2px", marginBottom: "7px",
              }}
            >
              🔄  REFRESH ANALYSIS
            </button>

            {/* Disclaimer */}
            <div style={{
              padding: "6px", background: "#060403",
              border: "1px solid #1a0e00", borderRadius: "3px",
              fontSize: "8px", color: "#3a2510",
              textAlign: "center", letterSpacing: "0.5px",
            }}>
              ⚠ EDUCATIONAL ONLY — NOT FINANCIAL ADVICE — ALL TRADING CARRIES RISK
            </div>
          </div>
        );
      })()}
    </div>
  );
}
