# Mobile-First Progressive Web App Design System

## 🚀 Overview

This design system is built for **mobile-first Progressive Web Apps (PWA)** using **shadcn/ui** as the foundation. It provides a sophisticated, premium UI optimized for mobile devices with seamless desktop adaptation. Built with Tailwind CSS v3.4.18, React components, and PWA capabilities.

**Current Implementation:**
- ✅ shadcn/ui components installed (Button, Input, Card, Badge)
- ✅ Mint Blue color palette implemented
- ✅ ThemeProvider configured with next-themes
- ✅ Premium animations and utilities
- ✅ Mobile-first responsive design

**This document is the single source of truth for all styling, colors, fonts, spacing, and design decisions in the Pitchivo codebase.**

---

## 🎨 Color System

### Primary Colors - Mint Blue Palette

The design system uses CSS variables for theming (defined in `globals.css`):

**Current Implementation: Medium Spring Green Theme**

```css
:root {
  /* Primary: Medium Spring Green #00FA9A */
  --primary: 157 100% 49%;              /* #00FA9A - primary medium spring green */
  --primary-foreground: 0 0% 100%;     /* white - light text on dark primary */
  
  /* Primary Variants */
  --primary-light: 120 73% 75%;        /* #90EE90 - lighter light green */
  --primary-dark: 147 50% 47%;         /* #3CB371 - darker medium sea green */
  --primary-darker: 147 50% 47%;        /* #3CB371 - darkest (same as dark) */
  --background: 0 0% 100%;           /* white */
  --foreground: 0 0% 5%;             /* gray-950 */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 0 0% 5%;        /* gray-950 */
  --border: 0 0% 90%;                /* gray-200 */
  --input: 0 0% 90%;                 /* gray-200 */
  --ring: 157 100% 49%;                /* primary medium spring green */
  --radius: 0.75rem;                 /* 12px - premium rounded */
  
  /* Accent Colors */
  --accent-color: 35 100% 74%;        /* #ffc87c - yellow/peach accent */
  --accent-color-foreground: 0 0% 5%; /* gray-950 - dark text on accent */
  --accent-beige: 20 25% 67%;         /* #bea698 - beige/tan */
  --accent-pink: 343 100% 88%;        /* #ffc0d1 - pink */
  --accent-mint-light: 162 60% 78%;   /* #a6e9d7 - light mint */
}
```

### Color Usage Rules

**✅ ALWAYS use CSS variables:**
```tsx
// ✅ Correct
className="bg-background text-foreground"
className="bg-card text-card-foreground"
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="text-destructive"
className="border-border/30"  // Use opacity for subtle borders

// ❌ Wrong - Never hardcode colors
className="text-red-600 dark:text-red-400"
className="bg-gradient-to-r from-primary to-primary/80"
```

### Current Color Palette

**Medium Spring Green Theme** (Implemented):
- **Primary**: `#00FA9A` (Medium Spring Green) - `157 100% 49%`
- **Primary Light**: `#90EE90` (Light Green) - `120 73% 75%`
- **Primary Dark**: `#3CB371` (Medium Sea Green) - `147 50% 47%`
- **Primary Darker**: `#3CB371` (Medium Sea Green) - `147 50% 47%`
- **Accent Color**: `#00FA9A` (same as primary) - for selected states and highlights

### Accent Colors

**Accent color is the same as primary** and is used for highlights, selected states, and visual emphasis. This creates a cohesive, harmonious color scheme.

```css
/* Accent Colors */
--accent-color: 157 94% 79%;              /* #98FBCB - same as primary mint green */
--accent-color-foreground: 0 0% 5%;      /* gray-950 - dark text on light accent */
--accent-beige: 20 25% 67%;              /* #bea698 - beige/tan */
--accent-pink: 343 100% 88%;             /* #ffc0d1 - pink */
--accent-mint-light: 162 60% 78%;        /* #a6e9d7 - light mint */
```

