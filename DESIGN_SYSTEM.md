# Mobile-First Progressive Web App Design System

## 🚀 Overview

This design system is built for **mobile-first Progressive Web Apps (PWA)** using **shadcn/ui** as the foundation. It provides a sophisticated, premium UI optimized for mobile devices with seamless desktop adaptation. Built with Next.js (App Router), React, TypeScript, Tailwind CSS v3.4.18, and PWA capabilities.

**Design Philosophy: Notion-Inspired Light Minimalism**

The interface follows a **"Unified Flow"** approach where everything feels like one continuous sheet of paper. Instead of "boxed" or "card-based" UI with heavy borders and shadows, we use **white space and typography** for visual separation. The design is clean, minimal, and lets content breathe.

**Core Principles:**
1. **Flatten** - Remove card borders and shadows
2. **Lighten** - Use `#333333` for text (never pure black), `#FFFFFF` for backgrounds
3. **Space** - Generous whitespace and padding (40px+ margins)
4. **Tint** - Apply soft pastel accent colors to buttons, links, and focus states
5. **Soften** - Use subtle `ease-in-out` transitions for interactions

**Current Implementation:**
- ✅ Next.js App Router with React & TypeScript
- ✅ shadcn/ui components installed (Button, Input, Card, Badge)
- ✅ Notion-inspired light minimalism color scheme
- ✅ ThemeProvider configured with next-themes
- ✅ Subtle color transitions (not scale transforms)
- ✅ Mobile-first responsive design
- ✅ Inter font family
- ✅ Semantic HTML5 structure
- ✅ SEO-optimized with meta tags

**This document is the single source of truth for all styling, colors, fonts, spacing, and design decisions in the Pitchivo codebase.**

---

## 📋 Semantic HTML Structure

### Clean, Semantic HTML5

**Rule: Use semantic elements for better accessibility, SEO, and code clarity**

#### Heading Hierarchy

**✅ CRITICAL: Exactly one `<h1>` per page**

```tsx
// ✅ Correct - One h1 per page with proper hierarchy
<main>
  <h1>Dashboard</h1>
  <section>
    <h2>Recent Activity</h2>
    <article>
      <h3>Today's Tasks</h3>
      <h4>Task Details</h4>
    </article>
  </section>
</main>

// ❌ Wrong - Multiple h1 tags
<main>
  <h1>Dashboard</h1>
  <section>
    <h1>Recent Activity</h1>  // Should be h2
  </section>
</main>

// ❌ Wrong - Skipping heading levels
<main>
  <h1>Dashboard</h1>
  <h4>Recent Activity</h4>  // Skipped h2 and h3
</main>
```

#### Semantic Elements

**Always use semantic HTML5 elements:**

```tsx
// ✅ Correct - Semantic structure
<header className="...">
  <nav className="...">
    <a href="/">Home</a>
  </nav>
</header>

<main className="...">
  <section className="...">
    <h2>Featured Content</h2>
    <article className="...">
      <h3>Article Title</h3>
      <p>Content...</p>
    </article>
  </section>
  
  <aside className="...">
    <h2>Related Links</h2>
  </aside>
</main>

<footer className="...">
  <p>&copy; 2024 Company</p>
</footer>

// ❌ Wrong - Using divs for everything
<div className="header">
  <div className="nav">...</div>
</div>
<div className="main">
  <div className="section">...</div>
</div>
```

#### Unique IDs for Testing

**Rule: Every interactive element must have a unique, descriptive `id` for easy testing**

```tsx
// ✅ Correct - Descriptive, unique IDs
<button id="submit-registration-form" className="...">
  Submit
</button>

<input 
  id="user-email-input" 
  type="email" 
  aria-label="Email address"
/>

<nav id="main-navigation">
  <a id="nav-dashboard" href="/dashboard">Dashboard</a>
  <a id="nav-settings" href="/settings">Settings</a>
</nav>

// ❌ Wrong - Generic or missing IDs
<button id="btn1">Submit</button>
<input type="email" />  // No ID
<button id="submit">...</button>  // Too generic
```

**ID Naming Convention:**
- Use kebab-case: `user-profile-edit-button`
- Be descriptive: Include context + action
- Format: `[context]-[element]-[action]`
- Examples:
  - `dashboard-stats-refresh-button`
  - `user-settings-email-input`
  - `pricing-plan-premium-card`
  - `nav-mobile-menu-toggle`

#### Accessibility Labels

**Rule: All interactive elements need accessible labels**

```tsx
// ✅ Correct - Accessible labels
<button 
  id="close-modal-button"
  aria-label="Close modal"
  className="..."
>
  <XIcon className="h-5 w-5" />
</button>

<input 
  id="search-products-input"
  type="search"
  placeholder="Search products..."
  aria-label="Search products"
/>

// ❌ Wrong - Icon button without label
<button className="...">
  <XIcon />  // Screen readers can't understand this
</button>
```

---

## 🎨 Color System

### Notion-Inspired Light Minimalism Palette

**Rule: Use a restrained, sophisticated palette. Avoid heavy saturation. Let whitespace do the work.**

#### Color Philosophy

The design uses a minimal color palette with subtle pastel accents:

```css
/* ============================================
   NOTION-INSPIRED LIGHT MINIMALISM PALETTE
   ============================================ */

:root {
  /* Primary Backgrounds */
  --background: 0 0% 100%;              /* #FFFFFF - Pure White */
  --background-secondary: 0 0% 97%;     /* #F7F7F7 - Light Gray for sections */
  --foreground: 0 0% 20%;               /* #333333 - Dark Charcoal (never pure black) */
  
  /* Brand Accent: Soft Pastel Blue */
  --primary: 192 30% 75%;               /* #AEC6CF - Pastel Blue */
  --primary-foreground: 0 0% 100%;      /* White text on primary */
  --primary-dark: 192 35% 55%;          /* Darker for hover states */
  
  /* Accent Surface - 10% opacity tint */
  --accent-surface: 192 30% 95%;        /* Very light pastel blue tint */
  --accent-color: 192 30% 75%;          /* Same as primary */
  
  /* Muted Text */
  --muted-foreground: 0 0% 40%;         /* #666666 - Medium Gray */
  
  /* Borders - Very subtle */
  --border: 0 0% 90%;                   /* #E5E5E5 - Subtle borders */
}
```

