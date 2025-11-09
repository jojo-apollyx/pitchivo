# Color Usage Guide

## How to Use Primary, Secondary, and Accent Colors Properly

This guide explains how to use colors in your UI components following design best practices from Figma, Stripe, Linear, and Vercel.

Reference: [Figma Color Combinations](https://www.figma.com/resource-library/color-combinations/)

---

## 🎨 Color Roles

### PRIMARY COLOR
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

---

### SECONDARY COLOR
**Darker shade of primary - used internally for hover states**

**Use for:**
- ✅ Hover states on primary elements
- ✅ Pressed states on buttons
- ✅ Darker variations (automatically applied as `--primary-dark`)

**Don't use directly in components** - it's automatically applied via `hover:bg-primary-dark`

---

### ACCENT COLOR
**Complementary color - use SPARINGLY for highlights**

**Use for:**
- ✅ Notifications badges (e.g., "3 new messages")
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

---

## 📋 Component-Specific Guidelines

### Buttons
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

### Navigation
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

### Badges & Pills
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

### Forms
```tsx
// Focus state uses primary
<Input className="focus:ring-primary focus:border-primary" />

// Error state (not accent - use destructive)
<Input className="border-destructive focus:ring-destructive" />
```

### Notifications
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

---

## 🎯 Color Scheme Categories

### Vibrant
- Bold, confident combinations
- Primary for main actions
- Complementary accent for energy
- Example: Emerald + Coral Red

### Tranquil
- Calm, peaceful palettes
- Soft primary colors
- Gentle complementary accents
- Example: Forest Green + Soft Peach

### Playful
- Friendly, approachable
- Warm primary colors
- Energetic accents
- Example: Amber + Sky Blue

### Neutral
- Sophisticated grays
- Professional primary
- Warm orange/amber accents
- Example: Slate + Orange

---

## ❌ Common Mistakes to Avoid

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

---

## 📐 CSS Variables Reference

```css
/* Primary - Main brand color */
--primary: /* Main color */
--primary-foreground: white /* Text on primary */
--primary-light: /* Lighter variant */
--primary-dark: /* Hover state (uses secondary) */
--primary-darker: /* Pressed state */

/* Accent - Complementary highlights */
--accent: /* Main accent */
--accent-foreground: white /* Text on accent */
--accent-color: /* Pure accent */
--accent-light: /* Lighter variant */
--accent-dark: /* Darker variant */

/* Usage in Tailwind */
bg-primary text-primary-foreground
hover:bg-primary-dark
bg-accent text-accent-foreground
border-accent/20
```

---

## 🌈 Example Schemes

### Emerald Spark (Default)
- **Primary:** `#10B981` (Emerald Green)
- **Secondary:** `#059669` (Darker Green)
- **Accent:** `#F87171` (Coral Red - complementary)
- **Use:** Fresh, modern, growth-oriented brands

### Ocean Energy
- **Primary:** `#0EA5E9` (Sky Blue)
- **Secondary:** `#0284C7` (Deep Blue)
- **Accent:** `#FB923C` (Orange - complementary)
- **Use:** Trust, professionalism, tech companies

### Royal Violet
- **Primary:** `#8B5CF6` (Violet)
- **Secondary:** `#7C3AED` (Deep Purple)
- **Accent:** `#FBBF24` (Gold - complementary)
- **Use:** Luxury, creativity, premium brands

### Professional Grayscale Themes

**Midnight Black**
- **Primary:** `#1F2937` (Dark Gray)
- **Secondary:** `#111827` (Nearly Black)
- **Accent:** `#60A5FA` (Blue)
- **Use:** Luxury brands, premium services, high-end products

**Light Minimalist**
- **Primary:** `#9CA3AF` (Gray)
- **Secondary:** `#6B7280` (Medium Gray)
- **Accent:** `#10B981` (Emerald)
- **Use:** Minimalist brands, clean interfaces, modern design (good contrast with text)

**Corporate Gray**
- **Primary:** `#6B7280` (Medium Gray)
- **Secondary:** `#4B5563` (Dark Gray)
- **Accent:** `#3B82F6` (Blue)
- **Use:** Corporate identity, professional services, B2B platforms

**Charcoal Elite**
- **Primary:** `#374151` (Charcoal)
- **Secondary:** `#1F2937` (Deep Charcoal)
- **Accent:** `#FBBF24` (Gold)
- **Use:** Premium services, luxury consulting, executive brands

---

## 💡 Quick Rules

1. **Primary = Brand** → Use for main actions and navigation
2. **Secondary = Hover** → Automatically applied, darker shade
3. **Accent = Highlight** → Use sparingly for notifications and badges
4. **Always white text** on primary and accent backgrounds
5. **Keep it simple** → Don't use more than 3 colors per screen
6. **Test contrast** → Ensure readability on all backgrounds

---

**Questions?** Check the implementation in `apps/web/lib/theme.ts` for the complete color system.

