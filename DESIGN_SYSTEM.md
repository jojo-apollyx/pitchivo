# Mobile-First Progressive Web App Design System

## 🚀 Overview

This design system is built for **mobile-first Progressive Web Apps (PWA)** using **shadcn/ui** as the foundation. It provides a sophisticated, premium UI optimized for mobile devices with seamless desktop adaptation. Built with Tailwind CSS v3.4.18, React components, and PWA capabilities.

**Current Implementation:**
- ✅ shadcn/ui components installed (Button, Input, Card, Badge)
- ✅ Organization-based color theming implemented
- ✅ ThemeProvider configured with next-themes
- ✅ Premium animations and utilities
- ✅ Mobile-first responsive design

**This document is the single source of truth for all styling, colors, fonts, spacing, and design decisions in the Pitchivo codebase.**

---

## 🎨 Color System

### Organization-Based Theming

Each organization can customize their color scheme with three colors:
- **Primary Color**: Main brand identity color
- **Secondary Color**: Darker shade for hover states
- **Accent Color**: Complementary color for highlights

Colors are stored in the `organizations` table and applied via `ThemeProvider` in the dashboard layout.

### Color Roles & Usage

#### PRIMARY COLOR
**Main brand identity color**

**Use for:**
- ✅ Primary buttons (CTAs)
- ✅ Active navigation items
- ✅ Links and hyperlinks
- ✅ Form focus states
- ✅ Selected checkboxes/radio buttons
- ✅ Active tab indicators
- ✅ Logo and brand elements

**Text:** Always white text on primary color for maximum contrast

**Example:**
```tsx
// Primary button
<Button className="bg-primary text-primary-foreground hover:bg-primary-dark">
  Get Started
</Button>

// Active navigation
<Link className={isActive && 'bg-primary/10 text-primary'}>
  Dashboard
</Link>
```

#### SECONDARY COLOR
**Darker shade of primary - used internally for hover states**

**Use for:**
- ✅ Hover states on primary elements
- ✅ Pressed states on buttons
- ✅ Darker variations (automatically applied as `--primary-dark`)

**Don't use directly in components** - it's automatically applied via `hover:bg-primary-dark`

#### ACCENT COLOR
**Complementary color - use SPARINGLY for highlights**

**Use for:**
- ✅ Notification badges (e.g., "3 new messages")
- ✅ Success messages and alerts
- ✅ Important status indicators
- ✅ Small icons for special actions
- ✅ Sale tags and promotional badges
- ✅ Progress highlights

**AVOID for:**
- ❌ Large background areas
- ❌ Primary action buttons
- ❌ Navigation elements
- ❌ Large text sections

**Example:**
```tsx
// Notification badge
<div className="relative">
  <BellIcon />
  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full px-1.5">
    3
  </span>
</div>

// Success message
<Alert className="border-accent/20 bg-accent/5 text-accent-dark">
  <CheckIcon className="text-accent" />
  Profile updated successfully!
</Alert>

// Important tag
<Badge className="bg-accent text-accent-foreground">
  New
</Badge>
```

### CSS Variables

The design system uses CSS variables for theming (defined in `globals.css`):

```css
:root {
  /* Primary - Main brand color */
  --primary: /* Organization's primary color */
  --primary-foreground: white /* Text on primary */
  --primary-light: /* Lighter variant */
  --primary-dark: /* Hover state (uses secondary) */
  --primary-darker: /* Pressed state */
  
  /* Accent - Complementary highlights */
  --accent: /* Organization's accent color */
  --accent-foreground: white /* Text on accent */
  --accent-color: /* Pure accent */
  --accent-light: /* Lighter variant */
  --accent-dark: /* Darker variant */
  
  /* Base colors */
  --background: 0 0% 100%;           /* white */
  --foreground: 0 0% 5%;             /* gray-950 */
  --card: 0 0% 100%;                 /* white */
  --card-foreground: 0 0% 5%;        /* gray-950 */
  --border: 0 0% 90%;                /* gray-200 */
  --input: 0 0% 90%;                 /* gray-200 */
  --ring: /* Primary color */         /* Focus ring */
  --radius: 0.75rem;                 /* 12px - premium rounded */
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

**Usage in Tailwind:**
```css
bg-primary text-primary-foreground
hover:bg-primary-dark
bg-accent text-accent-foreground
border-accent/20
```

### Example Color Schemes

#### Emerald Spark (Default)
- **Primary:** `#10B981` (Emerald Green)
- **Secondary:** `#059669` (Darker Green)
- **Accent:** `#F87171` (Coral Red - complementary)
- **Use:** Fresh, modern, growth-oriented brands

