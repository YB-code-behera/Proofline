import { useState, useEffect, useRef } from "react";
import {
  Search,
  Link2,
  Image as ImageIcon,
  ChevronDown,
  Share2,
  RotateCcw,
  AlertTriangle,
  UploadCloud,
  X,
  ArrowRight,
  Check,
} from "lucide-react";

/* ---------------------------------------------------------
   DESIGN TOKENS
--------------------------------------------------------- */
const ACCENT = "#42C8E8";
const BG = "#0A0B0D";
const SURFACE = "#141619";
const SURFACE_RAISED = "#1B1E23";
const BORDER = "rgba(255,255,255,0.09)";
const BORDER_SOFT = "rgba(255,255,255,0.05)";
const TEXT = "#F1EFEA";
const TEXT_DIM = "#9A9DA5";
const TEXT_FAINT = "#5C5F67";
const WARN = "#F0954C";

const VERDICT_META = {
  TRUE: { label: "TRUE", color: "#34D399", tint: "rgba(52,211,153,0.14)" },
  MOSTLY_TRUE: { label: "MOSTLY TRUE", color: "#8FE3B0", tint: "rgba(143,227,176,0.14)" },
  MISLEADING: { label: "MISLEADING", color: "#F5B942", tint: "rgba(245,185,66,0.14)" },
  MOSTLY_FALSE: { label: "MOSTLY FALSE", color: "#F0954C", tint: "rgba(240,149,76,0.14)" },
  FALSE: { label: "FALSE", color: "#F0555C", tint: "rgba(240,85,92,0.14)" },
  UNVERIFIED: { label: "UNVERIFIED", color: "#8B93A1", tint: "rgba(139,147,161,0.14)" },
};

const TRUST_ANSWER_FALLBACK = {
  TRUE: "Yes.",
  MOSTLY_TRUE: "Mostly.",
  MISLEADING: "Not as written.",
  MOSTLY_FALSE: "Mostly no.",
  FALSE: "No.",
  UNVERIFIED: "Not yet.",
};

const STATUS_LINES = [
  "Reading your claim...",
  "Finding the original source...",
  "Checking the evidence...",
  "Looking for missing context...",
  "Checking for manipulation...",
];