**Usage Rules:**

```tsx
// ✅ Correct - Use accent color for highlights and selected states
className="bg-accent-color text-accent-color-foreground"
className="bg-accent-color/10 text-accent-color border-accent-color/20"
className="hover:bg-accent-color/20"
className="hover:bg-accent-color/90"

// ✅ Use accent-color for selected badges/interactive highlights
className={cn(
  isSelected && 'bg-accent-color text-accent-color-foreground border-accent-color',
  !isSelected && 'bg-background border-border'
)}
```

**Note:** The accent-color is configured in `tailwind.config.js` and can be used directly with Tailwind classes like `bg-accent-color` and `text-accent-color-foreground`.

**Color Combinations:**

- **Primary (Mint Green) + Primary Variants**: Harmonious, cohesive, fresh
- **Primary (Mint Green) + Accent (Pink)**: Soft, elegant, feminine
- **Primary (Mint Green) + Accent (Beige)**: Natural, calm, sophisticated
- **Primary (Mint Green) + Light Mint**: Serene, cohesive, modern

---

## 📝 Typography System

### Mobile-First Typography Scale

**Rule: Design for mobile first, then scale up for desktop**

```tsx
// Headlines (Mobile → Desktop)
className="text-lg sm:text-xl"              // Section headers
className="text-xl sm:text-2xl lg:text-3xl" // Page titles
className="text-2xl sm:text-3xl lg:text-4xl" // Hero headlines

// Body Text (Mobile → Desktop)
className="text-base"                       // Mobile: Default (16px minimum)
className="text-sm sm:text-base"           // Secondary text
className="text-base lg:text-lg"           // Desktop: Larger body

// Small Text
className="text-xs"                         // Labels, metadata only
className="text-sm"                         // Captions

// ❌ Avoid on Mobile
// Don't use text-display-xl (too large for mobile)
// Don't use very small text (< 14px) except for special cases
```

### Typography Best Practices

1. **Minimum 16px on mobile** for readability (`text-base`)
2. **Mobile first**: Always start with mobile size, then add `sm:`, `lg:` modifiers
3. **Clear hierarchy**: Use `font-semibold` (not `font-bold`) for subtle emphasis
4. **Line height**: Default line-height is appropriate (1.5x)

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

