# Technical Stack Documentation

## Overview
yooquote (Pitchivo) is a modern web application built with a comprehensive tech stack focusing on performance, scalability, and developer experience.

---

## Frontend Technologies

### Core Framework
- **Next.js 16.0.0** - React framework with server-side rendering, static site generation, and API routes
- **React 19.1.0** - UI library for building interactive user interfaces
- **React DOM 19.1.0** - React package for working with the DOM
- **TypeScript 5** - Type-safe JavaScript for improved developer experience

### UI Components & Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework for rapid UI development ✅
- **shadcn/ui** - Re-usable components built with Radix UI and Tailwind CSS ✅
  - Components installed: Button, Input, Card, Badge
  - Style: New York
  - RSC (React Server Components) enabled
- **Radix UI** - Unstyled, accessible UI component primitives ✅:
  - `@radix-ui/react-alert-dialog` (^1.1.15)
  - `@radix-ui/react-avatar` (^1.1.10)
  - `@radix-ui/react-checkbox` (^1.3.3)
  - `@radix-ui/react-collapsible` (^1.1.12)
  - `@radix-ui/react-dialog` (^1.1.15)
  - `@radix-ui/react-dropdown-menu` (^2.1.16)
  - `@radix-ui/react-hover-card` (^1.1.15)
  - `@radix-ui/react-label` (^2.1.7)
  - `@radix-ui/react-navigation-menu` (^1.2.14)
  - `@radix-ui/react-popover` (^1.1.2)
  - `@radix-ui/react-progress` (^1.1.7)
  - `@radix-ui/react-radio-group` (^1.3.8)
  - `@radix-ui/react-scroll-area` (^1.2.10)
  - `@radix-ui/react-select` (^2.2.6)
  - `@radix-ui/react-separator` (^1.1.7)
  - `@radix-ui/react-slot` (^1.2.4)
  - `@radix-ui/react-switch` (^1.2.6)
  - `@radix-ui/react-tabs` (^1.1.13)
  - `@radix-ui/react-tooltip` (^1.2.8)
  - `@radix-ui/react-use-controllable-state` (^1.2.2)
- **Lucide React 0.400.0** - Beautiful & consistent icon library ✅
- **next-themes 0.4.6** - Theme management for dark/light mode ✅ Configured
- **class-variance-authority 0.7.1** - CSS-in-JS variant API ✅
- **clsx 2.1.1** - Utility for constructing className strings ✅
- **tailwind-merge 3.3.1** - Merge Tailwind CSS classes without style conflicts ✅
- **tailwindcss-animate 1.0.7** - Animation utilities for Tailwind CSS ✅

### Animation & Motion
- **Framer Motion 12.23.24** - Production-ready motion library for React ✅
- **tw-animate-css 1.4.0** - Tailwind CSS animation utilities ✅
- **motion 12.23.24** - Motion library (duplicate/alias of framer-motion) ✅

### State Management & Data Fetching
- **Zustand 4.5.7** - Lightweight state management solution ✅
  - Note: Root package has 5.0.8, web app uses 4.5.7
- **TanStack Query 5.90.5** - Powerful data synchronization and caching ✅
- **TanStack Table 8.21.3** - Headless UI for building powerful tables & datagrids ✅

### Forms & Validation
- **React Hook Form 7.65.0** - Performant, flexible forms with easy validation
- **Zod 3.25.76** - TypeScript-first schema validation
- **@hookform/resolvers 3.10.0** - Validation resolvers for React Hook Form

### Data Visualization
- **Recharts 3.3.0** - Composable charting library built with React components ✅ Installed

### Notifications & Toasts
- **Sonner 2.0.7** - Opinionated toast component for React

### Date Handling
- **date-fns 3.6.0** - Modern JavaScript date utility library

### Utilities
- **web-vitals 5.1.0** - Essential metrics for measuring real-world user experience
- **critters 0.0.23** - Critical CSS inlining

---

## Backend Technologies

### Database & Backend Services
- **Supabase** - Open-source Firebase alternative
  - **@supabase/supabase-js 2.76.0** - JavaScript client for Supabase
  - **@supabase/ssr 0.5.2** - Server-side rendering utilities for Supabase
  - **PostgreSQL 17** - Relational database
  - **Supabase Auth** - Built-in authentication service
  - **Supabase Storage** - File storage (50MiB limit)
  - **Supabase Realtime** - Real-time data synchronization
  - **Supabase Edge Functions** - Deno-based serverless functions

### Edge Functions
- **Deno 2** - Secure runtime for JavaScript and TypeScript
- ⚠️ **Supabase Edge Functions** - Directory structure created (`/supabase/functions/`) but not yet implemented
- Edge functions for (future):
  - Email sending (Waitlist confirmations)
  - Custom business logic

### API & Serverless
- **Next.js API Routes** - Serverless API endpoints
- **Edge Runtime** - Ultra-fast edge computing

---

## Third-Party Services

### Payment Processing
- **Stripe 16.12.0** - Payment processing platform
- **@stripe/stripe-js 4.10.0** - Stripe.js client-side library

