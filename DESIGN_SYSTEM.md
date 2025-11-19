# Mobile-First Progressive Web App Design System

## 🚀 Overview

This design system is built for **mobile-first Progressive Web Apps (PWA)** using **shadcn/ui** as the foundation. It provides a sophisticated, premium UI optimized for mobile devices with seamless desktop adaptation. Built with Next.js (App Router), React, TypeScript, Tailwind CSS v3.4.18, and PWA capabilities.

**Design Philosophy: WOW Users, Not Just Function**

This isn't a basic MVP. The interface should look **stunning at first glance** with rich aesthetics, modern design practices, and a high-end, cutting-edge feeling. Users should be impressed by the visual excellence and dynamic, lively interactions.

**Current Implementation:**
- ✅ Next.js App Router with React & TypeScript
- ✅ shadcn/ui components installed (Button, Input, Card, Badge)
- ✅ Organization-based color theming implemented
- ✅ ThemeProvider configured with next-themes
- ✅ Premium animations and utilities
- ✅ Mobile-first responsive design
- ✅ Modern Google Fonts (Inter, Outfit, Roboto)
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

### Rich Aesthetics & Visual Excellence

**Rule: Avoid plain primary colors. Use carefully curated color palettes with HSL for maximum control and vibrancy.**

#### HSL Color Philosophy

Use HSL (Hue, Saturation, Lightness) for more sophisticated color control:

```css
/* ✅ Good - HSL gives fine control */
--primary: 142 71% 45%;        /* Emerald Green - rich, vibrant */
--primary-light: 142 71% 65%;  /* Lighter variant */
--primary-dark: 142 71% 35%;   /* Darker variant */

/* ❌ Avoid - Plain, boring primary colors */
--primary: #0000FF;  /* Plain blue - too basic */
--primary: #FF0000;  /* Plain red - too harsh */
--primary: #00FF00;  /* Plain green - too bright */
```

**Color Selection Guidelines:**
1. **Avoid plain RGB primaries** (pure red/blue/green)
2. **Use sophisticated hues** with proper saturation (50-70%)
3. **Create depth** with lightness variants (35% dark, 65% light)
4. **Test contrast** - ensure WCAG AA compliance (4.5:1 ratio)
5. **Use HSL format** in Tailwind for maximum flexibility

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

### Premium Visual Elements

**Rule: Create depth and sophistication through gradients, shadows, glassmorphism, and modern effects**

#### Smooth Gradients

**✅ Use sophisticated gradients for backgrounds and accents**

```tsx
// ✅ Correct - Subtle, premium gradients
<div className="bg-gradient-to-br from-primary/10 via-background to-accent/5">
  Hero Section
</div>

<div className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
  CTA Button Background
</div>

// Dark mode gradient hero
<div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
  Premium Dark Hero
</div>

// Mesh gradient background
<div 
  className="relative"
  style={{
    background: `
      radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, hsl(var(--accent) / 0.1) 0%, transparent 50%),
      hsl(var(--background))
    `
  }}
>
  Content
</div>

// ❌ Wrong - Harsh, basic gradients
<div className="bg-gradient-to-r from-red-500 to-blue-500">  // Too harsh
```

#### Soft Shadows

**✅ Use layered shadows for depth**

```tsx
// ✅ Correct - Soft, layered shadows
className="shadow-sm"                           // Subtle elevation
className="shadow-md"                           // Card elevation
className="shadow-lg shadow-primary/10"         // Premium card with tint
className="shadow-2xl shadow-primary/20"        // Hero elements

// Custom premium shadow
className="shadow-[0_8px_30px_rgb(0,0,0,0.12)]"

// Hover elevation
className="shadow-md hover:shadow-xl hover:shadow-primary/20 transition-shadow duration-300"

// ❌ Wrong - Harsh shadows
className="shadow-[0_0_20px_#FF0000]"  // Too bright, no subtlety
```

#### Glassmorphism

**✅ Modern glass-like effect for premium feel**