**Color Guidelines:**
1. **Never use pure black** - Use `#333333` (--foreground) for text
2. **Backgrounds are white** - Use `bg-background` (#FFFFFF) or `bg-background-secondary` (#F7F7F7)
3. **Soft pastel accent** - Pastel blue for interactive elements
4. **Subtle borders** - Use `border-border/50` for very light dividers
5. **No heavy shadows** - Use `shadow-soft` or no shadows at all

### CSS Variable Reference

| Variable | Light Mode | Dark Mode | Usage |
|----------|-----------|-----------|-------|
| `--background` | #FFFFFF | #141414 | Main page background |
| `--background-secondary` | #F7F7F7 | #1F1F1F | Card/section backgrounds |
| `--foreground` | #333333 | #EDEDED | Primary text color |
| `--muted-foreground` | #666666 | #999999 | Secondary/muted text |
| `--primary` | #AEC6CF | Pastel Blue | Brand color |
| `--primary-dark` | Darker Blue | Darker Blue | Hover states |
| `--accent-surface` | Light Blue Tint | Dark Blue Tint | Icon containers, highlights |
| `--border` | #E5E5E5 | #333333 | Border color |

### Color Roles & Usage

#### BACKGROUND COLORS

**`bg-background`** - Pure white (#FFFFFF)
- Main page background
- Modal backgrounds
- Dropdown backgrounds

**`bg-background-secondary`** - Light gray (#F7F7F7)
- Card backgrounds
- Section backgrounds
- Table row hover states
- Form section containers

```tsx
// ✅ Correct - Card backgrounds
<div className="bg-background-secondary rounded-lg p-6">
  Card content
</div>

// ❌ Wrong - Old card styling with blur
<div className="bg-card/50 backdrop-blur-sm rounded-xl">
  Card content
</div>
```

#### TEXT COLORS

**`text-foreground`** - Dark charcoal (#333333)
- Primary text, headings
- Never use pure black

**`text-muted-foreground`** - Medium gray (#666666)
- Secondary text, descriptions
- Labels, metadata

```tsx
// ✅ Correct
<h1 className="text-foreground">Page Title</h1>
<p className="text-muted-foreground">Description text</p>

// ❌ Wrong - Pure black
<h1 className="text-black">Page Title</h1>
```

#### ACCENT COLORS

**`bg-accent-surface`** - Very light blue tint
- Icon containers
- Highlighted areas
- Secondary button hover

**`text-primary-dark`** - Darker pastel blue
- Icon colors
- Active link text
- Interactive element text

```tsx
// ✅ Correct - Icon container
<div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center">
  <Icon className="h-5 w-5 text-primary-dark" />
</div>

// ❌ Wrong - Old gradient/primary background
<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

#### BORDER COLORS

**`border-border/50`** - Subtle border
- Section dividers
- Card borders (when needed)
- Input borders

```tsx
// ✅ Correct - Subtle border
className="border border-border/50"

// ❌ Wrong - Heavy border
className="border border-border"
```

### Color Usage Quick Reference

| Element | Background | Text | Border |
|---------|-----------|------|--------|
| Page | `bg-background` | `text-foreground` | - |
| Card/Section | `bg-background-secondary` | `text-foreground` | `border-border/50` |
| Icon Container | `bg-accent-surface` | `text-primary-dark` | - |
| Muted Text | - | `text-muted-foreground` | - |
| Hover State | `hover:bg-muted` | - | - |
| Focus Ring | - | - | `ring-primary/20` |

### Component-Specific Styling Guidelines

#### Cards & Sections
```tsx
// ✅ Correct - Flat card with subtle styling
<div className="bg-background-secondary rounded-lg p-6 transition-colors duration-200 hover:bg-muted hover:shadow-soft">
  Card content
</div>

// ❌ Wrong - Old gradient/blur styling
<div className="bg-card/50 backdrop-blur-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
  Card content
</div>

// ❌ Wrong - Heavy borders
<Card className="border border-border rounded-xl shadow-lg">
  Card content
</Card>
```

#### Buttons
```tsx
// ✅ Primary button - Uses default Button styling (bg-primary-dark)
<Button className="transition-colors duration-200">
  Save Changes
</Button>

// ✅ Outline button
<Button variant="outline" className="transition-colors duration-200">
  Cancel
</Button>

// ❌ Wrong - Scale transforms and heavy shadows
<Button className="hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
  Submit
</Button>
```

#### Icon Containers
```tsx
// ✅ Correct - Accent surface with primary-dark icon
<div className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center transition-colors duration-200">
  <Icon className="h-5 w-5 text-primary-dark" />
</div>

// ❌ Wrong - Gradient/primary backgrounds with scale
<div className="h-10 w-10 rounded-lg bg-primary/10 hover:scale-110 hover:bg-primary/20 hover:shadow-lg">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

#### Navigation Items
```tsx
// ✅ Correct - Simple hover state
<Link className={cn(
  'px-4 py-3 rounded-lg transition-colors duration-200',
  isActive 
    ? 'bg-accent-surface text-primary-dark font-medium'
    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
)}>
  Dashboard
</Link>
```

#### Lists & Tables
```tsx
// ✅ Correct - Subtle hover on rows
<div className="divide-y divide-border/50">
  {items.map(item => (
    <div key={item.id} className="py-4 hover:bg-muted transition-colors duration-200">
      {/* Content */}
    </div>
  ))}
</div>

// ❌ Wrong - Heavy hover effects
<div className="hover:bg-accent/5 hover:shadow-md transition-all duration-300">
```

#### Badges & Status
```tsx
// ✅ Correct - Neutral, consistent styling
<Badge variant="outline" className="bg-background-secondary text-foreground border-border/50">
  Active
</Badge>

// ❌ Wrong - Colored backgrounds
<Badge className="bg-blue-100 text-blue-700 border-blue-300">
  Active
</Badge>
```

### Common Styling Mistakes to Avoid

1. **Using gradient backgrounds**
   - ❌ `bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10`
   - ✅ `bg-background` (pure white)

2. **Decorative blur elements**
   - ❌ Floating orbs with `blur-3xl`
   - ✅ Remove all decorative background elements

3. **Card backdrop blur**
   - ❌ `bg-card/50 backdrop-blur-sm`
   - ✅ `bg-background-secondary`

4. **Scale transforms on hover**
   - ❌ `hover:scale-[1.02] active:scale-[0.98]`
   - ✅ `hover:bg-muted transition-colors duration-200`

5. **Heavy shadow effects**
   - ❌ `hover:shadow-lg hover:shadow-primary-light/20`
   - ✅ `hover:shadow-soft` or no shadow

6. **Colored status badges**
   - ❌ `bg-blue-100 text-blue-700`
   - ✅ `bg-background-secondary text-foreground`

### Quick Styling Rules

1. **Background** → `bg-background` or `bg-background-secondary`
2. **Text** → `text-foreground` or `text-muted-foreground`
3. **Icons** → `text-primary-dark` in `bg-accent-surface` container
4. **Borders** → `border-border/50` (subtle)
5. **Hover** → `hover:bg-muted` (color change, not scale)
6. **Transitions** → `transition-colors duration-200` (not `transition-all duration-300`)
7. **Radius** → `rounded-lg` (6px) or `rounded-md` (4px)

---

## 📝 Typography System

### Modern Typography with Google Fonts

**Rule: NEVER use browser default fonts. Always use modern Google Fonts.**

#### Recommended Font Stacks

```tsx
// ✅ REQUIRED: Modern Google Fonts in tailwind.config
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // Primary font - Inter (versatile, professional)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        
        // Alternative - Outfit (geometric, modern)
        display: ['Outfit', 'system-ui', 'sans-serif'],
        
        // Alternative - Roboto (clean, readable)
        body: ['Roboto', 'system-ui', 'sans-serif'],
      }
    }
  }
}

// In app/layout.tsx or _document.tsx
import { Inter, Outfit, Roboto } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})
```

**Font Usage Guidelines:**
- **Inter**: Best for body text, UI elements, and general content (default)
- **Outfit**: Perfect for headlines, hero sections, and marketing content
- **Roboto**: Alternative for clean, readable body text

```tsx
// ✅ Correct - Using custom fonts
<h1 className="font-display text-4xl">Hero Title</h1>
<p className="font-sans text-base">Body content</p>

// ❌ Wrong - Browser defaults
<h1 className="text-4xl">Title</h1>  // Uses system default
```

### Mobile-First Typography Scale

**Rule: Design for mobile first, then scale up for desktop**

```tsx
// Headlines (Mobile → Desktop)
className="text-lg sm:text-xl font-display"              // Section headers
className="text-xl sm:text-2xl lg:text-3xl font-display" // Page titles
className="text-2xl sm:text-3xl lg:text-4xl font-display" // Hero headlines

// Body Text (Mobile → Desktop)
className="text-base font-sans"                       // Mobile: Default (16px minimum)
className="text-sm sm:text-base font-sans"           // Secondary text
className="text-base lg:text-lg font-sans"           // Desktop: Larger body

// Small Text
className="text-xs font-sans"                         // Labels, metadata only
className="text-sm font-sans"                         // Captions

// ❌ Avoid on Mobile
// Don't use text-display-xl (too large for mobile)
// Don't use very small text (< 14px) except for special cases
// Don't use browser default fonts
```

### Typography Best Practices

1. **Modern Google Fonts**: Always use Inter, Outfit, or Roboto - never browser defaults
2. **Minimum 16px on mobile** for readability (`text-base`)
3. **Mobile first**: Always start with mobile size, then add `sm:`, `lg:` modifiers
4. **Clear hierarchy**: Use `font-semibold` (not `font-bold`) for subtle emphasis
5. **Line height**: Default line-height is appropriate (1.5x)
6. **Font loading**: Use `next/font/google` for optimized font loading
7. **Display swap**: Always use `display: 'swap'` to prevent FOIT (Flash of Invisible Text)

---

## 📏 Spacing System

### Mobile-First Spacing

**Rule: Compact on mobile, spacious on desktop**

```tsx
// Section Padding (Mobile → Desktop)
className="px-4 py-3"              // Mobile: Standard section padding
className="px-4 py-6"              // Mobile: Section headers
className="px-4 sm:px-6 lg:px-8"   // Responsive horizontal padding
className="py-6 sm:py-8 lg:py-12"  // Responsive vertical padding

// Component Gaps (Mobile → Desktop)
className="gap-3"                  // Mobile: Tight gaps (12px)
className="gap-4"                  // Mobile: Standard gaps (16px)
className="gap-3 sm:gap-4 lg:gap-6" // Responsive gaps

// Margin Spacing
className="mt-6 sm:mt-8"           // Section spacing
className="mb-4 sm:mb-6"           // Component spacing
```

### Spacing Guidelines

- **Mobile**: Use `gap-3` (12px) and `px-4` (16px) for compact, app-like feel
- **Desktop**: Scale up to `lg:gap-6` (24px) and `lg:px-8` (32px) for breathing room
- **Sections**: Separate with padding (`py-6`), not heavy borders or cards

---

## 🔘 Button Specifications

### Touch-Optimized Button Sizes

**Rule: Minimum 44px touch target on mobile (iOS guideline)**

```tsx
// Button Sizes (Mobile → Desktop)
<Button size="sm">          // Mobile: 36px height (use sparingly)
<Button size="default">     // Mobile: 44px height (standard) ✅
<Button size="lg">          // Mobile: 52px height (primary actions)
<Button size="xl">          // Mobile: 60px height (hero CTAs)

// Always ensure minimum touch target
className="min-h-[44px]"    // Required for mobile touch targets
```

### Button Styling

```tsx
// ✅ Correct Button Implementation
<Button 
  className="min-h-[44px] px-4 py-3 touch-manipulation rounded-lg"
  size="default"
>
  Click me
</Button>

// Icon Buttons (Mobile)
className="min-h-[44px] min-w-[44px]" // Touch-optimized icon buttons
```

### Button Variants

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="premium">Premium</Button>

// Sizes (Mobile-optimized)
<Button size="sm">Small</Button>
<Button size="default" className="min-h-[44px]">Default</Button>
<Button size="lg">Large</Button>
```

---

## 📐 Border Radius

### Premium Rounded Corners

**Rule: Use `rounded-lg` (8px) or `rounded-xl` (12px) for premium feel**

```tsx
// ✅ Correct
className="rounded-lg"      // Standard components (8px)
className="rounded-xl"      // Cards, premium elements (12px)
className="rounded-full"    // Pills, badges

// ❌ Wrong - Avoid sharp corners
className="rounded-md"      // Too sharp for premium feel
className="rounded-none"    // Only for special cases
```

---

## 🎭 Border Colors

### Subtle Borders

**Rule: Use `border-border` with opacity for subtle dividers**

```tsx
// ✅ Correct - Subtle borders
className="border-border/30"     // Very subtle divider
className="border-border/50"     // Standard divider
className="border-border"        // Full opacity (use sparingly)

// ❌ Wrong - Avoid heavy borders
className="border-gray-300"      // Hardcoded, too heavy
className="border-2 border-border" // Too thick
```

---

## 📱 Mobile-First Layout Patterns

### ⚠️ CRITICAL: Integral Design - NO Card Borders

**PRIORITY RULE: ALWAYS use continuous flow design. NEVER use cards with borders to segment pages.**

**❌ FORBIDDEN:**
- Card components with borders (`<Card>` with `border-border/50`)
- Heavy card segmentation that breaks page flow
- Multiple nested cards
- Card grids that create visual separation

**✅ REQUIRED:**
- Continuous sections with `border-b` dividers
- Integral flow using `<section>` elements
- Subtle dividers (`border-border/30`) between sections
- Sticky headers with `sticky top-0` for section headers
- Use `divide-y` for list items within sections

### Integral Content Sections (Preferred)

**Rule: Use continuous flow, not heavy card segmentation**

```tsx
// ✅ REQUIRED: Integral section (Mobile-first) - NO CARDS
<section className="bg-background">
  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-border/50">
    <h2 className="text-xl font-semibold">Today's Bookings</h2>
  </div>
  <div className="divide-y divide-border/30">
    {items.map(item => (
      <div key={item.id} className="px-4 py-4 active:bg-accent/50">
        {/* Content without card wrapper */}
      </div>
    ))}
  </div>
</section>

// ✅ REQUIRED: Page structure with integral sections
<div className="min-h-screen bg-background">
  {/* Page Header - Integral Section */}
  <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Page Title</h1>
      <p className="text-sm sm:text-base text-muted-foreground mt-2">Description</p>
    </div>
  </section>

  {/* Search/Filter - Integral Section */}
  <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
    {/* Search and filters */}
  </section>

  {/* Content - Integral Section */}
  <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    {/* Table or list content */}
  </section>
</div>

// ❌ FORBIDDEN: Heavy card segmentation
<Card className="mb-4">
  <CardHeader>...</CardHeader>
  <CardContent>
    {items.map(item => (
      <Card key={item.id} className="mb-2">...</Card>  // Nested cards = bad UX
    ))}
  </CardContent>
</Card>

// ❌ FORBIDDEN: Cards with borders
<Card className="rounded-xl border-border/50">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Compact Grid Layouts (Mobile)

```tsx
// ✅ Good: Compact 2-column grid (Mobile) - NO CARD BORDERS
<div className="grid grid-cols-2 gap-3 px-4">
  {items.map(item => (
    <div key={item.id} className="p-3 rounded-xl bg-card/50 hover:bg-card/80 transition-colors">
      {/* Compact content without border */}
    </div>
  ))}
</div>

// ✅ Better: Use integral sections with divide-y
<section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
  <div className="divide-y divide-border/30">
    {items.map(item => (
      <div key={item.id} className="py-4 hover:bg-accent/5 transition-colors">
        {/* Content flows continuously */}
      </div>
    ))}
  </div>
</section>

// ❌ FORBIDDEN: Cards with borders
<div className="grid grid-cols-2 gap-3 px-4">
  {items.map(item => (
    <Card key={item.id} className="border border-border/50">...</Card>  // NO BORDERS
  ))}
</div>
```

---

## 🖥️ Desktop Layout Patterns

### Continuous Flow (Desktop) - NO CARD BORDERS

**PRIORITY RULE: Expand the same continuous flow, NEVER create segmented boxes with card borders**

```tsx
// ✅ REQUIRED: Continuous flow with expanded spacing (Desktop) - NO CARDS
<div className="min-h-screen bg-background">
  {/* Page Header - Integral Section */}
  <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Page Title</h1>
      <p className="text-sm sm:text-base text-muted-foreground mt-2">Description</p>
    </div>
  </section>

  {/* Content Sections - Integral Flow */}
  <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
    <h2 className="text-lg md:text-xl font-semibold mb-4">Section Title</h2>
    <div className="space-y-4 md:space-y-6">
      {/* Content flows continuously - NO CARD WRAPPERS */}
    </div>
  </section>

  {/* Another Section - Continuous */}
  <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    {/* More content */}
  </section>
</div>

// ❌ FORBIDDEN: Card grid layouts on desktop
<div className="grid grid-cols-3 gap-6">
  <Card className="border border-border/50">...</Card>  // NO CARDS WITH BORDERS
  <Card className="border border-border/50">...</Card>
  <Card className="border border-border/50">...</Card>
</div>
```

---

## ✨ Visual Excellence

### Notion-Inspired Minimalism

**Rule: Less is more. Let whitespace and typography create hierarchy, not visual effects.**

#### Clean Backgrounds

**✅ Use flat, solid backgrounds - NO gradients**

```tsx
// ✅ Correct - Clean solid backgrounds
<main className="min-h-screen bg-background">
  Content
</main>

<div className="bg-background-secondary rounded-lg p-6">
  Card content
</div>

// ❌ FORBIDDEN - Gradient backgrounds
<main className="bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
  Content
</main>
```

#### Minimal Shadows

**✅ Use soft shadows sparingly or not at all**

```tsx
// ✅ Correct - Minimal or no shadows
className="shadow-soft"           // Very subtle shadow (defined in tailwind config)
className=""                      // No shadow is often best

// Hover shadow (only if needed)
className="hover:shadow-soft transition-shadow duration-200"

// ❌ FORBIDDEN - Heavy/colored shadows
className="shadow-lg shadow-primary-light/20"
className="shadow-2xl shadow-primary/20"
className="hover:shadow-xl hover:shadow-primary-light/20"
```

#### NO Glassmorphism or Blur Effects

**❌ REMOVED - No backdrop blur effects**

```tsx
// ❌ FORBIDDEN - Remove all glassmorphism
<div className="bg-card/50 backdrop-blur-sm">  // NO
<div className="bg-white/10 backdrop-blur-lg">  // NO

// ✅ Correct - Use solid backgrounds
<div className="bg-background-secondary">
  Clean card content
</div>

// ✅ Sticky headers can use subtle backdrop
<header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50">
  Navigation only
</header>
```

#### NO Decorative Background Elements

**❌ REMOVED - No floating orbs or patterns**

```tsx
// ❌ FORBIDDEN - Remove all decorative elements
<div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
<div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />

// ✅ Correct - Clean, empty background
<main className="min-h-screen bg-background relative overflow-hidden">
  <div className="relative">
    {/* Content only, no decorative elements */}
  </div>
</main>
```

#### Visual Hierarchy Through Typography

**✅ Create hierarchy with size, weight, and color - NOT effects**

```tsx
// ✅ Correct - Typography-based hierarchy
<section>
  {/* Primary - Large, semibold, dark charcoal */}
  <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold text-foreground">
    Page Title
  </h1>
  
  {/* Secondary - Smaller, muted */}
  <p className="text-sm text-muted-foreground mt-2">
    Description text
  </p>
  
  {/* Section headers */}
  <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">
    Section Title
  </h2>
</section>

// ❌ Wrong - Using effects for hierarchy
<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
  Fancy Title  // NO gradients on text
</h1>
```

#### Spacing Over Borders

**✅ Use whitespace for separation, not heavy borders**

```tsx
// ✅ Correct - Generous spacing
<div className="space-y-6">
  <section className="px-4 sm:px-6 lg:px-8 py-6">
    Content section 1
  </section>
  <section className="px-4 sm:px-6 lg:px-8 py-6">
    Content section 2
  </section>
</div>

// ✅ Subtle dividers when needed
<div className="divide-y divide-border/30">
  {items.map(item => (
    <div key={item.id} className="py-4">
      {/* Item content */}
    </div>
  ))}
</div>

// ❌ Wrong - Heavy borders everywhere
<Card className="border-2 border-border shadow-lg mb-6">
```

---

## 🎯 Animation System

### Simple Color Transitions

**Rule: Use subtle color transitions only. NO scale transforms, NO heavy shadows on hover.**

#### Hover States

```tsx
// ✅ Correct - Simple color transition
<button className="transition-colors duration-200 hover:bg-muted">
  Interactive Button
</button>

// ✅ Card hover - background color change only
<div className="
  bg-background-secondary 
  rounded-lg 
  p-6
  transition-colors duration-200
  hover:bg-muted
  hover:shadow-soft
">
  Card Content
</div>

// ✅ Link hover - color change
<a className="
  text-muted-foreground
  transition-colors duration-200
  hover:text-primary-dark
">
  Interactive Link
</a>

// ❌ FORBIDDEN - Scale transforms
<button className="hover:scale-[1.02] active:scale-[0.98]">
  Button  // NO scale transforms
</button>

// ❌ FORBIDDEN - Heavy shadows on hover
<div className="hover:shadow-lg hover:shadow-primary-light/20 hover:-translate-y-1">
  Card  // NO shadow/translate effects
</div>
```

#### Focus States

```tsx
// ✅ Correct - Subtle focus indicators
<input className="
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary/20
  focus-visible:border-primary-dark
  transition-colors duration-200
" />

<button className="
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-primary/20
  transition-colors duration-200
">
  Accessible Button
</button>

// ❌ Wrong - Scale on focus
<button className="focus-visible:scale-[1.02]">
  Button  // NO scale on focus
</button>
```

#### Page Transitions

```tsx
// ✅ Correct - Subtle opacity fade
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2, ease: 'easeInOut' }}
>
  Page Content
</motion.div>

// ❌ Avoid - Complex motion effects
<motion.div
  initial={{ opacity: 0, y: 20, scale: 0.95 }}  // Too complex
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

#### Loading States

```tsx
// ✅ Correct - Clean loading spinner
<div className="flex items-center justify-center">
  <div className="
    animate-spin
    rounded-full
    h-8 w-8
    border-4
    border-primary/20
    border-t-primary-dark
  " />
</div>

// ✅ Skeleton loader
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>
```

### Transition Classes Quick Reference

| Use Case | Class |
|----------|-------|
| Background color change | `transition-colors duration-200` |
| All properties (rare) | `transition-all duration-200` |
| Shadow change | `transition-shadow duration-200` |
| Opacity fade | `transition-opacity duration-200` |

**Note:** Always use `duration-200` (200ms) for quick, responsive feedback. Avoid `duration-300` or longer.

---

## 🚫 No Placeholders Policy

**Rule: NEVER leave obvious placeholders. Always use realistic content.**

### ❌ FORBIDDEN:
```tsx
// ❌ Lorem ipsum placeholder text
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>

// ❌ Generic "Image here" placeholders
<div className="bg-gray-300 flex items-center justify-center">
  <span>Image Here</span>
</div>

// ❌ "Coming soon" sections
<section>
  <h2>Features</h2>
  <p>Coming soon...</p>
</section>

// ❌ Placeholder.com images
<img src="https://via.placeholder.com/400x300" alt="placeholder" />
```

### ✅ REQUIRED:

```tsx
// ✅ Realistic sample copy
<p>
  Transform your workflow with our AI-powered analytics dashboard. 
  Get real-time insights and make data-driven decisions faster than ever.
</p>

// ✅ High-quality Unsplash images
<img 
  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop" 
  alt="Modern office workspace with laptop and coffee"
  className="rounded-xl object-cover"
/>

// ✅ SVG illustrations
<svg className="w-64 h-64" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="hsl(var(--primary))" opacity="0.1" />
  <path d="M60 100 L90 130 L140 70" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" />
</svg>

// ✅ Icon placeholders when needed
import { ImageIcon } from 'lucide-react'

<div className="bg-muted rounded-xl flex items-center justify-center p-12">
  <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
</div>

// ✅ Actual feature content
<section>
  <h2 className="text-2xl font-display font-bold">Features</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
    <div>
      <h3 className="text-xl font-semibold">Real-time Analytics</h3>
      <p className="text-muted-foreground mt-2">
        Track user behavior and performance metrics as they happen
      </p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Team Collaboration</h3>
      <p className="text-muted-foreground mt-2">
        Work together seamlessly with shared dashboards and notes
      </p>
    </div>
    <div>
      <h3 className="text-xl font-semibold">Smart Automation</h3>
      <p className="text-muted-foreground mt-2">
        Automate repetitive tasks and focus on what matters most
      </p>
    </div>
  </div>
</section>
```

### Image Guidelines

**Always use high-quality, relevant images:**

1. **Unsplash Collections** (free, high-quality):
   - Technology: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe`
   - Business: `https://images.unsplash.com/photo-1557804506-669a67965ba0`
   - Workspace: `https://images.unsplash.com/photo-1497366216548-37526070297c`

2. **SVG Illustrations** (always custom or from quality libraries):
   - Use heroicons, lucide-react, or custom SVGs
   - Match brand colors using CSS variables

3. **Icon Placeholders** (when image isn't critical):
   - Use icon libraries (Lucide, Heroicons)
   - Style with muted colors and subtle backgrounds

---

## 🔨 Implementation Workflow

**Rule: Follow a structured approach to build premium applications systematically**

### Phase 1: Plan & Understand

1. **Define the use case**: SaaS product, e-commerce, portfolio, etc.
2. **Identify user goals**: What are users trying to accomplish?
3. **List core features**: What functionality is needed for v1?
4. **Sketch user flow**: How do users navigate the app?

### Phase 2: Build the Foundation

1. **Setup Next.js Project**:
   ```bash
   npx create-next-app@latest --typescript --tailwind --app
   ```

2. **Configure Tailwind** (`tailwind.config.js`):
   ```js
   module.exports = {
     theme: {
       extend: {
         colors: {
           primary: 'hsl(var(--primary))',
           'primary-foreground': 'hsl(var(--primary-foreground))',
           // ... more colors
         },
         fontFamily: {
           sans: ['Inter', 'system-ui', 'sans-serif'],
           display: ['Outfit', 'system-ui', 'sans-serif'],
         },
       },
     },
   }
   ```

3. **Setup Google Fonts** (`app/layout.tsx`):
   ```tsx
   import { Inter, Outfit } from 'next/font/google'
   
   const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
   const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
   ```

4. **Define CSS Variables** (`globals.css`):
   ```css
   :root {
     --primary: 142 71% 45%;
     --primary-foreground: 0 0% 100%;
     --accent: 4 86% 71%;
     /* ... more variables */
   }
   ```

5. **Install shadcn/ui components**:
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button input card badge
   ```

### Phase 3: Create Components

1. **Build Design System Components**:
   - Button variants (primary, secondary, outline, ghost)
   - Input components (text, email, password, search)
   - Card components (standard, glass, elevated)
   - Badge & tag components
   - Navigation components (navbar, sidebar, mobile menu)

2. **Create Layout Components**:
   - Header with navigation
   - Footer with links
   - Sidebar for dashboard
   - Mobile bottom navigation

3. **Develop Feature Components**:
   - Hero sections
   - Feature grids
   - Pricing tables
   - FAQ accordions
   - Contact forms
   - Dashboard widgets

### Phase 4: Assemble Pages

1. **Create Route Structure**:
   ```
   app/
   ├── (marketing)/
   │   ├── page.tsx          # Homepage
   │   ├── pricing/
   │   └── about/
   ├── (dashboard)/
   │   ├── dashboard/
   │   ├── settings/
   │   └── profile/
   └── layout.tsx
   ```

2. **Implement Responsive Layouts**:
   - Mobile: Stack vertically, bottom nav
   - Tablet: 2-column grids, adaptive spacing
   - Desktop: Multi-column layouts, sidebars

3. **Add Navigation & Routing**:
   - Next.js App Router with Link components
   - Protected routes with middleware
   - Loading and error states

### Phase 5: Polish & Optimize

1. **Review UX Flow**:
   - Test navigation and interactions
   - Verify form submissions
   - Check error handling
   - Ensure smooth transitions

2. **Visual Polish**:
   - Consistent spacing and alignment
   - Proper color contrast
   - Smooth animations
   - Appropriate shadows and depth

3. **Performance Optimization**:
   - Optimize images (next/image)
   - Minimize JavaScript bundles
   - Enable caching strategies
   - Add loading skeletons

4. **Accessibility Audit**:
   - Test keyboard navigation
   - Verify screen reader compatibility
   - Ensure proper ARIA labels
   - Check color contrast ratios

---

## 🔍 SEO Best Practices

**Rule: Every page must be optimized for search engines and social sharing**

### Page Metadata

**✅ Required for every page:**

```tsx
// app/page.tsx or any route page
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Pitchivo',
  description: 'Manage your sales pipeline and track leads with our powerful CRM dashboard',
  keywords: ['CRM', 'sales', 'pipeline', 'lead management'],
  
  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    title: 'Dashboard - Pitchivo',
    description: 'Manage your sales pipeline and track leads with our powerful CRM dashboard',
    url: 'https://pitchivo.com/dashboard',
    siteName: 'Pitchivo',
    images: [
      {
        url: 'https://pitchivo.com/og-dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Pitchivo Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard - Pitchivo',
    description: 'Manage your sales pipeline and track leads with our powerful CRM dashboard',
    images: ['https://pitchivo.com/twitter-dashboard.png'],
    creator: '@pitchivo',
  },
  
  // Additional
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      {/* Content */}
    </main>
  )
}
```

### Semantic HTML for SEO

```tsx
// ✅ Correct - SEO-friendly structure
<main>
  <article>
    <header>
      <h1>Complete Guide to CRM Systems</h1>
      <time dateTime="2024-12-01">December 1, 2024</time>
      <address>
        <a href="/author/john">By John Doe</a>
      </address>
    </header>
    
    <section>
      <h2>Introduction</h2>
      <p>Content...</p>
    </section>
    
    <section>
      <h2>Key Features</h2>
      <p>Content...</p>
    </section>
    
    <footer>
      <p>Filed under: <a href="/category/crm">CRM</a></p>
    </footer>
  </article>
</main>
```

### Structured Data (JSON-LD)

```tsx
// Add structured data for rich snippets
export default function ProductPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Premium CRM Plan',
    description: 'Advanced CRM features for growing teams',
    offers: {
      '@type': 'Offer',
      price: '99.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        {/* Product content */}
      </main>
    </>
  )
}
```

### Performance for SEO

```tsx
// 1. Optimize images
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Descriptive alt text for SEO"
  width={1200}
  height={630}
  priority  // For above-fold images
  quality={85}
/>

// 2. Lazy load components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,  // Client-side only if appropriate
})

// 3. Preload critical assets
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
```

### SEO Checklist

**✅ Every page must have:**
- [ ] Unique, descriptive `<title>` (50-60 characters)
- [ ] Unique meta description (150-160 characters)
- [ ] Semantic heading hierarchy (one h1, proper h2-h6)
- [ ] Descriptive alt text for all images
- [ ] Open Graph tags for social sharing
- [ ] Twitter Card tags
- [ ] Canonical URL (if applicable)
- [ ] Robots meta tag (index/noindex)
- [ ] Fast loading time (< 3s)
- [ ] Mobile-responsive design
- [ ] HTTPS enabled
- [ ] sitemap.xml generated
- [ ] robots.txt configured

---

## 🎯 Animation System

### Framer Motion Guidelines

**Rule: Subtle, professional animations (not aggressive)**

```tsx
// ✅ Correct - Subtle animations with Framer Motion
import { motion } from 'framer-motion'

<motion.div
  whileHover={{ scale: 1.02 }}   // Gentle lift (not 1.05)
  whileTap={{ scale: 0.98 }}     // Subtle press (not 0.95)
  transition={{ duration: 0.2 }} // Fast, responsive
>
  Interactive Element
</motion.div>

// ❌ Wrong - Too aggressive
whileHover={{ scale: 1.1 }}    // Too bouncy
whileTap={{ scale: 0.9 }}      // Too extreme
```

### Animation Principles

1. **Hardware-accelerated**: Use `transform` and `opacity` only
2. **Respect reduced motion**: Check user preferences with `prefers-reduced-motion`
3. **Touch feedback**: Use `whileTap` for mobile interactions
4. **Duration**: Keep under 300ms for responsiveness
5. **Easing**: Use natural easing functions (`easeInOut`, `easeOut`)

### Reduced Motion Support

```tsx
// ✅ Respect user preferences
// In tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
    },
  },
}