/* ---------------------------------------------------------
   DEMO DATA — clearly fictionalized entities, labeled as demo
--------------------------------------------------------- */
const DEMOS = [
  {
    key: "true",
    chip: "TRUE",
    verdict: "TRUE",
    extractedClaim:
      "The National Reserve Bank raised the daily UPI transfer limit for verified merchants to ₹5 lakh, effective this month.",
    evidenceScore: 9,
    trustAnswer: "Yes.",
    trustExplanation:
      "The regulator's own circular confirms the new limit and effective date exactly as claimed.",
    whatsTrue: null,
    whatsMisleading: null,
    whyPoints: [
      "Official circular found",
      "Effective date matches",
      "Amount matches the claim",
      "No missing context found",
    ],
    manipulationFlags: [],
    consistencyCheck: null,
    contradiction: null,
    primarySource: {
      name: "National Reserve Bank",
      detail: "Circular NRB/2026-27/114 — revision of UPI limits for verified merchants",
      url: "#",
    },
    corroboratingSources: [
      { name: "Business Standard coverage", url: "#" },
      { name: "Economic Daily coverage", url: "#" },
    ],
    deepDive: {
      sourcesSearched: ["National Reserve Bank circulars", "UPI merchant limit news", "NPCI statements"],
      reasoning:
        "The regulator's own circular states the revised limit and date in the same terms used in the claim, and no other official source contradicts it.",
    },
  },
  {
    key: "misleading",
    chip: "MISLEADING",
    verdict: "MISLEADING",
    extractedClaim:
      "The Ministry of Transport has ordered an immediate nationwide ban on diesel vehicles older than 10 years.",
    evidenceScore: 4,
    trustAnswer: "Not as written.",
    trustExplanation:
      "The order is real, but it applies only to two metro regions — not the whole country as the post implies.",
    whatsTrue: "The Ministry did issue an order restricting diesel vehicles older than 10 years.",
    whatsMisleading:
      "The post drops the word \u2018metro\u2019 — the order applies only to two named metro regions, not nationwide.",
    whyPoints: [
      "Official order located",
      "Core restriction confirmed",
      "Geographic scope does not match the claim",
    ],
    manipulationFlags: ["Missing context", "Headline/body mismatch"],
    consistencyCheck: null,
    contradiction: null,
    primarySource: {
      name: "Ministry of Transport",
      detail: "Notification MoT/44/2026 — restricts pre-2016 diesel vehicles in two metro regions",
      url: "#",
    },
    corroboratingSources: [{ name: "Regional news coverage", url: "#" }],
    deepDive: {
      sourcesSearched: ["Ministry of Transport notifications", "diesel vehicle ban coverage", "metro pollution rules"],
      reasoning:
        "The original notification names two specific metro regions as its scope. Reposts of the story dropped that qualifier, changing who the rule actually affects.",
    },
  },
  {
    key: "false",
    chip: "FALSE",
    verdict: "FALSE",
    extractedClaim: "The National Reserve Bank has withdrawn ₹500 notes from circulation starting next month.",
    evidenceScore: 1,
    trustAnswer: "No.",
    trustExplanation: "The regulator directly denies this, and no withdrawal notification exists anywhere.",
    whatsTrue: null,
    whatsMisleading: null,
    whyPoints: [
      "No withdrawal notification exists",
      "Official denial found",
      "Claim traced to an unverified forwarded message",
    ],
    manipulationFlags: ["Loaded wording", "False authority"],
    consistencyCheck: null,
    contradiction: null,
    primarySource: {
      name: "National Reserve Bank",
      detail: "Public clarification stating no such withdrawal has been ordered",
      url: "#",
    },
    corroboratingSources: [{ name: "Fact-check roundups from multiple outlets", url: "#" }],
    deepDive: {
      sourcesSearched: ["National Reserve Bank press releases", "₹500 note withdrawal claim", "currency circulation notices"],
      reasoning:
        "The regulator directly addressed and denied this claim. No notification supporting it exists in any official channel.",
    },
  },
  {
    key: "unverified",
    chip: "UNVERIFIED",
    verdict: "UNVERIFIED",
    extractedClaim: "A new university regulator policy bans all student council elections on campuses nationwide.",
    evidenceScore: 3,
    trustAnswer: "Not yet.",
    trustExplanation:
      "Several posts describe this policy, but no official circular or regulator statement could be found.",
    whatsTrue: null,
    whatsMisleading: null,
    whyPoints: [
      "Multiple secondary posts found",
      "No original circular located",
      "Regulator's official page shows no such notice",
    ],
    manipulationFlags: [],
    consistencyCheck: null,
    contradiction: null,
    primarySource: null,
    corroboratingSources: [
      { name: "Student forum discussions", url: "#" },
      { name: "Regional blog coverage", url: "#" },
    ],
    deepDive: {
      sourcesSearched: ["university regulator circulars", "student council election ban", "campus election policy"],
      reasoning:
        "Coverage of this claim traces back to social posts, not an original document. Without the regulator's own notice, there isn't enough to call this true or false.",
    },
  },
  {
    key: "misattributed",
    chip: "MISATTRIBUTED QUOTE",
    verdict: "FALSE",
    extractedClaim:
      "A ride-hailing startup's CEO said in an interview: \u2018We would rather shut the company down than hand over user location data.\u2019",
    evidenceScore: 1,
    trustAnswer: "No.",
    trustExplanation: "No original interview, transcript, or verified post containing this quote could be found.",
    whatsTrue: null,
    whatsMisleading: null,
    whyPoints: [
      "No original interview located",
      "No verified post matches this wording",
      "Quote traced only to screenshots with no source link",
    ],
    manipulationFlags: ["Misattributed quote", "False authority"],
    consistencyCheck: null,
    contradiction: null,
    primarySource: null,
    corroboratingSources: [{ name: "Screenshot repost threads (unverified origin)", url: "#" }],
    deepDive: {
      sourcesSearched: ["CEO interview location data", "startup founder quote verification", "official company statements"],
      reasoning:
        "The quote appears only in screenshot form, with no interview, transcript, or original post it can be traced to. That absence is itself the finding.",
    },
  },
  {
    key: "oldnews",
    chip: "OLD NEWS",
    verdict: "MISLEADING",
    extractedClaim: "Breaking: fire breaks out at a garment factory this week, dozens injured.",
    evidenceScore: 3,
    trustAnswer: "Not as written.",
    trustExplanation: "The fire happened, but the photos are from an incident several years ago, not this week.",
    whatsTrue: "A factory fire with injuries did occur and was documented at the time.",
    whatsMisleading:
      "The images are being recirculated with a \u2018this week\u2019 framing, but they date to an incident from several years ago.",
    whyPoints: [
      "Original incident located and dated",
      "Photos match the older event, not a new one",
      "No current fire reported at this location",
    ],
    manipulationFlags: ["Old news presented as new", "Wrong date"],
    consistencyCheck: null,
    contradiction: null,
    primarySource: {
      name: "Original news archive from the time of the incident",
      detail: "Dated report and photographs matching the recirculated images",
      url: "#",
    },
    corroboratingSources: [{ name: "Local authority statement from the original date", url: "#" }],
    deepDive: {
      sourcesSearched: ["garment factory fire", "factory fire injured recent", "image reverse context check"],
      reasoning:
        "The photographs and details trace back to a specific earlier date. Nothing indicates a new incident occurred this week at the named location.",
    },
  },
  {
    key: "consistency",
    chip: "CONSISTENCY CHECK",
    verdict: "MOSTLY_FALSE",
    extractedClaim: "State Minister R. Kapoor said this week: \u2018I have always opposed the new farm procurement rule.\u2019",
    evidenceScore: 3,
    trustAnswer: "Mostly no.",
    trustExplanation: "A verified statement from three years ago shows the same minister supporting the same rule.",
    whatsTrue: "The minister did make the opposing statement this week — that part is accurately quoted.",
    whatsMisleading: "The word \u2018always\u2019 doesn't hold up against their own prior record.",
    whyPoints: ["Recent statement verified", "Earlier verified statement located", "The two statements conflict"],
    manipulationFlags: ["Loaded wording"],
    consistencyCheck:
      "This statement appears inconsistent with a previous public statement by the same person, made three years earlier, expressing support for the same rule.",
    contradiction: null,
    primarySource: {
      name: "Minister's verified post (this week)",
      detail: "Original post containing the statement",
      url: "#",
    },
    corroboratingSources: [{ name: "Minister's verified post from three years ago", url: "#" }],
    deepDive: {
      sourcesSearched: ["minister statement farm procurement rule", "R. Kapoor past statements", "verified official posts"],
      reasoning:
        "Both statements are independently verified and attributed to the same person, and directly oppose each other on the same specific policy.",
    },
  },
];