// ❌ Avoid: One card per row on mobile
<div className="space-y-4">
  {items.map(item => (
    <Card className="w-full">...</Card>  // Wastes space on mobile
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

// ❌ FORBIDDEN: Segmented boxes
<Card className="mb-6">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

---

## 🎯 Animation System

### Framer Motion Guidelines

**Rule: Subtle, professional animations (not aggressive)**

```tsx
// ✅ Correct - Subtle animations
whileHover={{ scale: 1.02 }}   // Gentle lift (not 1.05)
whileTap={{ scale: 0.98 }}     // Subtle press (not 0.95)
transition={{ duration: 0.2 }} // Fast, responsive

// Page transitions
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}

// ❌ Wrong - Too aggressive
whileHover={{ scale: 1.1 }}    // Too bouncy
whileTap={{ scale: 0.9 }}      // Too extreme
```

### Animation Principles

1. **Hardware-accelerated**: Use `transform` and `opacity` only
2. **Respect reduced motion**: Check user preferences
3. **Touch feedback**: Use `whileTap` for mobile interactions
4. **Duration**: Keep under 300ms for responsiveness

### Hover & Click Effects

**Rule: Subtle, premium hover and click effects for interactive elements**

```tsx
// ✅ Correct - Card hover effects
<Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20 hover:-translate-y-1 hover:border-primary-light/50 cursor-pointer group active:scale-[0.98]">
  <CardHeader>
    <Icon className="transition-transform duration-300 group-hover:scale-110 group-hover:text-primary-dark" />
    <CardTitle className="group-hover:text-primary-dark transition-colors">Title</CardTitle>
  </CardHeader>
</Card>

// ✅ Correct - Button hover effects
<Button className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/30">
  Click me
</Button>

// ✅ Correct - Step/item hover effects
<div className="transition-all duration-300 hover:translate-x-2 group">
  <div className="transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
    Step
  </div>
</div>
```

### Background Effects

**Rule: Subtle decorative backgrounds for premium feel**

```tsx
// ✅ Correct - Gradient background
<div className="bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10" />

// ✅ Correct - Sloped lines background
<div 
  style={{
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 20px,
      hsl(var(--primary-light)) 20px,
      hsl(var(--primary-light)) 21px
    )`,
    opacity: 0.3
  }}
/>

// ✅ Correct - Vector shapes (floating circles)
<div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl animate-float" />
<div className="absolute bottom-40 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
```

**Background Effect Guidelines:**
- Use low opacity (10-30%) for subtlety
- Apply blur effects (`blur-3xl`) for soft appearance
- Use `animate-float` for gentle movement
- Keep decorative elements behind content (`-z-10`, `pointer-events-none`)
- Use primary color variants for consistency

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

### Button Component

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

1. **⚡ INTEGRAL DESIGN (HIGHEST PRIORITY)**: 
   - **ALWAYS** use continuous flow with `<section>` elements
   - **NEVER** use cards with borders (`<Card>` with borders)
   - Use `border-b` dividers between sections, not card wrappers
   - Sticky headers for section navigation
   - `divide-y` for list items within sections

2. **Mobile-First**: Design for mobile, enhance for desktop
3. **Touch-Optimized**: 44px minimum touch targets
4. **Continuous Flow**: Avoid heavy card segmentation (enforced by #1)
5. **Subtle Animations**: Professional, not aggressive
6. **CSS Variables**: Always use design system variables
7. **Premium Feel**: Rounded corners, soft shadows, breathing space

### Key Metrics

- **Touch Target**: Minimum 44px × 44px
- **Typography**: Minimum 16px on mobile
- **Border Radius**: 8px (rounded-lg) or 12px (rounded-xl)
- **Spacing Mobile**: gap-3 (12px), px-4 (16px)
- **Spacing Desktop**: lg:gap-6 (24px), lg:px-8 (32px)
- **Animation Scale**: 1.02 hover, 0.98 tap

---

## 🤖 AI Prompt Template

When generating UI with AI, use this prompt:

```
Create a **mobile-first**, **flat**, and **integrated** layout using **shadcn/ui + Tailwind CSS**.

CRITICAL REQUIREMENTS:
- **NEVER use Card components with borders** - this is FORBIDDEN
- **ALWAYS use continuous flow** with `<section>` elements
- Use `border-b border-border/30` for section dividers, NOT card borders
- Use sticky headers: `sticky top-0 bg-background/95 backdrop-blur-sm z-10`
- Use `divide-y divide-border/30` for list items within sections
- Structure: Page Header → Search/Filter Section → Content Section (all as `<section>`)

Avoid dashboard or grid design. No cards unless absolutely needed (and even then, NO BORDERS).
Use continuous sections with clear visual flow.
Use `flex`, `gap`, and `divide-y` for structure, not `<Card>`.
On mobile: use bottom navigation, simple headers, and list-style items.
On desktop (`lg:`), expand the layout horizontally and introduce a sidebar or wider padding — but maintain a continuous, cohesive background.
Use light typography, soft spacing (`p-4`, `gap-4`), rounded corners (`rounded-lg`), and subtle shadows (`shadow-sm` or none).
Make it feel like a PWA, not a dashboard website.

Example structure:
<div className="min-h-screen bg-background">
  <section className="sticky top-0 ... border-b border-border/50">Header</section>
  <section className="... border-b border-border/30">Filters</section>
  <section className="...">Content</section>
</div>
```

---

**Last Updated**: December 2024  
**Version**: 2.0 (Consolidated)