// In CSS
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// In components
const prefersReducedMotion = typeof window !== 'undefined' 
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ 
    duration: prefersReducedMotion ? 0 : 0.3 
  }}
>
  Content
</motion.div>
```

### Custom Animations

```tsx
// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
    },
  },
}
```

---

## 🖼️ Icon Sizing

### Consistent Icon Sizes

```tsx
// ✅ Correct - Consistent order (height before width)
<Icon className="h-4 w-4" />   // Small icons
<Icon className="h-5 w-5" />   // Medium icons
<Icon className="h-6 w-6" />   // Large icons

// Icon in buttons
<Button>
  <Icon className="h-4 w-4 mr-2" />
  Label
</Button>
```

---

## 🎨 Component Examples

### Input Component

**Mobile-Optimized Specifications:**
- **Height**: `h-11` (44px) - meets minimum touch target requirements
- **Touch Optimization**: Includes `touch-manipulation` class for better mobile responsiveness
- **Border Radius**: `rounded-xl` (12px) for premium feel
- **Padding**: `px-3 py-2` for comfortable touch interaction
- **Text Size**: `text-sm` (14px) on mobile, can scale up with `text-base` or `text-lg` classes

```tsx
import { Input } from "@/components/ui/input"

// ✅ Correct - Default input is already mobile-optimized
<Input 
  placeholder="Enter text..."