```tsx
// ✅ Correct - Glassmorphism card
<div className="
  bg-white/10 
  backdrop-blur-lg 
  border border-white/20
  rounded-xl
  shadow-lg
  p-6
">
  Glass Card Content
</div>

// Glass navigation bar
<nav className="
  sticky top-0 z-50
  bg-background/80
  backdrop-blur-md
  border-b border-border/50
  shadow-sm
">
  Navigation
</nav>

// Dark mode glass
<div className="
  bg-gray-900/70
  backdrop-blur-xl
  border border-gray-700/50
  rounded-2xl
">
  Dark Glass
</div>
```

#### Dark Mode & Theme

**✅ Support elegant dark mode**

```tsx
// ✅ Correct - Dark mode support with next-themes
import { ThemeProvider } from 'next-themes'

// In layout.tsx
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>

// Dark mode styles
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-800
">
  Content
</div>

// Use CSS variables (auto-adapts to dark mode)
<div className="bg-background text-foreground">
  Auto-adapting content
</div>
```

#### Visual Hierarchy

**✅ Create clear visual hierarchy with size, weight, and color**

```tsx
// ✅ Correct - Clear hierarchy
<section>
  {/* Primary focal point - largest, bold, primary color */}
  <h1 className="text-4xl font-display font-bold text-foreground">
    Main Title
  </h1>
  
  {/* Secondary - medium, semibold, muted */}
  <h2 className="text-2xl font-display font-semibold text-foreground/90 mt-4">
    Subtitle
  </h2>
  
  {/* Tertiary - base size, normal weight, more muted */}
  <p className="text-base font-sans text-muted-foreground mt-2">
    Supporting text with less emphasis
  </p>
  
  {/* Metadata - small, muted */}
  <span className="text-sm text-muted-foreground/70">
    Published 2 hours ago
  </span>
</section>

// ❌ Wrong - No hierarchy
<section>
  <h1 className="text-2xl">Title</h1>
  <p className="text-2xl">Text</p>  // Same size as title
  <span className="text-2xl">Metadata</span>  // Same size again
</section>
```

#### Decorative Elements

**✅ Add subtle decorative elements for premium feel**

```tsx
// Floating orbs
<div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" />
<div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" />

// Diagonal lines pattern
<div 
  className="absolute inset-0 pointer-events-none opacity-20 -z-10"
  style={{
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 20px,
      hsl(var(--primary)) 20px,
      hsl(var(--primary)) 21px
    )`
  }}
/>

// Dot grid pattern
<div 
  className="absolute inset-0 pointer-events-none opacity-10 -z-10"
  style={{
    backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
    backgroundSize: '24px 24px'
  }}
/>
```

---

## 🎯 Animation System

### Micro-Interactions

**Rule: Add subtle micro-interactions to make the UI feel alive and responsive**

#### Hover States

```tsx
// ✅ Correct - Sophisticated hover effects
<button className="
  transition-all duration-300
  hover:scale-[1.02]
  hover:shadow-lg
  hover:shadow-primary/30
  hover:-translate-y-0.5
  active:scale-[0.98]
  active:translate-y-0
">
  Interactive Button
</button>

// Card hover with multiple effects
<div className="
  group
  transition-all duration-300
  hover:shadow-xl
  hover:shadow-primary/20
  hover:-translate-y-1
  hover:border-primary/50
  cursor-pointer
">
  <div className="
    transition-transform duration-300
    group-hover:scale-105
  ">
    Card Content
  </div>
  <div className="
    text-muted-foreground
    transition-colors duration-300
    group-hover:text-primary
  ">
    Hover to highlight
  </div>
</div>

// Link hover
<a className="
  text-primary
  underline-offset-4
  decoration-2
  hover:underline
  hover:text-primary-dark
  transition-all duration-200
">
  Interactive Link
</a>
```

#### Focus States

```tsx
// ✅ Correct - Clear focus indicators
<input className="
  focus:ring-2
  focus:ring-primary
  focus:ring-offset-2
  focus:border-primary
  focus:outline-none
  transition-all duration-200
