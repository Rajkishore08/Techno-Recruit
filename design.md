# 🎨 Techno Recruit — Design System & Style Specification (`design.md`)

## 🌟 Overview & Aesthetics Persona
**Techno Recruit** follows a **Deep Space Cyberpunk & Dark Glassmorphism Enterprise Theme**. 

The design combines high-contrast neon accents, translucent glass surfaces with backdrop blur, glowing gradients, and ultra-crisp typography. The layout is crafted to give recruiters, HR managers, and candidates a state-of-the-art AI command-center experience.

---

## 🎨 Color Palette & Design Tokens

### 1. Backgrounds & Surfaces
| Token Name | Hex / Value | Description & Application |
| :--- | :--- | :--- |
| `--bg-base` | `#020617` | Deep slate canvas background with subtle ambient radial glows |
| `--bg-surface` | `#0b1120` | Secondary container & panel background |
| `--bg-card` | `#111827` | Primary card container background |
| `--bg-card-secondary` | `#1e293b` | Elevating nested elements, code blocks, & metric tiles |

### 2. Primary Brand & Accent Colors
| Token Name | Hex / Value | Description & Application |
| :--- | :--- | :--- |
| `--color-primary` | `#1d4ed8` | Deep Electric Blue — Primary buttons, active tab borders |
| `--color-secondary` | `#2563eb` | Cobalt Blue — Hover states, progress indicators |
| `--color-neon` | `#3b82f6` | Neon Blue — Focus rings, active icons, badge glows |
| `--color-accent` | `#38bdf8` | Sky Cyan — High-priority callouts, AI Role Match badges |
| `--color-ice` | `#7dd3fc` | Ice Blue — Subheadings, secondary badges |

### 3. Persona Suite Categorization Colors
| Persona | Accent Color | Container Glow / Border | Application |
| :--- | :--- | :--- | :--- |
| **👤 Candidate Suite** | `#38bdf8` (Cyan) | `rgba(56, 189, 248, 0.2)` | Career Navigator, ATS Optimizer, Voice Interviewer |
| **👔 Recruiter Suite** | `#c084fc` (Purple) | `rgba(168, 85, 247, 0.2)` | Candidate Battle-Card, Talent Search (RAG), Interview Architect |

### 4. Status & Feedback Colors
| Status | Hex | Application |
| :--- | :--- | :--- |
| **Success** | `#22c55e` | High match scores (80%+), positive rubric items, active deployment status |
| **Warning** | `#facc15` / `#f59e0b` | Moderate fit scores (50-79%), candidate trade-off risks, alert banners |
| **Error / Critical** | `#ef4444` | ATS keyword gaps, red flags (<50%), microphone recording state |
| **Info / Neutral** | `#38bdf8` | Tooltips, platform tour steps, category pills |

### 5. Typography Colors
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` | Main headings, card titles, primary body text |
| `--text-secondary` | `#cbd5e1` | Subtitles, descriptions, input field text |
| `--text-muted` | `#94a3b8` | Placeholders, timestamps, metadata labels |
| `--text-disabled` | `#64748b` | Disabled buttons & inactive pagination controls |

---

## 📐 Gradients & Visual Effects

```css
/* Brand Gradients */
--gradient-brand: linear-gradient(135deg, #1d4ed8 0%, #2563eb 30%, #3b82f6 65%, #38bdf8 100%);
--gradient-primary: linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%);
--gradient-card: linear-gradient(180deg, #111827 0%, #0b1120 100%);
--gradient-hero: radial-gradient(circle, #2563eb 0%, #1d4ed8 35%, #020617 100%);
```

### Ambient Background Mesh
The body background features multi-layered ambient radial glows:
```css
body {
    background-color: #020617;
    background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
        radial-gradient(at 50% 0%, rgba(168, 85, 247, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%);
}
```

### Glassmorphism Surfaces & Shadows
```css
.card {
    background: rgba(17, 24, 39, 0.85);
    backdrop-filter: blur(18px);
    border: 1px solid rgba(59, 130, 246, 0.25);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.6), 0 0 20px rgba(59, 130, 246, 0.15);
    border-radius: 16px;
}
```

---

## 🔤 Typography System

- **Heading Font Family**: `'Plus Jakarta Sans'`, `'Outfit'`, `'Inter'`, sans-serif
- **Body Font Family**: `'Inter'`, sans-serif
- **Code / Technical Output**: `'Fira Code'`, `'JetBrains Mono'`, monospace

### Hierarchy Scale
- **H1 (Header Title)**: `24px` / `28px` — `font-weight: 800`
- **H2 (Section Header)**: `18px` / `20px` — `font-weight: 800`
- **H3 (Card Title)**: `16px` — `font-weight: 700`
- **Body Text**: `13.5px` / `14px` — `font-weight: 400` / `500` — `line-height: 1.5`
- **Badges & Micro Labels**: `10px` / `11px` — `font-weight: 800` — `letter-spacing: 0.5px`

---

## 🧩 Component Style Patterns

### 1. Navigation Header & Suite Categorization
The header tabs split options into two distinct pill containers:
- **👤 Candidate Suite**: Bordered with `#38bdf8` cyan glow (`/navigator`, `/ats-optimizer`, `/voice-interview`).
- **👔 Recruiter Suite**: Bordered with `#c084fc` purple glow (`/battlecard`, `/talent-search`, `/architect`).

### 2. Document Dropzones & File Uploaders
- Translucent dashed dropzone (`border: 2px dashed rgba(59, 130, 246, 0.4)`).
- Drag-over highlight state (`background: rgba(59, 130, 246, 0.15)`, `border-color: #38bdf8`).
- Supports `.pdf`, `.docx`, `.txt` with automatic text extraction and badge preview.

### 3. Voice-to-Text Microphone Taker
- Normal state: Glass pill button with `<Mic size={13} />`.
- Recording active state: Pulsating red glow (`rgba(239, 68, 68, 0.25)`), `<MicOff size={13} className="spin" />`, and red dot indicator.

### 4. Interactive Radar Charts & Decision Matrix
- Uses SVG-rendered radar charts and multi-axis progress bars for head-to-head candidate battle cards.
- Winner candidate highlighted with gold badge (`#f59e0b`).

---

## 🖨️ PDF & Print Export Styles (`@media print`)
When printing or exporting PDF guides:
- Background switches to clean high-contrast `#ffffff`.
- Text changes to deep navy `#0f172a`.
- Non-printable UI elements (`.top-header`, `.sidebar`, `.app-tabs`, `.floating-history-btn`, `button`) are hidden (`display: none !important`).
- Dedicated `.printable-pdf-report` container expands to 100% width with clean margins.