/* ---------------------------------------------------------
   VERIFICATION ENGINE
--------------------------------------------------------- */
const SYSTEM_PROMPT = `You are Proofline's verification engine. Given a claim — as text, extracted from an image, or tied to a link — decide whether it holds up, using these rules:

1. Primary/official evidence (government notifications, court orders, official statements, verified original posts, official data, original research) outweighs secondary news reporting. Secondary reporting (wire services, newspapers, TV, blogs, aggregators) is for discovery and corroboration only — it can NEVER be the primarySource, no matter how many outlets repeat it or how confidently they report it.
2. Never treat virality, view counts, or repetition across many accounts — or across many news outlets — as evidence that a claim is true. Ten publications repeating the same unverified report is still zero primary evidence. If the only thing you found is secondary reporting, primarySource MUST be null and the verdict MUST be UNVERIFIED, even if every outlet agrees.
3. Use web search to find the strongest original evidence available before answering.
4. Choose exactly one verdict: TRUE, MOSTLY_TRUE, MISLEADING, MOSTLY_FALSE, FALSE, UNVERIFIED. Never guess, and never equate "no primary evidence found" with FALSE — that case is UNVERIFIED.
5. evidenceScore (integer 0-10) measures how strongly the evidence supports the claim, AS LITERALLY STATED, being true. It is not a measure of how much research was done. Guide:
   - 8-10: original evidence clearly establishes the literal claim as true.
   - 6-7: strong primary evidence, minor ambiguity.
   - 4-5: partial support — part of the claim holds but a material part doesn't (typical for MISLEADING/MOSTLY_FALSE).
   - 0-3: the literal claim is not supported — either because credible evidence directly contradicts it (FALSE/MOSTLY_FALSE), or because nothing sufficient was found either way (UNVERIFIED).
   A well-documented FALSE claim (e.g. an official, on-record denial) still scores LOW, not high — low score there means "the claim isn't true," not "we didn't look hard enough."
6. Check for manipulation patterns, only flagging what the evidence actually supports: loaded wording, missing context, old news presented as new, wrong date, wrong location, wrong person, misattributed quote, edited quote, false causality, cherry-picking, misleading image, manipulated media, headline/body mismatch, false authority.
7. If the statement is mainly an opinion or prediction rather than a checkable fact, say so and lean UNVERIFIED.
8. Stay politically neutral — apply identical standards regardless of party, government, country, ideology, or religion.
9. If you find the same person's own prior verified statement conflicts with what they're claiming now, note it factually and neutrally in consistencyCheck. Do not editorialize.
10. Respond with ONLY a single valid JSON object — no markdown fences, no commentary outside the JSON. Keep every string field concise. Arrays capped as noted below. Do not run more than 3 searches — settle the answer with the best evidence you have rather than searching exhaustively.

JSON keys required:
extractedClaim (string — the precise factual claim, separated from opinion/framing)
verdict (one of the six values above)
evidenceScore (integer 0-10, per the scale in rule 5)
trustAnswer (very short, 1-4 words, e.g. "Yes." or "Not as written.")
trustExplanation (string, max 2 sentences)
whatsTrue (string or null — only if verdict is MISLEADING or MOSTLY_FALSE)
whatsMisleading (string or null — only if verdict is MISLEADING or MOSTLY_FALSE)
whyPoints (array of up to 4 short strings, checklist style)
manipulationFlags (array of up to 4 short strings, chosen only from the list in rule 6; empty array if none apply)
consistencyCheck (string or null)
contradiction (string or null — set only if credible primary sources directly conflict with each other)
primarySource (object {name, detail, url} or null if no original, non-secondary evidence exists — see rules 1-2)
corroboratingSources (array of up to 3 objects {name, url}; empty array if none)
deepDive (object {sourcesSearched: array of up to 4 short strings, reasoning: string, max 2 sentences, evidence-based only})`;

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve({ base64, mediaType: file.type || "image/png" });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function taggedError(message, kind, extra) {
  const e = new Error(message);
  e.kind = kind;
  if (extra) Object.assign(e, extra);
  return e;
}

