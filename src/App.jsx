import { useState } from "react";

// ─── Config (from .env) ───────────────────────────────────────────────────────
const API_KEY   = import.meta.env.VITE_GROQ_API_KEY || "";
const MODEL_ID  = "openai/gpt-oss-120b";
const API_URL   = "https://api.groq.com/openai/v1/chat/completions";

// ─── API Caller ───────────────────────────────────────────────────────────────
async function runAuditCall(systemPrompt, userMessage) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_ID,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
    }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error("Non-JSON response: " + text.slice(0, 300)); }
  if (!res.ok || data.error) {
    const msg = data?.error?.message || data?.error || JSON.stringify(data);
    throw new Error(`API error (${res.status}): ${msg}`);
  }
  if (!data.choices?.[0]?.message?.content) throw new Error("Unexpected response shape: " + JSON.stringify(data).slice(0, 300));
  return data.choices[0].message.content;
}

// ─── Audit System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Aavya Brand Audit Engine — an expert brand compliance auditor trained on Aavya's official design token docs (colors, typography, spacing, shadows, radius), logo specs, tone-of-voice guide, brand overview, and component registry.

═══ AAVYA BRAND IDENTITY ═══

CORE PHILOSOPHY
- Aavya is an enterprise technology company: fragmented business data → connected, intelligent experiences. Ontology-first design, autonomous workflows, enterprise-ready AI agents. Closes the "Coherence Gap" between scattered systems and confident decisions.
- Audience: enterprise leaders (CTOs, CDOs, CIOs, ops execs) at organizations with data silos.
- Aesthetic: premium, minimal, calm, technical. Abstract geometric design, not consumer-oriented. Elements "float" with generous negative space.

EXACT COLOR TOKENS
- --primary: Indigo #4F46E5 — primary actions, buttons, CTAs, links
- --aavya: Aavya Cyan #3AADDD — ACCENT ONLY: focus rings, links, eyebrow text. Never a primary/dominant color.
- --navy: Deep Navy #1E2338 — logo mark, dark anchors, image backgrounds
- --mint: Mint Green #2CB67D — primarily semantic success; sparing supporting accent (e.g. gradients); never dominant
- RETIRED: Electric Violet #7F5AF0 is no longer part of the palette (back-compat alias only, points to #4F46E5). Flag its use as an accent as an inconsistency, not a hard fail.

LIGHT MODE
- Background #FAFBFC, Foreground #1E2338, Card #FFFFFF, Border #E2E5EB, Ring (focus) #3AADDD
- Soft drop shadows (navy-based, 5–10% opacity), frosted glass panels, crisp borders

DARK MODE
- Background #14172A, Foreground #F4F5F8, Card #1E2338, Border #2A2F4A, Ring (focus) #3AADDD
- No drop shadows on dark — use glows instead: glow-indigo (default elevation), glow-mint (success/data flow)
- Glassmorphism reserved for hero moments (floating nav, hero panels, modals) — not every surface

TYPOGRAPHY
- Inter — headings, UI, navigation, body copy. Headings use tight tracking (-0.02em), no exceptions.
- JetBrains Mono — code, data labels, technical/machine-facing content only. Never for body copy or headings.
- No other typefaces permitted.

SHAPE LANGUAGE & RADIUS
- Permitted: circles, hexagons, rounded rectangles only. NO sharp corners anywhere (border-radius: 0 is prohibited).
- Base radius ~0.825rem; small elements (tags/badges) get the smallest radius, large containers (modals/hero) get the largest, pills/avatars use fully-rounded.

SPACING
- 4px base grid. Generous negative space preferred — "when in doubt, go bigger." Tight/crowded layouts are off-brand.

LOGO USAGE
- Correct variant must match background: Primary (light bg), Dark Background Logo (dark/black bg), Monochrome for single-colour contexts.
- Minimum clear space: 1× logomark height on all sides. Minimum size: 24px height digital (16px logomark-only), 8mm print.
- Prohibited: stretching/skewing/rotating, drop shadows or glows on the logo itself, recoloring, low-contrast placement without an approved overlay, wordmark under 24px.