### Email Service
- **Brevo (Sendinblue)** - Email marketing and transactional email service
  - ⚠️ **Not currently configured** - Reserved for future use
  - Sender email configuration
  - Email templates
  - Email logs and tracking

### Development & Testing
- **Inbucket** - Email testing server (local development)
  - ⚠️ **Not currently configured** - Reserved for future use

---

## Development Tools

### Build Tools & Bundlers
- **Turbopack** - Next-gen JavaScript bundler (via Next.js turbo mode)
- **PostCSS 8.5.6** - CSS transformation tool
- **Autoprefixer 10.4.21** - CSS vendor prefix automation
- **Webpack** - Module bundler (fallback/additional config)

### Code Quality
- **ESLint 9** - JavaScript/TypeScript linting
- **@eslint/eslintrc** - ESLint configuration
- **eslint-config-next 15.5.6** - Next.js ESLint configuration
- **Prettier 3.6.2** - Code formatter

### Type Safety
- **TypeScript 5** - Static type checking
- **@types/node** - Node.js type definitions
- **@types/react 19** - React type definitions
- **@types/react-dom 19** - React DOM type definitions

### Package Management
- **npm 10.9.2** - Package manager (locked version)

---

## Infrastructure & Deployment

### Hosting & CDN
- **Vercel** - Frontend hosting and deployment platform
  - PWA support via manifest and service worker
  - Automatic HTTPS
  - Global CDN
  - Edge functions support

### Progressive Web App (PWA)
- **Service Worker** (`/sw.js`) - Offline functionality and caching
- **Web App Manifest** (`/manifest.json`) - PWA configuration
- Custom PWA features and install prompts

### Database
- **Supabase (PostgreSQL 17)** - Production database
- **Database Migrations** - Version-controlled schema changes
- **Row Level Security (RLS)** - Fine-grained access control

### Monitoring & Analytics
- **Supabase Analytics** - Built-in analytics backend
- **Performance Monitor** - Custom performance monitoring component
- **Web Vitals** - Core web vitals tracking

---

## Security Features

### Authentication & Authorization
- **Supabase Auth** - JWT-based authentication
- **Email Authentication** - Email/password sign-in
- **OAuth Providers** - Support for multiple OAuth providers (Apple, Google, etc.)
- **Row Level Security** - Database-level authorization

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- X-DNS-Prefetch-Control: on

### Data Protection
- **Environment Variables** - Secure configuration management
- **HTTPS Enforcement** - Secure data transmission
- **JWT Token Management** - Secure token handling with rotation

---

## Performance Optimizations

### Image Optimization
- WebP & AVIF format support
- Responsive image sizing
- Long-term caching (1 year TTL)
- Multiple device size breakpoints

### Caching Strategy
- Static asset caching (immutable, 1 year)
- Service worker caching
- API response caching via TanStack Query
- PostgreSQL connection pooling

### Build Optimizations
- Turbopack for faster builds
- Package import optimization (Lucide React, Radix UI)
- CSS optimization
- Source map generation for debugging
- Code splitting and lazy loading

### SEO Optimizations
- Server-side rendering (SSR)
- Static site generation (SSG)
- Sitemap generation
- Robots.txt configuration
- Meta tags and Open Graph support

---

## Database Schema

The application uses PostgreSQL with the following main tables:

### Core Tables
- `waitlist` - Email waitlist management
- `email_logs` - Email delivery tracking
- `users` - User accounts
- `owner_profiles` - Business owner profiles
- `chat_profiles` - Chat widget profiles

### Feature Tables
- `services` - Service offerings
- `customers` - Customer management
- `chat_conversations` - Chat history
- `chat_messages` - Individual messages
- `conversation_actions` - Automated actions
- `bookings` - Appointment bookings
- `booking_modifications` - Booking change history
- `booking_waitlist` - Waitlist for bookings
- `owner_tasks` - Task management
- `payment_transactions` - Payment records
- `notification_logs` - Notification tracking
- `flow_templates` - Conversation flow templates
- `chat_links` - Chat widget links
- `connected_accounts` - Third-party integrations

---

## Architecture Patterns

### Monorepo Structure
- Turborepo for monorepo management
- Shared packages for code reuse
- Apps directory for application code

### Design Patterns
- Server Components (React Server Components)
- Client Components with 'use client' directive
- Middleware for authentication and routing
- API routes for backend logic
- Custom hooks for reusable logic
- Context providers for global state

### Code Organization
- Feature-based folder structure
- Shared UI components library
- Utility functions in lib directory
- Type-safe constants
- Environment-based configuration

---

## Development Workflow

### Local Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Supabase Local Development
- Local Supabase instance on port 54321
- Supabase Studio on port 54323
- Inbucket email testing on port 54324
- Database migrations management
- Edge functions local testing

---

## Version Control
- **Git** - Version control system
- **GitHub** - Code repository hosting

---

## Constants Synchronization

### Architecture

Constants must be maintained in **two locations** because Deno cannot import npm packages:

1. **Frontend**: `/apps/web/src/lib/constants.ts`
   - Used by Next.js web app
   - Contains TypeScript type definitions
   - Imported as `@/lib/constants`