#### Ocean Energy
- **Primary:** `#0EA5E9` (Sky Blue)
- **Secondary:** `#0284C7` (Deep Blue)
- **Accent:** `#FB923C` (Orange - complementary)
- **Use:** Trust, professionalism, tech companies

#### Royal Violet
- **Primary:** `#8B5CF6` (Violet)
- **Secondary:** `#7C3AED` (Deep Purple)
- **Accent:** `#FBBF24` (Gold - complementary)
- **Use:** Luxury, creativity, premium brands

### Component-Specific Color Guidelines

#### Buttons
```tsx
// Primary CTA - use primary color
<Button className="bg-primary text-primary-foreground hover:bg-primary-dark">
  Save Changes
</Button>

// Secondary action - use outline with primary
<Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
  Cancel
</Button>

// Accent for special actions (use sparingly!)
<Button className="bg-accent text-accent-foreground hover:bg-accent-dark">
  Upgrade Now
</Button>
```

#### Navigation
```tsx
// Sidebar active state - subtle primary background
<Link className={cn(
  'px-4 py-3 rounded-lg',
  isActive 
    ? 'bg-primary/10 text-primary font-medium'
    : 'text-foreground/70 hover:bg-accent/5'
)}>
  Dashboard
</Link>

// Don't use full accent color backgrounds - too chaotic!
```

#### Badges & Pills
```tsx
// Status badge with accent for important info
<Badge className="bg-accent text-accent-foreground">
  Sale
</Badge>

// Regular badge with subtle primary
<Badge className="bg-primary/10 text-primary">
  Active
</Badge>
```

#### Forms
```tsx
// Focus state uses primary
<Input className="focus:ring-primary focus:border-primary" />

// Error state (not accent - use destructive)
<Input className="border-destructive focus:ring-destructive" />
```

#### Notifications
```tsx
// Success - use accent
<div className="bg-accent/10 border-accent/20 text-accent-dark">
  <CheckCircle className="text-accent" />
  Order confirmed!
</div>

// Info - use primary
<div className="bg-primary/10 border-primary/20 text-primary-dark">
  <Info className="text-primary" />
  New features available
</div>
```

### Common Color Mistakes to Avoid

1. **Using accent color everywhere**
   - ❌ Active nav items with full accent background
   - ✅ Active nav items with subtle primary background

2. **Mixing too many colors**
   - ❌ Different colors for each menu item
   - ✅ Consistent primary for all active states

3. **Poor contrast**
   - ❌ Dark text on dark primary
   - ✅ White text on all primary/accent backgrounds

4. **Accent overload**
   - ❌ Large buttons in accent color
   - ✅ Small badges and notifications in accent

5. **Ignoring hover states**
   - ❌ No visual feedback on hover
   - ✅ Use `hover:bg-primary-dark` for clear feedback

### Quick Color Rules

1. **Primary = Brand** → Use for main actions and navigation
2. **Secondary = Hover** → Automatically applied, darker shade
3. **Accent = Highlight** → Use sparingly for notifications and badges
4. **Always white text** on primary and accent backgrounds
5. **Keep it simple** → Don't use more than 3 colors per screen
6. **Test contrast** → Ensure readability on all backgrounds

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
**Version**: 3.0 (Consolidated - Color Usage + Design System)