COMPONENT STANDARDS (Aavya Registry — shadcn-style, 60+ primitives)
- Signature Aavya components: Header, Header-Center, Breadcrumbs, Theme Toggle, Pill Select, AI Image Studio, Logo, Themed Card.
- Standard primitives (Button, Card, Dialog, Input, Select, Tabs, etc.) should follow the token system above — rounded, token-based colors, no ad-hoc hex values.
- No emoji anywhere in the UI.

TONE & VOICE (5 traits — from the official tone-of-voice guide)
1. Clarity — say what you mean, no filler. ("Connect your tools in three steps," not "leverage our extensible integration architecture.")
2. Connection — talk with people, not at them. Use "we / you / us," not "the user / the system."
3. Momentum — active voice, action verbs, no passive hesitation.
4. Honesty — transparent about what is and isn't built yet; no overclaiming ("comprehensive suite... covers all your needs").
5. Excitement — genuinely enthusiastic without exclamation-mark hype.
Writing rules: sentences under 25 words; plain words over jargon (explain technical terms on first use); lead with what's possible, avoid "don't/can't/won't" where a positive framing works; every section ends with a clear next step.
Flag corporate-speak / filler words on sight: Approximately, Transformation, Innovation, Leverage, Utilise, Facilitate, Implement, Solution, Best-in-class, Paradigm shift, Scalable used without explaining the benefit.

BRAND PROHIBITIONS (any violation = automatic fail on that check)
1. Warm colors (red/orange/amber) as a BRAND/MARKETING aesthetic — hero imagery, illustration, social/ad creative, AI-generated brand images must stay in the cool palette (indigo/cyan/navy). This does NOT apply to product UI: red/amber ARE required and correct for errors, warnings, and destructive actions (--destructive, caution states). Do not flag functional error/warning colors as violations — only flag warm-dominant marketing imagery.
2. NO mascots or characters — no avatars, robots with faces, emojis, or illustrated characters
3. NO real-world photography — no stock office/laptop/people photos; use abstract data representations only
4. NO skeuomorphism — buttons must not resemble physical plastic with heavy bevels or gradients
5. NO brush strokes — no artistic, hand-drawn, or "sketchy" styles; mathematical precision only

═══ AUDIT CATEGORIES ═══