// Code-level backstop for the "many outlets repeated it" problem — this does not
// rely on the model reliably following the prompt rule. If no genuine primary
// source came back, the result is forced to UNVERIFIED regardless of what the
// model concluded, and the score is clamped to match the new "supports the
// literal claim" semantics.
function enforceGuardrails(parsed) {
  const hasPrimary = !!(parsed.primarySource && parsed.primarySource.name);
  let score = Number(parsed.evidenceScore);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(10, Math.round(score)));

  if (!hasPrimary && parsed.verdict !== "UNVERIFIED") {
    parsed.verdict = "UNVERIFIED";
    parsed.trustAnswer = parsed.trustAnswer && parsed.trustAnswer.length < 20 ? parsed.trustAnswer : "Not yet.";
    score = Math.min(score, 3);
  }
  if (parsed.verdict === "FALSE" || parsed.verdict === "MOSTLY_FALSE") {
    score = Math.min(score, 4);
  }
  if (parsed.verdict === "UNVERIFIED") {
    score = Math.min(score, 4);
    parsed.primarySource = null;
  }

  parsed.evidenceScore = score;
  return parsed;
}

async function callProofline(userContent) {
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });
  } catch (networkErr) {
    throw taggedError(networkErr.message || "network failure", "network");
  }

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch (_) {}
    throw taggedError("HTTP " + response.status + (bodyText ? ": " + bodyText.slice(0, 200) : ""), "http", {
      status: response.status,
    });
  }

  const data = await response.json();
  const truncated = data.stop_reason === "max_tokens";
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw taggedError(
      truncated ? "response truncated before JSON was produced (stop_reason=max_tokens)" : "no JSON object found in response",
      truncated ? "truncated" : "parse"
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch (parseErr) {
    throw taggedError("JSON.parse failed: " + parseErr.message, truncated ? "truncated" : "parse");
  }

  if (!parsed.verdict || !VERDICT_META[parsed.verdict]) {
    throw taggedError("missing or unrecognized verdict value", "parse");
  }

  return enforceGuardrails(parsed);
}

/* ---------------------------------------------------------
   GLOBAL STYLES
--------------------------------------------------------- */
function GlobalStyles() {
  return (
    <style>{`
      .pf-root {
        --font-display: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
        --font-body: -apple-system, 'SF Pro Text', 'Inter', Arial, sans-serif;
        --font-mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
        background: ${BG};
        color: ${TEXT};
        font-family: var(--font-body);
        min-height: 100vh;
        width: 100%;
        -webkit-font-smoothing: antialiased;
      }
      .pf-root * { box-sizing: border-box; }
      .pf-root ::selection { background: ${ACCENT}33; color: ${TEXT}; }
      .pf-root button { font-family: inherit; cursor: pointer; }
      .pf-root input, .pf-root textarea { font-family: inherit; }
      .pf-root a { color: inherit; }
      .pf-focusable:focus-visible {
        outline: 2px solid ${ACCENT};
        outline-offset: 2px;
      }
      @keyframes pf-fade-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .pf-fade-up { animation: pf-fade-up 0.5s cubic-bezier(.16,.8,.3,1) both; }
      @keyframes pf-bar-pulse {
        0%, 100% { opacity: 0.25; transform: scaleY(0.6); }
        50% { opacity: 1; transform: scaleY(1); }
      }
      .pf-bar-anim { animation: pf-bar-pulse 1.1s ease-in-out infinite; transform-origin: bottom; }
      @keyframes pf-spin-fade {
        0% { opacity: 0.3; }
        50% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      .pf-status-active { animation: pf-spin-fade 1.4s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .pf-fade-up, .pf-bar-anim, .pf-status-active { animation: none !important; }
      }
      .pf-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
      .pf-scrollbar::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
    `}</style>
  );
}