/>

// ✅ For larger text input (if needed)
<Input 
  className="text-lg"
  placeholder="Enter text..."
/>

// ❌ Avoid - Input already has h-11 (44px), don't override unnecessarily
<Input 
  className="min-h-[44px]" // Redundant
  placeholder="Enter text..."
/>
```

### Badge Component

**Mobile-Optimized Specifications:**
- **Text Size**: `text-sm` (14px) on mobile, `text-base` (16px) on desktop
- **Padding**: `px-2 py-1.5` on mobile, `sm:px-4 sm:py-2` on desktop
- **Touch Target**: Minimum `min-h-[44px]` for interactive badges
- **Responsive**: Use responsive classes for mobile-first design

```tsx
import { Badge } from "@/components/ui/badge"

// ✅ Correct - Mobile-optimized badge
<Badge
  className="px-2 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base min-h-[44px]"
  variant="outline"
>
  Label
</Badge>

// ✅ With accent color for selected state
<Badge
  className={cn(
    'px-2 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base min-h-[44px]',
    isSelected && 'bg-accent-color text-accent-color-foreground border-accent-color'
  )}
>
  Selected
</Badge>
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card className="rounded-xl border-border/30">
  <CardHeader>
    <CardTitle className="text-lg sm:text-xl">Card Title</CardTitle>
  </CardHeader>
  <CardContent className="text-base">
    Card content
  </CardContent>