2. **Backend**: `/supabase/functions/_shared/constants.ts`
   - Used by Deno-based edge functions
   - **Must be manually synchronized** with frontend

### Current Constants

- `USER_TYPES` - Owner, Client
- `PROFILE_STATUS` - Active, Paused, Deleted, Banned
- `EMAIL_STATUS` - Sent, Failed, Pending
- `EMAIL_PROVIDERS` - Brevo, Resend, Sendgrid
- `ERROR_CODES` - Auth failed, Profile creation failed, etc.

### Adding New Constants

1. Update `/apps/web/src/lib/constants.ts`
2. Update `/supabase/functions/_shared/constants.ts` (must match exactly!)
3. Create database migration if needed
4. Test locally and in production

**⚠️ Important**: Constants must be kept in sync manually. When in doubt, create a constant rather than hardcoding strings.

---

## Feature Gates

### Landing Page Authentication Mode

Toggle authentication mode in `/apps/web/src/lib/constants.ts`:

```typescript
// Change this value to switch modes:
export const LANDING_PAGE_AUTH_MODE = 'WAITLIST'     // Collect emails for waitlist
// or
export const LANDING_PAGE_AUTH_MODE = 'MAGIC_LINK'   // Send magic links for sign-in

// Auto-switch based on environment (recommended):
export const LANDING_PAGE_AUTH_MODE = 
  process.env.NODE_ENV === 'production' ? 'WAITLIST' : 'MAGIC_LINK'
```

### Modes

- **WAITLIST Mode**: Collects email addresses, adds to waitlist database table (pre-launch)
- **MAGIC_LINK Mode**: Sends passwordless sign-in links via Supabase Auth (post-launch)

---

## Best Practices Implementation

### Data Fetching

**Use TanStack Query for all server data:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['myData'],
  queryFn: fetchMyData,
  staleTime: 1000 * 60 * 5, // 5 minutes
})
```

### Form Management

**Use React Hook Form + Zod for all forms:**
```typescript
const { register, handleSubmit } = useForm({
  resolver: zodResolver(mySchema),
})
```

### State Management

- **TanStack Query**: Server state (API calls, caching)
- **Zustand**: Global client state (user session, preferences)
- **React Hook Form**: Form state
- **useState**: Local UI state only

### Animations

**Use Framer Motion for animations:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

**Principles:**
- Hardware-accelerated (transform/opacity only)
- Respect reduced motion preferences
- Keep animations subtle (scale 1.02, not 1.05)

---

## Performance Optimizations

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

### Optimizations Implemented

1. **Font Loading**: Preconnect, DNS prefetch, display swap
2. **Image Optimization**: Next.js Image with WebP/AVIF
3. **Code Splitting**: Dynamic imports for heavy components
4. **Caching**: Static assets (1 year), Service worker caching
5. **Bundle Optimization**: Tree shaking, package import optimization

### PWA Features

- **Service Worker**: Offline functionality and caching
- **Web App Manifest**: PWA configuration with icons
- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Basic offline functionality for core pages

---

## SEO & AEO Optimizations

### Structured Data Schemas

- **SoftwareApplication Schema**: App details, features, pricing
- **Organization Schema**: Company information
- **WebSite Schema**: Search action
- **FAQPage Schema**: 5 comprehensive Q&A pairs
- **Service Schema**: Service type and area served
- **HowTo Schema**: Step-by-step instructions
- **BreadcrumbList Schema**: Navigation structure

### Technical SEO

- Sitemap.xml generation
- Robots.txt configuration
- Open Graph tags
- Twitter Card tags
- Meta tags optimization
- Canonical URLs

---

## Error Handling

### API Error Handling Pattern

**Always validate content-type before parsing JSON:**
```typescript
const contentType = response.headers.get('content-type')
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('Server returned invalid response')
}
const data = await response.json()
```

### Middleware Best Practices

**Skip API routes in middleware:**
```typescript
if (request.nextUrl.pathname.startsWith('/api/')) {
  return NextResponse.next()
}
```

---

## License & Legal
- Privacy Policy page
- Terms of Service page
- Cookie policy (if applicable)

---

### Additional Packages (Not in Original Docs)
- **@ai-sdk/azure 2.0.60** - AI SDK for Azure integration
- **@ai-sdk/react 2.0.87** - AI SDK React integration
- **@ai-sdk/ui-utils 1.2.11** - AI SDK UI utilities
- **ai 5.0.87** - AI SDK core
- **@xyflow/react 12.9.2** - Flow diagram library (⚠️ Not currently used)
- **cmdk 1.1.1** - Command menu component
- **embla-carousel-react 8.6.0** - Carousel component
- **nanoid 5.1.6** - ID generator
- **react-country-flag 3.1.0** - Country flag component
- **react-easy-crop 5.5.3** - Image cropping
- **shiki 3.14.0** - Syntax highlighting
- **streamdown 1.4.0** - Streaming utilities
- **tokenlens 1.3.1** - Token utilities
- **use-stick-to-bottom 1.1.1** - Scroll hook

---

**Last Updated:** December 2024  
**Version:** 2.1 (Updated for yooquote/Pitchivo)  
**Maintained By:** yooquote Development Team