/* ---------------------------------------------------------
   SHARED PIECES
--------------------------------------------------------- */
function EvidenceMeter({ score, color, animated }) {
  const heights = [7, 9, 11, 13, 16, 19, 22, 25, 29, 33];
  const filled = typeof score === "number" ? score : 10;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 34 }}>
      {heights.map((h, i) => {
        const isFilled = animated ? true : i < filled;
        return (
          <div
            key={i}
            className={animated ? "pf-bar-anim" : ""}
            style={{
              width: 5,
              height: h,
              borderRadius: 2,
              background: isFilled ? color : BORDER,
              animationDelay: animated ? `${i * 0.07}s` : undefined,
              transition: "background 0.4s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function Wordmark({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <EvidenceMeter score={7} color={ACCENT} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: size,
          letterSpacing: "-0.02em",
          color: TEXT,
        }}
      >
        PROOFLINE
      </span>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const styles = {
    neutral: { color: TEXT_DIM, border: BORDER, bg: "transparent" },
    warn: { color: WARN, border: "rgba(240,149,76,0.35)", bg: "rgba(240,149,76,0.08)" },
    accent: { color: ACCENT, border: "rgba(66,200,232,0.35)", bg: "rgba(66,200,232,0.08)" },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        color: styles.color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------
   LANDING SCREEN
--------------------------------------------------------- */
function LandingScreen({
  inputMode,
  setInputMode,
  claimText,
  setClaimText,
  linkText,
  setLinkText,
  imageData,
  setImageData,
  onCheckIt,
  onDemo,
  validationMsg,
  howOpen,
  setHowOpen,
}) {
  const fileInputRef = useRef(null);

  function handleFilePick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    fileToBase64(file).then(({ base64, mediaType }) => {
      setImageData({ base64, mediaType, previewUrl: URL.createObjectURL(file), fileName: file.name });
    });
  }

  const tabs = [
    { id: "claim", label: "Claim", icon: Search },
    { id: "link", label: "Link", icon: Link2 },
    { id: "screenshot", label: "Screenshot", icon: ImageIcon },
  ];

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "56px 20px 80px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 64 }}>
        <Wordmark />
        <button
          className="pf-focusable"
          onClick={() => setHowOpen(!howOpen)}
          style={{
            background: "none",
            border: "none",
            color: TEXT_DIM,
            fontSize: 13.5,
            fontWeight: 500,
            padding: "6px 4px",
          }}
        >
          How it works
        </button>
      </div>

      {howOpen && (
        <div
          className="pf-fade-up"
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 32,
            background: SURFACE,
            fontSize: 13.5,
            color: TEXT_DIM,
            lineHeight: 1.7,
          }}
        >
          <div><span style={{ color: TEXT, fontWeight: 600 }}>1.</span> You show us what you saw.</div>
          <div><span style={{ color: TEXT, fontWeight: 600 }}>2.</span> We trace it back to the original evidence, not just who reported it.</div>
          <div><span style={{ color: TEXT, fontWeight: 600 }}>3.</span> You get a straight answer — and the source, so you can check it yourself.</div>
        </div>
      )}

      <div className="pf-fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(30px, 6vw, 42px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 14px",
          }}
        >
          Before you believe it.
          <br />
          <span style={{ color: ACCENT }}>Check it.</span>
        </h1>
        <p style={{ color: TEXT_DIM, fontSize: 15.5, margin: 0 }}>
          Because verifying news shouldn't take an hour.
        </p>
      </div>

      <div
        className="pf-fade-up"
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          background: SURFACE,
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
          {tabs.map((t) => {
            const active = inputMode === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className="pf-focusable"
                onClick={() => setInputMode(t.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "13px 10px",
                  background: active ? SURFACE_RAISED : "transparent",
                  border: "none",
                  borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent",
                  color: active ? TEXT : TEXT_FAINT,
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 20 }}>
          {inputMode === "claim" && (
            <textarea
              className="pf-focusable"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Paste the headline, caption, or claim you saw..."
              rows={4}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                resize: "vertical",
                color: TEXT,
                fontSize: 15,
                lineHeight: 1.5,
                outline: "none",
              }}
            />
          )}

          {inputMode === "link" && (
            <input
              className="pf-focusable"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Paste a news article, post, or video link..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: TEXT,
                fontSize: 15,
                outline: "none",
                padding: "6px 0",
              }}
            />
          )}

          {inputMode === "screenshot" && (
            <div>
              {!imageData ? (
                <button
                  className="pf-focusable"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    width: "100%",
                    border: `1.5px dashed ${BORDER}`,
                    borderRadius: 12,
                    padding: "30px 16px",
                    background: "transparent",
                    color: TEXT_DIM,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13.5,
                  }}
                >
                  <UploadCloud size={22} color={TEXT_FAINT} />
                  Drop a screenshot, or tap to upload
                </button>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={imageData.previewUrl}
                    alt="Uploaded screenshot preview"
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: `1px solid ${BORDER}` }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {imageData.fileName}
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_FAINT }}>Ready to check</div>
                  </div>
                  <button
                    className="pf-focusable"
                    onClick={() => setImageData(null)}
                    style={{ background: "none", border: "none", color: TEXT_FAINT, padding: 6 }}
                    aria-label="Remove screenshot"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFilePick}
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button
            className="pf-focusable"
            onClick={onCheckIt}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: ACCENT,
              color: "#04222B",
              border: "none",
              borderRadius: 10,
              padding: "11px 20px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            CHECK IT
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {validationMsg && (
        <div style={{ color: WARN, fontSize: 13, marginTop: 10, textAlign: "center" }}>{validationMsg}</div>
      )}

      <p style={{ textAlign: "center", color: TEXT_FAINT, fontSize: 13, marginTop: 24 }}>
        Find the source. Check the evidence. Decide for yourself.
      </p>

      <div style={{ marginTop: 56 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 12 }}>
          TRY A DEMO
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DEMOS.map((d) => {
            const meta = VERDICT_META[d.verdict];
            return (
              <button
                key={d.key}
                className="pf-focusable"
                onClick={() => onDemo(d)}
                style={{
                  border: `1px solid ${BORDER}`,
                  background: SURFACE,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TEXT_DIM,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
                {d.chip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   INVESTIGATING SCREEN
--------------------------------------------------------- */
function InvestigatingScreen({ statusIndex, isDemo }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 20,
      }}
    >
      <EvidenceMeter animated color={ACCENT} />
      <div style={{ textAlign: "center" }}>
        {STATUS_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              lineHeight: 2,
              color: i === statusIndex ? TEXT : i < statusIndex ? TEXT_FAINT : "transparent",
              transition: "color 0.3s ease",
            }}
            className={i === statusIndex ? "pf-status-active" : ""}
          >
            {i <= statusIndex ? line : "\u00A0"}
          </div>
        ))}
      </div>
      {isDemo && <div style={{ fontSize: 12, color: TEXT_FAINT }}>Loading demo example</div>}
    </div>
  );
}