Audit 8 categories:
1. Color Compliance — correct primary/accent roles (#4F46E5 primary, #3AADDD accent-only, #2CB67D sparing success), retired Electric Violet flagged as inconsistency not hard fail, correct light/dark surface tokens
2. Typography — Inter + JetBrains Mono only, tight heading tracking, mono reserved for technical content
3. Shape Language & Radius — rounded geometry only (circles/hexagons/rounded rects), NO sharp corners, radius scale matched to element size
4. Tone & Voice — the 5 voice traits, sub-25-word sentences, we/you/us framing, no corporate-speak/filler words, ends with a next step
5. Layout & Spacing — 4px-grid generosity, floating elements, no overcrowding
6. Component & Logo Usage — registry-worthy component patterns, correct logo variant/clear-space/min-size, no emoji in UI
7. Brand Prohibitions — check all 5 rules, remembering the warm-color rule is scoped to marketing/imagery and does NOT cover functional error/warning UI colors
8. Overall Brand Fit — holistic match to the enterprise/Coherence-Gap positioning and calm, technical aesthetic

Per category: score (0–100), status ("pass"≥75/"warning"50–74/"fail"<50), findings (2–3 items ≤25 words each), recommendations (1–2 items ≤25 words each).
Also: overall_score (average), executive_summary (2 sentences), top_priority_fixes (3 items).

CRITICAL: Return ONLY a raw JSON object — no markdown, no backticks, nothing else.
{"overall_score":0,"executive_summary":"","top_priority_fixes":["","",""],"categories":[{"id":"","name":"","score":0,"status":"","findings":[""],"recommendations":[""]}]}`;

// ─── Known Content Cache ──────────────────────────────────────────────────────
const KNOWN_CONTENT = {
  "https://aavya.com/": `
Title: Aavya: Turning Enterprise Data into Experiences That Drive Productivity
Nav: AAVYA (gradient V-glyph logomark) | Company▼ | Solutions▼ | Insights▼ | Careers▼ | "Partner With Us" CTA button | dark-mode toggle
Hero: "Transforming Enterprise Data Into Experiences That Drive Productivity." — headline gradient-text ("Experiences That Drive Productivity" in cyan-to-indigo gradient). Subhead: "Empower your business with connected intelligence through operationalized data, autonomous workflows and AI agents that drives measurable business outcomes."
Three pillar cards: Ontology First Design, Autonomous Workflows, Enterprise-Ready AI Agents — each with a glowing neon-style abstract illustration (particle/circuit art in violet/cyan/green) above a heading and 1-2 sentence description.
Further sections: "Why Aavya" (problem-shift-result), Ontology deep-dive, Autonomous Workflows governance detail, "AI Built for Where Your Business Is Headed Next" (AI Applications), The Aavya Experience, How We Help (consulting/intelligence/managed services), partnership inquiry form, FAQ, global office map (USA, New Delhi/India, Singapore, Japan).
Footer: logomark + "Turning enterprise data into experiences that drive productivity." tagline, social icons (LinkedIn, Instagram, X, YouTube), Solutions/Company/Legal link columns, "©2026 Aavya. All rights reserved."
Measured (via computed styles, not assumed): body font-family resolves to "Inter, Inter Fallback, system-ui" and canvas glyph-width test confirms Inter is actually rendering (not just declared) — correct token compliance. Body background rgb(250,251,252) = #FAFBFC, text rgb(30,35,56) = #1E2338 — exact light-mode token match. Primary CTA button background rgb(79,70,229) = #4F46E5 (--primary) with ~11px radius, matching radius-md. No warm/red/orange/yellow tones observed in UI chrome.
Design signals: Strongly on-brand — correct color tokens, correct working Inter typography, rounded cards, calm/generous spacing, cool-toned neon illustrations (no warm-dominant imagery). Copy mixes clear value statements with some enterprise-marketing phrasing worth checking against the tone guide's plain-language/no-jargon rules. One flag: the "Enterprise-Ready AI Agents" hero illustration renders three glowing humanoid figures with visible faces — borderline against the "no mascots/robots with faces" prohibition even though stylistically abstract/circuit-themed rather than cartoonish.
`.trim(),

  "https://registry-dev.aavya.com/": `
Title: Aavya Brand Portal v4.0
Tagline: "Your central hub for brand guidelines, assets, design tokens, templates, and code components. Premium, minimal, calm, and technical."
Nav: Brand Guidelines | Assets | Design Tokens | Registry | Theme Generator | Export | Search
Sections: Brand Guidelines, Assets, Design Tokens, Templates, Registry, Export
Colors: Indigo #4F46E5 (primary), Aavya Cyan #3AADDD (accent only), Deep Navy #1E2338, Mint #2CB67D (sparing success accent). Electric Violet #7F5AF0 retired (back-compat alias only).
Light mode: background #FAFBFC, foreground #1E2338, card #FFFFFF
Dark mode: background #14172A, foreground #F4F5F8, card #1E2338
Typography: Inter (headings/body), JetBrains Mono (data/code/labels), tight -0.02em heading tracking
Shapes: Circles, hexagons, rounded rectangles — no sharp corners, base radius 0.825rem
Dark mode elevation: glow-indigo default, glow-mint for success; glassmorphism reserved for hero moments
Light mode elevation: soft navy-based drop shadows (5–10% opacity)
Logo: correct variant per background, 1x logomark clear space, 24px min digital height, no stretch/skew/recolor/shadow
Components: Aavya Header, Header-Center, Breadcrumbs, Theme Toggle, AI Image Studio, Pill Select, Logo, Themed Card, plus 60+ shadcn-style UI primitives (Button, Card, Dialog, Input, Tabs, etc.)
Tone: 5 traits (Clarity, Connection, Momentum, Honesty, Excitement), <25-word sentences, we/you/us, no corporate jargon
Design signals: Fully on-brand. Dark SaaS aesthetic. Abstract geometric design. No emoji in UI. Mathematical precision. Warm colors absent from marketing imagery (though allowed for functional error/warning UI states). No real-world photography. No skeuomorphism. No brush strokes. Floating elements with generous negative space.
`.trim(),

  "https://registry.aavya.com/": `
Title: Aavya Brand Portal (v4.1, light theme by default)
Tagline: "Your central hub for brand guidelines, assets, design tokens, templates, and code components. Premium, minimal, calm, and technical."
Nav (left sidebar): Brand Guidelines | Design Tokens | Registry | Showcase | Assets (marked "Soon") | Export (marked "Soon") | Search (⌘K) | Internal (marked "Team")
Homepage structure: 3-layer explainer cards — Layer 1 "Brand Guidelines" (the why — mission, voice, colour intent, usage rules), Layer 2 "Design Tokens" (the what — named values that translate guidelines into code), Layer 3 "Design Code Registry" (the how — installable components/blocks). Below that: Showcase, Assets (soon), Export (soon) cards, then a "Recent Activity" changelog feed.
Changelog entry visible on page (Apr 2026, "Brand Reconciliation v4.1"): "Indigo (#4F46E5) is now the single primary. Old periwinkle #6862e4 and Electric Violet #7F5AF0 retired. Mint demoted to success-only. Navy deepened. Logo V-glyph right half updated to match." This is the portal confirming its own current token values.
Measured colors (via computed styles): body background rgb(250,251,252) = #FAFBFC, body text rgb(30,35,56) = #1E2338 — exact match to the documented light-mode --background/--foreground tokens.
Measured typography (via loaded @font-face + canvas glyph-width comparison, not just CSS declarations): Inter and JetBrains Mono font files ARE declared/loadable on the page, but body and nav text actually renders in the browser's system UI font stack (ui-sans-serif/system-ui), not Inter — the rendered glyph widths match the system font, not Inter, even after forcing Inter to load. This is a real typography-token compliance gap on the portal itself, not a missing-data placeholder.
Shape language: content cards (Layer 1/2/3, Showcase, Assets, Export) use soft rounded corners consistent with the radius tokens; no sharp corners visible on primary content surfaces. Category badges ("Layer 1/2/3") are small rounded pill tags in pastel lavender/blue/green.
Logo: gradient V-glyph mark (indigo-to-cyan gradient) in the top-left, paired with "Brand" wordmark text, small "v4.1" version tag beside it.
No warm/red/orange/yellow color observed anywhere on the homepage.
`.trim(),

  "https://foundry-dev.aavya.com/": `
Title: Aavya — Palantir Implementation Partner | Foundry & AIP Practice
Nav: Aavya logo | Why Aavya | What We Do▼ | Our Approach | Careers | Blog | dark/light toggle | "Partner With Us" pill CTA. Nav bar is a floating rounded capsule, not a flush-edge bar.
Hero: "Building What's Next for Your Enterprise" — "We combine AI, data, and deep business expertise to transform how organizations operate, innovate, and grow - creating intelligent enterprises built for a rapidly changing world." CTAs: "See what we've built", "Talk to us". "PALANTIR CERTIFIED" partner-logo lockup with rotating claims (24×7 support, forward-deployed engineers).
Sections: Palantir Services (7 service cards: Foundry Data Platform, Training & Enablement, Implementation & Migration, 24×7 Ops & Support, Application Development, Data Engineering, Ontology Development), "What We've Built" production case study (AI-Powered CRM), "The Aavya Execution Model" (old-consulting-vs-Aavya comparison table), 24/7 support stats, assessment-questionnaire CTA, footer with Locations (India, Singapore, Japan, USA) and Legal links.
Measured (via computed styles, not assumed): dark mode active by default (html class "dark"). Body background rgb(20,23,42) = #14172A, text rgb(244,245,248) = #F4F5F8 — exact match to the documented dark-mode --background/--foreground tokens. Body font resolves to Inter and a canvas glyph-width test confirms Inter is actually rendering (correct, unlike registry.aavya.com). Primary CTA background rgb(79,70,229) = #4F46E5 (--primary), but its border-radius is 100px (fully pill-shaped) — the standard button elsewhere in the brand system (e.g. aavya.com) uses the smaller radius-md (~11px), so this is a real cross-page inconsistency in button shape, not a violation of the "no sharp corners" rule itself.
REAL-WORLD PHOTOGRAPHY VIOLATION (confirmed, not assumed): the hero section has a <video> background element (src ends in "whyaavyabgvideo.mp4") showing real live-action office/boardroom footage — a literal photographic/video scene of a meeting table, not an abstract data representation. This directly violates the brand prohibition on real-world photography/imagery, which requires abstract data representations only.
Other imagery: an actual product UI screenshot ("Human Resource Management System" app) in the case-study section — legitimate as a real "what we shipped" proof point, not decorative stock photography. A Palantir partner-logo lockup (third-party co-brand, not an Aavya asset) appears twice.
No mascots/characters/emoji observed. No warm colors observed in UI chrome.
`.trim(),
};

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
const iconMap = ["◉", "Aa", "⬡", "✦", "⊞", "⬚", "⊘", "◈"];

function ScoreRing({ score, size = 80 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r;
  const color = score >= 75 ? "#22d3a5" : score >= 50 ? "#a78bfa" : "#f87171";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
        fontSize={size*0.22} fontFamily="'JetBrains Mono',monospace" fontWeight="700">{score}</text>
    </svg>
  );
}

function StatusBadge({ status }) {
  const s = { pass: ["rgba(34,211,165,0.12)","#22d3a5","PASS"], warning: ["rgba(167,139,250,0.12)","#a78bfa","WARN"], fail: ["rgba(248,113,113,0.12)","#f87171","FAIL"] }[status] || ["rgba(248,113,113,0.12)","#f87171","FAIL"];
  return <span style={{ background: s[0], color: s[1], padding: "2px 10px", borderRadius: 999, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, letterSpacing: 2 }}>{s[2]}</span>;
}

function CategoryCard({ cat, icon }) {
  const [open, setOpen] = useState(false);
  const barColor = cat.score >= 75 ? "#22d3a5" : cat.score >= 50 ? "#a78bfa" : "#f87171";
  return (
    <div onClick={() => setOpen(!open)} style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${open?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "20px 24px", cursor: "pointer", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#94a3b8", fontFamily: "'JetBrains Mono',monospace" }}>{icon}</span>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 15, marginBottom: 5 }}>{cat.name}</div>
            <div style={{ height: 4, width: 120, background: "#1e293b", borderRadius: 99 }}>
              <div style={{ height: 4, width: `${cat.score * 1.2}px`, maxWidth: "100%", background: barColor, borderRadius: 99, transition: "width 1.2s ease" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StatusBadge status={cat.status} />
          <ScoreRing score={cat.score} size={52} />
          <span style={{ color: "#64748b", fontSize: 18, display: "inline-block", transform: open?"rotate(180deg)":"rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>FINDINGS</div>
            {cat.findings.map((f, i) => <div key={i} style={{ color: "#94a3b8", fontSize: 14, marginBottom: 6, paddingLeft: 16, borderLeft: "2px solid rgba(255,255,255,0.08)", lineHeight: 1.6 }}>{f}</div>)}
          </div>
          <div>
            <div style={{ color: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 8 }}>RECOMMENDATIONS</div>
            {cat.recommendations.map((r, i) => <div key={i} style={{ color: "#a78bfa", fontSize: 14, marginBottom: 6, paddingLeft: 16, borderLeft: "2px solid rgba(167,139,250,0.3)", lineHeight: 1.6 }}>→ {r}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report Generator ─────────────────────────────────────────────────────────
function downloadReport(result) {
  const statusColor = { pass: "#22d3a5", warning: "#f59e0b", fail: "#f87171" };
  const statusLabel = { pass: "PASS", warning: "WARN", fail: "FAIL" };
  const overallColor = result.overall_score >= 75 ? "#22d3a5" : result.overall_score >= 50 ? "#f59e0b" : "#f87171";
  const overallLabel = result.overall_score >= 75 ? "Brand Aligned" : result.overall_score >= 50 ? "Needs Work" : "Off-Brand";
  const auditDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const categoriesHtml = result.categories?.map(cat => {
    const col = statusColor[cat.status] || "#f87171";
    const findings = cat.findings?.map(f => `<li>${f}</li>`).join("") || "";
    const recs = cat.recommendations?.map(r => `<li>${r}</li>`).join("") || "";
    return `
      <div class="cat-card">
        <div class="cat-header">
          <div>
            <div class="cat-name">${cat.name}</div>
            <div class="cat-bar-track"><div class="cat-bar" style="width:${cat.score}%;background:${col}"></div></div>
          </div>
          <div class="cat-right">
            <span class="badge" style="background:${col}22;color:${col};border:1px solid ${col}44">${statusLabel[cat.status] || "FAIL"}</span>
            <span class="score" style="color:${col}">${cat.score}</span>
          </div>
        </div>
        <div class="cat-body">
          <div class="label">FINDINGS</div>
          <ul>${findings}</ul>
          <div class="label" style="margin-top:12px">RECOMMENDATIONS</div>
          <ul class="recs">${recs}</ul>
        </div>
      </div>`;
  }).join("") || "";

  const fixes = result.top_priority_fixes?.map((f, i) =>
    `<div class="fix"><span class="fix-num">${String(i+1).padStart(2,"0")}</span><span>${f}</span></div>`
  ).join("") || "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Aavya Brand Audit Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#060b16;color:#e2e8f0;font-family:'Inter',sans-serif;padding:48px 24px 80px;min-height:100vh}
  .page{max-width:800px;margin:0 auto}
  .chip{display:inline-flex;align-items:center;gap:6px;background:rgba(29,78,216,0.1);border:1px solid rgba(29,78,216,0.3);border-radius:999px;padding:4px 14px;font-size:11px;color:#93c5fd;font-family:'JetBrains Mono',monospace;letter-spacing:2px;margin-bottom:16px}
  h1{font-size:clamp(24px,5vw,38px);font-weight:700;background:linear-gradient(135deg,#e2e8f0 0%,#93c5fd 50%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-1px;line-height:1.15;margin-bottom:8px}
  .sub{color:#64748b;font-size:14px;margin-bottom:6px}
  .meta{color:#475569;font-size:11px;font-family:'JetBrains Mono',monospace;margin-bottom:36px}
  .overall{background:rgba(15,23,42,0.9);border:1px solid ${overallColor}33;border-radius:20px;padding:32px;margin-bottom:16px;display:flex;gap:32px;align-items:center;flex-wrap:wrap}
  .score-ring{flex-shrink:0}
  .overall-label-tag{color:#64748b;font-size:11px;letter-spacing:2px;font-family:'JetBrains Mono',monospace;margin-bottom:6px}
  .overall-verdict{color:${overallColor};font-size:26px;font-weight:700;letter-spacing:-0.5px;margin-bottom:10px}
  .summary{color:#94a3b8;font-size:14px;line-height:1.7}
  .fixes-box{background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.15);border-radius:16px;padding:20px 24px;margin-bottom:24px}
  .label{color:#64748b;font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:2px;margin-bottom:12px}
  .fix{display:flex;gap:12px;margin-bottom:8px;color:#fca5a5;font-size:14px;line-height:1.6}
  .fix-num{color:#f87171;font-family:'JetBrains Mono',monospace;flex-shrink:0}
  .section-label{color:#64748b;font-size:11px;letter-spacing:2px;font-family:'JetBrains Mono',monospace;margin-bottom:12px}
  .cat-card{background:rgba(15,23,42,0.7);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px 24px;margin-bottom:10px}
  .cat-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
  .cat-name{color:#e2e8f0;font-weight:600;font-size:15px;margin-bottom:6px}
  .cat-bar-track{height:4px;width:180px;background:#1e293b;border-radius:99px}
  .cat-bar{height:4px;border-radius:99px}
  .cat-right{display:flex;align-items:center;gap:12px}
  .badge{padding:2px 10px;border-radius:999px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:700;letter-spacing:2px}
  .score{font-size:22px;font-weight:700;font-family:'JetBrains Mono',monospace}
  .cat-body ul{list-style:none;padding:0}
  .cat-body ul li{color:#94a3b8;font-size:13px;line-height:1.6;padding:4px 0 4px 14px;border-left:2px solid rgba(255,255,255,0.08);margin-bottom:4px}
  .cat-body ul.recs li{color:#a78bfa;border-left-color:rgba(167,139,250,0.3)}
  .cat-body ul.recs li::before{content:"→ "}
  .footer{margin-top:40px;text-align:center;color:#1e293b;font-size:11px;font-family:'JetBrains Mono',monospace}
  .footer a{color:#334155;text-decoration:none}
  @media print{body{background:#060b16!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
  <div class="chip">◈ AAVYA BRAND AUDIT ENGINE v2.1</div>
  <h1>Brand Audit Report</h1>
  <div class="sub">Audited URL: <strong style="color:#93c5fd">${result.url}</strong></div>
  <div class="meta">Generated on ${auditDate} · Aavya Brand Standards</div>

  <div class="overall">
    <svg class="score-ring" width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="6"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="${overallColor}" stroke-width="6"
        stroke-dasharray="${(result.overall_score/100)*2*Math.PI*45} ${2*Math.PI*45}"
        stroke-linecap="round" transform="rotate(-90 50 50)"/>
      <text x="50" y="55" text-anchor="middle" fill="${overallColor}" font-size="22"
        font-family="'JetBrains Mono',monospace" font-weight="700">${result.overall_score}</text>
    </svg>
    <div style="flex:1;min-width:200px">
      <div class="overall-label-tag">OVERALL BRAND COMPLIANCE</div>
      <div class="overall-verdict">${overallLabel}</div>
      <div class="summary">${result.executive_summary}</div>
    </div>
  </div>

  <div class="fixes-box">
    <div class="label">TOP PRIORITY FIXES</div>
    ${fixes}
  </div>

  <div class="section-label">CATEGORY BREAKDOWN</div>
  ${categoriesHtml}

  <div class="footer">Audited against · <a href="https://registry-dev.aavya.com/">registry-dev.aavya.com</a></div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const domain = new URL(result.url).hostname.replace("www.", "");
  a.download = `aavya-audit-${domain}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AavyaAudit() {
  const [url, setUrl]       = useState("https://aavya.com/");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [phase, setPhase]     = useState("");

  const handleRunAudit = async () => {
    if (!url.trim()) return;
    if (!API_KEY) {
      setError("API key not configured. Add VITE_GROQ_API_KEY to your .env file.");
      return;
    }
    setLoading(true); setError(""); setResult(null);
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    const cacheKey = targetUrl.endsWith("/") ? targetUrl : targetUrl + "/";
    try {
      const siteInfo = KNOWN_CONTENT[cacheKey] || KNOWN_CONTENT[targetUrl] || `URL: ${targetUrl}\n(No pre-fetched content. Infer brand characteristics from domain and flag assumptions.)`;
      setPhase("Analysing website content...");
      await new Promise(r => setTimeout(r, 300));
      setPhase("Running brand audit...");
      const raw = await runAuditCall(
        SYSTEM_PROMPT,
        `Audit this website against Aavya brand standards.\n\nURL: ${targetUrl}\n\nWebsite Content:\n${siteInfo}\n\nRespond ONLY with the raw JSON object.`
      );
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response: " + raw.slice(0, 200));
      const parsed = JSON.parse(match[0]);
      setResult({ ...parsed, url: targetUrl });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false); setPhase("");
    }
  };

  const overallColor = result ? (result.overall_score >= 75 ? "#22d3a5" : result.overall_score >= 50 ? "#a78bfa" : "#f87171") : "#3b82f6";

  return (
    <div style={{ minHeight: "100vh", background: "#060b16", color: "#e2e8f0", fontFamily: "'Inter',sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(29,78,216,0.15) 0%, transparent 70%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(29,78,216,0.1)", border: "1px solid rgba(29,78,216,0.3)", borderRadius: 999, padding: "4px 14px", marginBottom: 18, fontSize: 11, color: "#93c5fd", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>
            ◈ AAVYA BRAND AUDIT ENGINE v2.1
          </div>
          <h1 style={{ fontSize: "clamp(26px,5vw,40px)", fontWeight: 700, margin: "0 0 10px", background: "linear-gradient(135deg,#e2e8f0 0%,#93c5fd 50%,#a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -1, lineHeight: 1.1 }}>
            Website Brand Compliance
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            Audit any website against Aavya brand standards — color, typography, shape language, tone, and more.
          </p>
        </div>

        {/* URL Input Panel */}
        <div style={{ background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px", marginBottom: 20 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 10 }}>TARGET URL</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && handleRunAudit()}
              placeholder="https://example.com"
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "'JetBrains Mono',monospace" }}
            />
            <button onClick={handleRunAudit} disabled={loading || !url.trim()}
              style={{ background: loading ? "rgba(29,78,216,0.2)" : "linear-gradient(135deg,#1d4ed8,#6d28d9)", border: "none", borderRadius: 10, padding: "12px 26px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: loading ? 0.5 : 1, transition: "opacity 0.2s", minWidth: 130 }}>
              {loading ? "Auditing..." : "Run Audit →"}
            </button>
          </div>

          {/* Loading / error */}
          {loading && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, border: "2px solid rgba(167,139,250,0.3)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <span style={{ color: "#64748b", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{phase}</span>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 14, color: "#f87171", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", background: "rgba(248,113,113,0.06)", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #f87171", lineHeight: 1.7 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={() => downloadReport(result)}
                style={{ background: "rgba(34,211,165,0.1)", border: "1px solid rgba(34,211,165,0.3)", borderRadius: 10, padding: "10px 20px", color: "#22d3a5", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 0.5, transition: "all 0.2s" }}>
                Download Report
              </button>
            </div>
            <div style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${overallColor}33`, borderRadius: 20, padding: "32px", marginBottom: 14, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <ScoreRing score={result.overall_score} size={100} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>OVERALL BRAND COMPLIANCE</div>
                <div style={{ color: overallColor, fontSize: 28, fontWeight: 700, letterSpacing: -1, marginBottom: 10 }}>
                  {result.overall_score >= 75 ? "Brand Aligned" : result.overall_score >= 50 ? "Needs Work" : "Off-Brand"}
                </div>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{result.executive_summary}</p>
              </div>
            </div>
            <div style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 16, padding: "20px 24px", marginBottom: 14 }}>
              <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>⚡ TOP PRIORITY FIXES</div>
              {result.top_priority_fixes?.map((fix, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8, color: "#fca5a5", fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: "#f87171", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
                  <span>{fix}</span>
                </div>
              ))}
            </div>
            <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>CATEGORY BREAKDOWN — click to expand</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.categories?.map((cat, i) => <CategoryCard key={cat.id||i} cat={cat} icon={iconMap[i]||"◈"} />)}
            </div>
            <div style={{ marginTop: 32, textAlign: "center", color: "#1e293b", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              Audited against · <a href="https://registry-dev.aavya.com/" target="_blank" rel="noreferrer" style={{ color: "#334155", textDecoration: "none" }}>registry-dev.aavya.com</a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        input:focus { border-color: rgba(167,139,250,0.5) !important; }
        * { box-sizing: border-box; }
        button:hover:not(:disabled) { filter: brightness(1.12); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
    </div>
  );
}