</Card>
```

---

## 📱 Mobile PWA-Specific Styling

### Touch Optimization

```tsx
// ✅ Touch-optimized interactions
className="touch-manipulation"           // Optimize touch
className="active:scale-[0.98]"          // Subtle press feedback
className="active:bg-accent/50"          // Press state background
```

### Safe Area Handling

```tsx
// ✅ Safe area handling for notches
className="pb-safe-area-inset-bottom"    // Bottom navigation
className="pt-safe-area-inset-top"       // Top content
className="px-safe-area-inset-left"      // Side content
```

### PWA Scroll Behavior

```tsx
// ✅ PWA scroll behavior
className="overscroll-none"              // Prevent overscroll
className="overscroll-y-contain"         // Contain scroll bounce
className="min-h-screen"                 // Full viewport
className="h-screen overflow-y-auto"     // Scrollable full screen
```

---

## 🎯 Design Philosophy Summary

### Core Principles (Priority Order)

1. **🎨 NOTION-INSPIRED MINIMALISM (CRITICAL)**: 
   - **Unified Flow** - Interface feels like one continuous sheet of paper
   - **NO boxed/card-based UI** with heavy borders and shadows
   - Use **whitespace and typography** for visual separation
   - Clean, minimal, content-focused design

2. **⚡ FLAT DESIGN RULES**:
   - **FLATTEN** - Remove card borders and shadows
   - **LIGHTEN** - Use `#333333` for text, `#FFFFFF` for backgrounds
   - **SPACE** - Generous whitespace (40px+ margins)
   - **TINT** - Soft pastel accent colors
   - **SOFTEN** - Subtle `ease-in-out` color transitions