/* ---------------------------------------------------------
   RESULT SCREEN
--------------------------------------------------------- */
function DeepDive({ result }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 28, paddingTop: 20 }}>
      <button
        className="pf-focusable"
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          color: TEXT_DIM,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13.5,
          fontWeight: 600,
          padding: 0,
        }}
      >
        <ChevronDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        Show me how Proofline checked this
      </button>
      {open && (
        <div className="pf-fade-up" style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: TEXT_FAINT, marginBottom: 8 }}>
              EXTRACTED CLAIM
            </div>
            <div style={{ fontSize: 14, color: TEXT_DIM, lineHeight: 1.6 }}>{result.extractedClaim}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: TEXT_FAINT, marginBottom: 8 }}>
              SOURCES SEARCHED
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(result.deepDive && result.deepDive.sourcesSearched ? result.deepDive.sourcesSearched : []).map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: TEXT_DIM,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    padding: "4px 8px",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: TEXT_FAINT, marginBottom: 8 }}>
              REASONING
            </div>
            <div style={{ fontSize: 14, color: TEXT_DIM, lineHeight: 1.6 }}>
              {result.deepDive ? result.deepDive.reasoning : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ result, isDemo, onCheckAnother, onCopy, copied }) {
  const meta = VERDICT_META[result.verdict];
  const trustAnswer = result.trustAnswer || TRUST_ANSWER_FALLBACK[result.verdict];
  const showTrueMisleadingSplit = result.whatsTrue || result.whatsMisleading;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 90px" }} className="pf-fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <button
          className="pf-focusable"
          onClick={onCheckAnother}
          style={{
            background: "none",
            border: "none",
            color: TEXT_DIM,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13.5,
            fontWeight: 600,
            padding: "6px 0",
          }}
        >
          <RotateCcw size={14} />
          Check another
        </button>
        <button
          className="pf-focusable"
          onClick={onCopy}
          style={{
            background: "none",
            border: `1px solid ${BORDER}`,
            color: TEXT_DIM,
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 8,
          }}
        >
          <Share2 size={13} />
          {copied ? "Copied" : "Copy result"}
        </button>
      </div>

      {isDemo && (
        <div style={{ marginBottom: 18 }}>
          <Pill tone="accent">DEMO EXAMPLE</Pill>
        </div>
      )}

      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 16px",
            borderRadius: 12,
            background: meta.tint,
            border: `1px solid ${meta.color}55`,
          }}
        >
          <EvidenceMeter score={result.evidenceScore} color={meta.color} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.01em",
              color: meta.color,
            }}
          >
            {meta.label}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 10 }}>
          EVIDENCE SCORE
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <EvidenceMeter score={result.evidenceScore} color={meta.color} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: TEXT }}>
            {result.evidenceScore}/10
          </span>
        </div>
        <div style={{ fontSize: 12, color: TEXT_FAINT, marginTop: 8 }}>
          How strongly the evidence backs this claim being true — not how much we looked.
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 10 }}>
          SHOULD YOU TRUST IT?
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          {trustAnswer}
        </div>
        <div style={{ fontSize: 14.5, color: TEXT_DIM, lineHeight: 1.6 }}>{result.trustExplanation}</div>
      </div>

      {showTrueMisleadingSplit && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: result.whatsTrue && result.whatsMisleading ? "1fr 1fr" : "1fr",
            gap: 14,
            marginBottom: 30,
          }}
        >
          {result.whatsTrue && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, background: SURFACE }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#34D399", marginBottom: 8 }}>
                WHAT'S TRUE
              </div>
              <div style={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.6 }}>{result.whatsTrue}</div>
            </div>
          )}
          {result.whatsMisleading && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, background: SURFACE }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#F5B942", marginBottom: 8 }}>
                WHAT'S MISLEADING
              </div>
              <div style={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.6 }}>{result.whatsMisleading}</div>
            </div>
          )}
        </div>
      )}

      {result.whyPoints && result.whyPoints.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 12 }}>
            WHY
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {result.whyPoints.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 14, color: TEXT_DIM }}>
                <Check size={15} color={meta.color} style={{ marginTop: 2, flexShrink: 0 }} />
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.manipulationFlags && result.manipulationFlags.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 12 }}>
            THINGS TO WATCH FOR
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {result.manipulationFlags.map((f, i) => (
              <Pill key={i} tone="warn">
                <AlertTriangle size={12} />
                {f}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {(result.consistencyCheck || result.contradiction) && (
        <div
          style={{
            marginBottom: 30,
            border: `1px solid rgba(240,149,76,0.35)`,
            background: "rgba(240,149,76,0.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          {result.consistencyCheck && (
            <div style={{ marginBottom: result.contradiction ? 12 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: WARN, marginBottom: 6 }}>
                CONSISTENCY CHECK
              </div>
              <div style={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.6 }}>{result.consistencyCheck}</div>
            </div>
          )}
          {result.contradiction && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: WARN, marginBottom: 6 }}>
                EVIDENCE CONFLICT
              </div>
              <div style={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.6 }}>{result.contradiction}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_FAINT, marginBottom: 12 }}>
          PROOF
        </div>
        {result.primarySource ? (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, background: SURFACE_RAISED }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: ACCENT, marginBottom: 8 }}>
              PRIMARY SOURCE
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16.5, marginBottom: 6 }}>
              {result.primarySource.name}
            </div>
            <div style={{ fontSize: 13.5, color: TEXT_DIM, lineHeight: 1.6, marginBottom: 12 }}>
              {result.primarySource.detail}
            </div>
            {result.primarySource.url && result.primarySource.url !== "#" && (
              <a
                href={result.primarySource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: ACCENT, fontWeight: 600, textDecoration: "none" }}
              >
                View original source →
              </a>
            )}
            {result.primarySource.url === "#" && (
              <span style={{ fontSize: 12, color: TEXT_FAINT, fontStyle: "italic" }}>
                Link omitted in this demo example
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              border: `1px dashed ${BORDER}`,
              borderRadius: 14,
              padding: 18,
              color: TEXT_FAINT,
              fontSize: 13.5,
              textAlign: "center",
            }}
          >
            No original source found. Proofline doesn't treat repeated coverage alone as proof.
          </div>
        )}

        {result.corroboratingSources && result.corroboratingSources.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: TEXT_FAINT, marginBottom: 8 }}>Also reported by:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {result.corroboratingSources.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 12.5,
                    color: TEXT_DIM,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 999,
                    padding: "5px 12px",
                  }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeepDive result={result} />
    </div>
  );
}

