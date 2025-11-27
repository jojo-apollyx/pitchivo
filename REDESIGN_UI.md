Absolutely — I will upgrade your spec to **explicitly include style names** so the AI understands the intended aesthetic **by vocabulary**, not only by instructions.
This is extremely important because AI models respond much better to *named aesthetics* such as **Light Minimalism**, **Notion-style**, **Flat Design**, **Soft Pastel UI**, **Document-Flow Layout**, etc.

Below is the **enhanced and final version** of your “Design System Refactor Blueprint” with **all style names explicitly stated** in every section so the AI understands the high-level style direction AND the specific technical details.

---

# 🌟 **THE SUPREME UI REFACTOR BLUEPRINT (WITH STYLE NAMES)**

### *(Light Minimalism · Notion-Style · Flat Design · Soft Pastel UI · Unified Document Layout · Premium Micro-Interactions)*

Use this specification to refactor the entire website.

This blueprint clearly communicates to AI that we want a specific aesthetic:

### ➤ **“Light Minimalism + Notion-style + Flat UI + Soft Pastel Theme + Unified Document Layout”**

AI will recognize these keywords and follow the visual philosophy correctly.

---

# ⭐ **SECTION 0 — STYLE NAME SUMMARY (for AI understanding)**

Describe the final style as:

> **“A Light Minimalism / Notion-style interface with a Flat Design visual language, using Soft Pastel colors and a Unified Document-like layout, enhanced by subtle premium micro-interactions.”**

This ensures AI adopts the correct aesthetic.

### Core Style Names to Include (AI-friendly vocab):

* **Light Minimalism**
* **Notion-Style Aesthetic**
* **Flat Design (No shadows, no gloss)**
* **Soft Pastel Theming**
* **Unified Document-Flow Layout**
* **Functional Modern UI**
* **Calm Tech Aesthetic** (optional — conveys soft, unobtrusive UI)

---

# 🧱 SECTION 1 — GLOBAL THEME ARCHITECTURE

### **Style Names Used:** Light Minimalism · Notion-like · Flat UI · Pastel System

You must explicitly tell the AI:

> “The design foundation uses Light Minimalism and Notion-style patterns: white canvas, soft neutrals, flat surfaces, pastel accents tied to the primary color.”

---

## 1.1 Global CSS Variables (Theme DNA)

These values define the **Light Minimalism / Notion-like neutral palette**.

*(This section stays mostly the same, but add style names in comments.)*

```css
@layer base {
  :root {
    /* -------------------------------------------------------------
       LIGHT MINIMALISM CANVAS (Notion-like neutral palette)
       Clean white base, soft gray structure, flat surfaces.
    --------------------------------------------------------------*/
    --background: 0 0% 100%; 
    --foreground: 222 47% 11%; 

    --secondary: 210 40% 96%;  /* Soft gray - Flat UI neutral */
    --border: 214 32% 91%;      /* Ultra-light borders only */

    /* -------------------------------------------------------------
       PRIMARY THEME COLOR (Soft Pastel System)
       Changing this = whole theme adapts. Flat design color logic.
    --------------------------------------------------------------*/
    --primary: 221 83% 53%; 
    --primary-foreground: 210 40% 98%;

    /* -------------------------------------------------------------
       FRIENDLY, ROUNDED GEOMETRY (Minimal modern UI)
    --------------------------------------------------------------*/
    --radius: 0.75rem;
  }

  body {
    /* Notion-style document feel */
    @apply bg-background text-foreground antialiased;
  }
}
```

---

# ✒️ SECTION 2 — TYPOGRAPHY SYSTEM

### **Style Names:** Notion-style Typography · Modern Sans-Serif Minimalism

Describe to AI:

> “Typography follows the Notion-style minimal document aesthetic: tight headings, relaxed body text, soft gray metadata.”

Use Inter or Plus Jakarta Sans.

---

# 🧩 SECTION 3 — COMPONENT BLUEPRINTS

### **Style Names in this section:**

* Flat Design
* Soft Pastel Components
* Light Minimal Interaction
* Notion-like Input Fields
* Minimal White-Space Cards

Explain to AI:

> “All components should be flat — no drop-shadows, no 3D, no skeuomorphic depth. Use flat surfaces + pastel backgrounds derived from the primary color.”

---

## 3.1 Primary Button

**Style names:** Flat Design · Soft Pastel Hover · Minimal Interaction

Add this sentence:

> “Button follows Flat Design conventions: no gradients, no shadows, only color + scale micro-interactions.”

---

## 3.2 Input Field

**Style Names:** Notion-style Input · Minimal Borderless Field · Gentle Focus Glow

Add:

> “Inputs must resemble Notion fields: nearly invisible until focused, then gently highlighted with the primary color.”

---

## 3.3 Soft Feature Card

**Style Names:** Flat Pastel Card · Light Minimalism Section Block

Add:

> “Feature cards are not boxed cards; they are flat pastel highlights, inspired by Notion’s soft block elements.”

---

## 3.4 Sidebar

**Style Names:** Soft Glass Minimalism · Transparent Neutral Pane

Add:

> “Sidebar uses a soft glass-minimalism look: translucent, neutral, no shadows.”

---

# 🌬 SECTION 4 — MICRO-INTERACTIONS

### **Style Names:** Premium Micro-Interactions · Soft Motion · Calm UI Movement

Teach AI the design philosophy:

> “Animations must follow a Calm Tech philosophy: subtle, soft, non-distracting, high-end.”

Include the style names:

* **Soft Fade-in Motion**
* **Minimal Hover Drift**
* **Flat Scale Feedback**
* **Pastel Focus Glow**

---

# 📄 SECTION 5 — LAYOUT PHILOSOPHY

### **Style Names:** Unified Document Layout · Notion-like Flow · Anti-Card UI

AI MUST understand this rule:

> “The layout follows a Notion-like document flow, not the typical SaaS card-grid layout. Avoid boxy containers; use whitespace and typography to structure content.”

Explicitly tell the AI:

* No card grids
* No shadowed rectangles
* No “dashboard tiles”
* No heavy borders

Instead:

* Document-style flow
* Large breathing margins
* Soft pastel highlights
* Sections separated by space, not boxes

---

# 📌 SECTION 6 — FINAL “STYLE NAME REFERENCE” TABLE

This ensures AI locks onto the correct aesthetic.

| Concept           | Style Name to Use                     |
| ----------------- | ------------------------------------- |
| Overall aesthetic | **Light Minimalism**                  |
| Inspiration       | **Notion-style UI**                   |
| Surface style     | **Flat Design**                       |
| Colors            | **Soft Pastel Theme**                 |
| Structure         | **Unified Document Layout**           |
| Tone              | **Calm Tech, Quiet UI**               |
| Components        | **Flat Minimal Components**           |
| Animations        | **Subtle Premium Micro-Interactions** |
| Inputs            | **Notion-like Input Fields**          |
| Buttons           | **Flat Tactile Buttons**              |

You MUST keep these terms in the prompt — this is how the AI latches onto the style.

---

# 🎁 If you want, I can now also generate:

### ✔ A shorter “AI Prompt Version” (1-2 paragraphs)

### ✔ A full “Design QA Checklist” for developers

### ✔ A Shadcn-compatible theme preset (full config)

### ✔ A Figma-ready template description

Just tell me what version you want next.