" />

<button className="
  focus-visible:ring-2
  focus-visible:ring-primary
  focus-visible:ring-offset-2
  focus-visible:outline-none
  focus-visible:scale-[1.02]
  transition-all duration-200
">
  Accessible Button
</button>
```

#### Page Transitions

```tsx
// ✅ Correct - Smooth page transitions with Framer Motion
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  Page Content
</motion.div>

// Staggered list animations
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### Loading States

```tsx
// ✅ Correct - Smooth loading animations
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-muted rounded w-3/4" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>

// Spinner
<div className="
  animate-spin
  rounded-full
  h-8 w-8
  border-2
  border-primary
  border-t-transparent
" />

// Skeleton with shimmer
<div className="
  relative
  overflow-hidden
  bg-muted
  rounded-lg
  before:absolute
  before:inset-0
  before:-translate-x-full
  before:animate-shimmer
  before:bg-gradient-to-r
  before:from-transparent
  before:via-white/20
  before:to-transparent
">
  Content
</div>
```

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

1. **🎨 WOW FACTOR (CRITICAL)**: 
   - Interface must look **stunning at first glance**
   - Not a basic MVP - high-end, cutting-edge aesthetic
   - Rich colors, depth, motion, and premium feel
   - Users should be impressed immediately

2. **⚡ INTEGRAL DESIGN**: 
   - **ALWAYS** use continuous flow with `<section>` elements
   - **NEVER** use cards with borders (`<Card>` with borders)
   - Use `border-b` dividers between sections, not card wrappers
   - Sticky headers for section navigation
   - `divide-y` for list items within sections