3. **❌ FORBIDDEN ELEMENTS**:
   - Gradient backgrounds (`bg-gradient-to-br from-primary-light/20`)
   - Decorative blur elements (`blur-3xl` floating orbs)
   - Backdrop blur on cards (`bg-card/50 backdrop-blur-sm`)
   - Scale transforms on hover (`hover:scale-[1.02]`)
   - Heavy colored shadows (`hover:shadow-lg hover:shadow-primary-light/20`)
   - Colored status badges (`bg-blue-100 text-blue-700`)

4. **✅ REQUIRED PATTERNS**:
   - `bg-background` or `bg-background-secondary` for all backgrounds
   - `text-foreground` (#333333) and `text-muted-foreground` (#666666) for text
   - `bg-accent-surface` with `text-primary-dark` for icon containers
   - `hover:bg-muted` for hover states (not scale transforms)
   - `transition-colors duration-200` for interactions
   - `border-border/50` for subtle borders

5. **📋 SEMANTIC HTML**: 
   - Exactly **one `<h1>` per page**
   - Proper heading hierarchy (h2, h3, h4)
   - Use semantic elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`, `<article>`)
   - **Every interactive element** has unique, descriptive `id`
   - Accessible labels on all inputs and buttons

6. **📱 MOBILE-FIRST**: 
   - Design for mobile, enhance for desktop
   - 44px minimum touch targets
   - Touch-optimized interactions

7. **🎯 TECH STACK**:
   - Next.js (App Router)
   - React with TypeScript
   - Tailwind CSS (no inline styles)
   - shadcn/ui components
   - Inter font family

### Quick Reference: Old vs New

| Old (FORBIDDEN) | New (REQUIRED) |
|-----------------|----------------|
| `bg-gradient-to-br from-primary-light/20 via-background` | `bg-background` |
| `bg-card/50 backdrop-blur-sm` | `bg-background-secondary` |
| `hover:scale-[1.02] active:scale-[0.98]` | `hover:bg-muted` |
| `hover:shadow-lg hover:shadow-primary-light/20` | `hover:shadow-soft` or none |
| `transition-all duration-300` | `transition-colors duration-200` |
| `rounded-xl` | `rounded-lg` |
| `bg-primary/10` (icon container) | `bg-accent-surface` |
| `text-primary` (icon color) | `text-primary-dark` |
| `bg-blue-100 text-blue-700` (badge) | `bg-background-secondary text-foreground` |

### Key Metrics

- **Touch Target**: Minimum 44px × 44px
- **Typography**: Inter font, minimum 16px on mobile
- **Border Radius**: 6px (rounded-lg) or 4px (rounded-md)
- **Spacing Mobile**: gap-3 (12px), px-4 (16px)
- **Spacing Desktop**: lg:gap-6 (24px), lg:px-8 (32px)
- **Transitions**: `duration-200` (200ms) only
- **Borders**: `border-border/50` (very subtle)
- **Heading Hierarchy**: One h1, proper h2-h6 structure

---

## 🤖 AI Prompt Template

When generating UI with AI, use this prompt:

```
Create a **NOTION-INSPIRED MINIMAL** web application using **Next.js (App Router) + shadcn/ui + Tailwind CSS**.

🎨 DESIGN PHILOSOPHY (NOTION-INSPIRED LIGHT MINIMALISM):
- **Unified Flow** - Everything feels like one continuous sheet of paper
- **NO boxed/card-based UI** - Use whitespace and typography for separation
- Clean, minimal design that lets content breathe
- Inter font family for consistency

❌ FORBIDDEN ELEMENTS (NEVER USE):
- Gradient backgrounds (`bg-gradient-to-br from-primary-light/20`)
- Decorative blur elements (floating orbs with `blur-3xl`)
- Backdrop blur on cards (`bg-card/50 backdrop-blur-sm`)
- Scale transforms (`hover:scale-[1.02] active:scale-[0.98]`)
- Heavy shadows (`hover:shadow-lg hover:shadow-primary-light/20`)
- Colored status badges (`bg-blue-100 text-blue-700`)
- `rounded-xl` - use `rounded-lg` instead

✅ REQUIRED PATTERNS:
- `bg-background` (white) or `bg-background-secondary` (#F7F7F7) for backgrounds
- `text-foreground` (#333333) for primary text
- `text-muted-foreground` (#666666) for secondary text
- `bg-accent-surface` with `text-primary-dark` for icon containers
- `hover:bg-muted` for hover states (NOT scale transforms)
- `transition-colors duration-200` for all interactions
- `border-border/50` for subtle borders
- `rounded-lg` (6px) for border radius

📋 SEMANTIC HTML (REQUIRED):
- **Exactly ONE `<h1>` per page** with proper heading hierarchy (h2, h3, h4)
- Use semantic elements: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`
- **Every interactive element** needs unique, descriptive `id`
- Format: `[context]-[element]-[action]` (e.g., `dashboard-stats-card`)

📱 MOBILE-FIRST:
- Design for mobile first, enhance for desktop
- 44px minimum touch targets
- Responsive: `px-4 sm:px-6 lg:px-8`

🎯 TECH STACK:
- Next.js App Router with TypeScript
- Tailwind CSS (NO inline styles)
- shadcn/ui components
- Inter font

Example page structure:
```tsx
// app/dashboard/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Pitchivo',
  description: 'Manage your projects and track progress',
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Track your progress
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              id="stat-total-projects" 
              className="bg-background-secondary rounded-lg p-4 transition-colors duration-200 hover:bg-muted hover:shadow-soft"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-accent-surface flex items-center justify-center">
                  <FolderIcon className="h-4 w-4 text-primary-dark" />
                </div>
                <span className="text-sm text-muted-foreground">Projects</span>
              </div>
              <p className="text-2xl font-semibold text-foreground">24</p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="bg-background-secondary rounded-lg divide-y divide-border/50">
            <div className="p-4 hover:bg-muted transition-colors duration-200">
              {/* Item content */}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
```
```

---

**Last Updated**: November 2024  
**Version**: 5.0 (Notion-Inspired Light Minimalism)