/* ---------------------------------------------------------
   ERROR SCREEN
--------------------------------------------------------- */
function ErrorScreen({ message, detail, onRetry, onTryDemo }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        gap: 18,
      }}
    >
      <AlertTriangle size={26} color={WARN} />
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19 }}>
        We couldn't complete this check
      </div>
      <div style={{ color: TEXT_DIM, fontSize: 14, maxWidth: 340, lineHeight: 1.6 }}>{message}</div>
      {detail && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: TEXT_FAINT,
            maxWidth: 360,
            wordBreak: "break-word",
            opacity: 0.7,
          }}
        >
          {detail}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button
          className="pf-focusable"
          onClick={onRetry}
          style={{
            background: ACCENT,
            color: "#04222B",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13.5,
            fontWeight: 700,
          }}
        >
          Try again
        </button>
        <button
          className="pf-focusable"
          onClick={onTryDemo}
          style={{
            background: "none",
            color: TEXT_DIM,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Try a demo instead
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   APP
--------------------------------------------------------- */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [inputMode, setInputMode] = useState("claim");
  const [claimText, setClaimText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageData, setImageData] = useState(null);
  const [validationMsg, setValidationMsg] = useState("");
  const [howOpen, setHowOpen] = useState(false);

  const [pendingAction, setPendingAction] = useState(null);
  const [statusIndex, setStatusIndex] = useState(0);

  const [result, setResult] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (screen !== "investigating" || !pendingAction) return;
    let cancelled = false;
    const lineTimer = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_LINES.length - 1));
    }, 700);
    const startedAt = Date.now();
    const MIN_MS = pendingAction.type === "demo" ? 1800 : 2600;

    async function run() {
      try {
        let finalResult;
        if (pendingAction.type === "demo") {
          finalResult = pendingAction.payload;
        } else {
          finalResult = await callProofline(pendingAction.payload);
        }
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, MIN_MS - elapsed);
        await new Promise((r) => setTimeout(r, wait));
        if (cancelled) return;
        setResult(finalResult);
        setIsDemo(pendingAction.type === "demo");
        setErrorMsg(null);
        setScreen("result");
      } catch (err) {
        if (cancelled) return;
        const kind = err && err.kind;
        let msg;
        if (kind === "truncated") {
          msg = "This check needed more digging than it had room for and got cut off mid-answer. Try a shorter, more specific claim, or try again.";
        } else if (kind === "http") {
          msg = "The verification service didn't respond normally (error " + (err.status || "unknown") + "). Try again in a moment.";
        } else if (kind === "network") {
          msg = "Couldn't reach the verification service — check your connection and try again.";
        } else {
          msg = "The check came back in a form we couldn't read. Try again — shorter, more specific claims tend to complete more reliably.";
        }
        setErrorMsg(msg);
        setErrorDetail((kind || "unknown") + (err && err.message ? ": " + err.message : ""));
        setScreen("error");
      } finally {
        clearInterval(lineTimer);
      }
    }
    run();
    return () => {
      cancelled = true;
      clearInterval(lineTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, pendingAction]);

  function startCheck() {
    setValidationMsg("");
    if (inputMode === "claim" && !claimText.trim()) {
      setValidationMsg("Paste a claim first.");
      return;
    }
    if (inputMode === "link" && !linkText.trim()) {
      setValidationMsg("Paste a link first.");
      return;
    }
    if (inputMode === "screenshot" && !imageData) {
      setValidationMsg("Upload a screenshot first.");
      return;
    }

    let userContent;
    if (inputMode === "claim") {
      userContent = `Claim to verify: "${claimText.trim()}"`;
    } else if (inputMode === "link") {
      userContent = `The user saw this link and wants the claim it makes checked: ${linkText.trim()}\nUse web search to find out what this link is about, then verify the underlying claim.`;
    } else {
      userContent = [
        { type: "image", source: { type: "base64", media_type: imageData.mediaType, data: imageData.base64 } },
        {
          type: "text",
          text: "Extract the core factual claim visible in this screenshot (headline, caption, or post text), then verify it. If multiple claims are visible, focus on the primary one.",
        },
      ];
    }

    setStatusIndex(0);
    setPendingAction({ type: "real", payload: userContent });
    setScreen("investigating");
  }

  function startDemo(demo) {
    setStatusIndex(0);
    setPendingAction({ type: "demo", payload: demo });
    setScreen("investigating");
  }

  function checkAnother() {
    setResult(null);
    setErrorMsg(null);
    setErrorDetail(null);
    setIsDemo(false);
    setCopied(false);
    setValidationMsg("");
    setScreen("landing");
  }

  function copyResult() {
    if (!result) return;
    const meta = VERDICT_META[result.verdict];
    const text = `PROOFLINE\n\n${meta.label}\n\n"${result.extractedClaim}"\n\n${result.trustExplanation}\n\nEvidence score: ${result.evidenceScore}/10\n\nCheck it yourself → Proofline`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="pf-root pf-scrollbar">
      <GlobalStyles />
      {screen === "landing" && (
        <LandingScreen
          inputMode={inputMode}
          setInputMode={setInputMode}
          claimText={claimText}
          setClaimText={setClaimText}
          linkText={linkText}
          setLinkText={setLinkText}
          imageData={imageData}
          setImageData={setImageData}
          onCheckIt={startCheck}
          onDemo={startDemo}
          validationMsg={validationMsg}
          howOpen={howOpen}
          setHowOpen={setHowOpen}
        />
      )}
      {screen === "investigating" && (
        <InvestigatingScreen statusIndex={statusIndex} isDemo={pendingAction && pendingAction.type === "demo"} />
      )}
      {screen === "result" && result && (
        <ResultScreen result={result} isDemo={isDemo} onCheckAnother={checkAnother} onCopy={copyResult} copied={copied} />
      )}
      {screen === "error" && (
        <ErrorScreen
          message={errorMsg}
          detail={errorDetail}
          onRetry={() => setScreen("landing")}
          onTryDemo={() => startDemo(DEMOS[0])}
        />
      )}
    </div>
  );
}