3. **📋 SEMANTIC HTML**: 
   - Exactly **one `<h1>` per page**
   - Proper heading hierarchy (h2, h3, h4)
   - Use semantic elements (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`, `<article>`)
   - **Every interactive element** has unique, descriptive `id`
   - Accessible labels on all inputs and buttons

4. **🎨 VISUAL EXCELLENCE**:
   - **NO plain primary colors** (avoid pure red/blue/green)
   - Use **sophisticated HSL color palettes**
   - Modern **Google Fonts** (Inter, Outfit, Roboto) - never browser defaults
   - Smooth gradients, soft shadows, glassmorphism
   - Clear visual hierarchy with size, weight, and color

5. **✨ DYNAMIC & ALIVE**:
   - Subtle micro-interactions (hover, focus, press states)
   - Smooth animations and transitions
   - Loading states with skeletons
   - Responsive feedback on all interactions

6. **🚫 NO PLACEHOLDERS**:
   - Never use Lorem ipsum
   - Use realistic sample copy
   - High-quality images from Unsplash or custom SVGs
   - No "Coming soon" or "Image here" placeholders

7. **🔍 SEO OPTIMIZED**:
   - Unique title and meta description per page
   - Open Graph and Twitter Card tags
   - Semantic HTML for search engines
   - Fast performance (< 3s load time)

8. **📱 MOBILE-FIRST**: 
   - Design for mobile, enhance for desktop
   - 44px minimum touch targets
   - Touch-optimized interactions

9. **🎯 TECH STACK**:
   - Next.js (App Router)
   - React with TypeScript
   - Tailwind CSS (no inline styles)
   - shadcn/ui components
   - Framer Motion for animations

### Key Metrics

- **Touch Target**: Minimum 44px × 44px
- **Typography**: Minimum 16px on mobile, modern Google Fonts required
- **Border Radius**: 8px (rounded-lg) or 12px (rounded-xl)
- **Spacing Mobile**: gap-3 (12px), px-4 (16px)
- **Spacing Desktop**: lg:gap-6 (24px), lg:px-8 (32px)
- **Animation Scale**: 1.02 hover, 0.98 tap
- **Heading Hierarchy**: One h1, proper h2-h6 structure
- **Color Format**: HSL for maximum control
- **Load Time**: < 3 seconds for SEO

---

## 🤖 AI Prompt Template

When generating UI with AI, use this prompt:

```
Create a **STUNNING, PREMIUM** web application using **Next.js (App Router) + shadcn/ui + Tailwind CSS**.

🎨 VISUAL EXCELLENCE (MUST WOW USERS):
- Interface must look **stunning at first glance** - NOT a basic MVP
- Use sophisticated **HSL color palettes** - NEVER plain primary colors (red/blue/green)
- Modern **Google Fonts** (Inter, Outfit, Roboto) - NEVER browser defaults
- Rich aesthetics: smooth gradients, soft shadows, glassmorphism, depth
- Subtle micro-interactions: hover effects, focus states, smooth transitions
- Dynamic and alive: animations, loading states, responsive feedback

📋 SEMANTIC HTML (REQUIRED):
- **Exactly ONE `<h1>` per page** with proper heading hierarchy (h2, h3, h4)
- Use semantic elements: `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`, `<article>`, `<aside>`
- **Every interactive element** needs unique, descriptive `id` (e.g., `user-profile-edit-button`)
- Format: `[context]-[element]-[action]` (e.g., `dashboard-stats-refresh-button`)
- All inputs and buttons need accessible labels (`aria-label`)

⚡ INTEGRAL DESIGN (CRITICAL):
- **NEVER use Card components with borders** - this is FORBIDDEN
- **ALWAYS use continuous flow** with `<section>` elements
- Use `border-b border-border/30` for section dividers, NOT card borders
- Use sticky headers: `sticky top-0 bg-background/95 backdrop-blur-sm z-10`
- Use `divide-y divide-border/30` for list items within sections
- Structure: Page Header → Search/Filter Section → Content Section (all as `<section>`)

🚫 NO PLACEHOLDERS:
- NEVER use "Lorem ipsum" text
- Use realistic sample copy with actual feature descriptions
- High-quality images from Unsplash (https://images.unsplash.com/photo-...)
- Custom SVG illustrations with brand colors
- NO "Coming soon" or "Image here" placeholders

🔍 SEO OPTIMIZATION (EVERY PAGE):
- Unique `<title>` tag (50-60 characters)
- Meta description (150-160 characters)
- Open Graph and Twitter Card tags
- Semantic HTML structure for search engines
- Alt text on all images

📱 MOBILE-FIRST PWA:
- Design for mobile first, enhance for desktop
- 44px minimum touch targets
- Touch-optimized: `touch-manipulation`, `active:scale-[0.98]`
- Bottom navigation on mobile, sidebar on desktop
- Responsive: `px-4 sm:px-6 lg:px-8`, `text-base lg:text-lg`

🎯 TECH STACK:
- Next.js App Router with TypeScript
- Tailwind CSS (NO inline styles except rare cases)
- shadcn/ui components
- Framer Motion for animations
- next/font/google for font optimization

Example page structure:
```tsx
// app/dashboard/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Your App',
  description: 'Manage your projects and track progress',
  openGraph: {
    title: 'Dashboard - Your App',
    description: 'Manage your projects and track progress',
    images: [{ url: '/og-dashboard.png' }],
  },
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track your progress and manage your workflow
          </p>
        </div>
      </section>

      {/* Stats Section - Integral */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stats with unique IDs */}
          <div id="stat-total-projects" className="p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
            <p className="text-sm text-muted-foreground">Total Projects</p>
            <p className="text-2xl font-display font-bold text-foreground">24</p>
          </div>
          {/* More stats... */}
        </div>
      </section>

      {/* Content Section - Integral */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="divide-y divide-border/30">
          {/* List items with unique IDs */}
          <div id="activity-item-1" className="py-4 hover:bg-accent/5 transition-colors">
            {/* Content */}
          </div>
        </div>
      </section>
    </main>
  )
}
```
```

---

**Last Updated**: November 2024  
**Version**: 4.0 (Premium Modern Web App - Complete Guide)
