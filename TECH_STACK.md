# Technical Stack Documentation

## Overview
Pitchivo is a modern web application built with a comprehensive tech stack focusing on performance, scalability, and developer experience.

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
- **Zustand 4.5.7** - Lightweight state management solution ✅ **REQUIRED for client state**
  - Note: Root package has 5.0.8, web app uses 4.5.7
  - Use for: Theme state, UI state (dialogs, loading), global client state
  - See patterns below
- **TanStack Query 5.90.5** - Powerful data synchronization and caching ✅ **REQUIRED for server state**
  - Use for: All API calls, data fetching, caching
  - Automatically works with impersonation via cookies
  - See patterns below
- **TanStack Table 8.21.3** - Headless UI for building powerful tables & datagrids ✅ **REQUIRED for tables**
  - Use for: All data tables (admin pages, lists, etc.)
  - See patterns below

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

## Library Usage Patterns

### Zustand State Management

**REQUIRED: Use Zustand for all global client state**

**Available Stores:**
- `useThemeStore()` - Theme/color scheme management
- `useUIStore()` - Dialog and UI state management

**Theme Store Pattern:**
```typescript
import { useThemeStore } from '@/lib/stores/theme-store'

function MyComponent() {
  const { selectedScheme, setScheme, initializeFromStorage } = useThemeStore()
  
  useEffect(() => {
    initializeFromStorage() // Load from localStorage on mount
  }, [])
  
  const handleChange = (scheme: ColorScheme) => {
    setScheme(scheme) // Automatically applies and persists
  }
}
```

**UI Store Pattern (Dialogs):**
```typescript
import { useUIStore } from '@/lib/stores/ui-store'

function MyComponent() {
  const { openDialog, closeDialog, isDialogOpen, getDialogData } = useUIStore()
  
  const handleOpen = () => {
    openDialog('myDialog', { data: 'some data' })
  }
  
  const handleClose = () => {
    closeDialog('myDialog')
  }
  
  // In JSX:
  <Dialog open={isDialogOpen('myDialog')} onOpenChange={handleClose}>
    <DialogContent>
      {getDialogData('myDialog')?.data}
    </DialogContent>
  </Dialog>
}
```

**When to use Zustand:**
- ✅ Theme/color scheme state
- ✅ Dialog/modal state
- ✅ Global UI state (loading, notifications)
- ✅ User preferences
- ❌ Form state (use React Hook Form)
- ❌ Server data (use TanStack Query)
- ❌ Component-local state (use useState)

---

### TanStack Table Pattern

**REQUIRED: Use TanStack Table for all data tables**

**Step 1: Define Types**
```typescript
// app/admin/users/types.ts
export interface User {
  id: string
  email: string
  full_name?: string
  // ... other fields
}
```

**Step 2: Create Column Definitions**
```typescript
// app/admin/users/columns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { createSortableHeader, createDateColumn } from '@/components/data-table/column-helpers'

export const createUsersColumns = (
  onAction: (user: User) => void
): ColumnDef<User>[] => [
  createSortableHeader<User>('Email', 'email'),
  createSortableHeader<User>('Name', 'full_name'),
  createDateColumn<User>('created_at', 'Created At'),
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button onClick={() => onAction(row.original)}>Action</Button>
    ),
  },
]
```

**Step 3: Use DataTable Component**
```typescript
// app/admin/users/page.tsx
import { DataTable } from '@/components/data-table/data-table'
import { createUsersColumns } from './columns'

export default function UsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  })
  
  const columns = useMemo(
    () => createUsersColumns(handleAction),
    []
  )
  
  return (
    <DataTable
      columns={columns}
      data={users}
      searchKey="email"
      searchPlaceholder="Search users..."
      loading={isLoading}
      emptyMessage="No users found"
    />
  )
}
```

**Features:**
- ✅ Automatic sorting (click column headers)
- ✅ Built-in search/filtering
- ✅ Pagination
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design

---

### API Routes with Impersonation

**REQUIRED: Use `withApiHandler` wrapper for all API routes**

**Pattern:**
```typescript
// app/api/products/route.ts
import { withApiHandler } from '@/lib/impersonation'
import { z } from 'zod'

// GET endpoint
export const GET = withApiHandler(
  '/api/products',
  'GET',
  'list_products',
  async ({ context, supabase }) => {
    // context automatically includes:
    // - userId: effective user (impersonated if applicable)
    // - organizationId: effective org (impersonated if applicable)
    // - isImpersonating: boolean
    // - isAdmin: boolean
    
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', context.organizationId) // Uses impersonated org
    
    return { products: data }
  },
  { requireOrg: true } // Options: requireOrg, requireAdmin
)

// POST endpoint with validation
export const POST = withApiHandler(
  '/api/products',
  'POST',
  'create_product',
  async ({ context, supabase, request }) => {
    const body = await request.json()
    
    // Validate with Zod
    const validated = z.object({
      name: z.string(),
      price: z.number(),
    }).parse(body)
    
    const { data } = await supabase
      .from('products')
      .insert({
        ...validated,
        organization_id: context.organizationId, // Auto-scoped
        created_by: context.userId, // Auto-scoped
      })
      .select()
      .single()
    
    return { product: data }
  },
  { requireOrg: true }
)
```

**What `withApiHandler` provides:**
- ✅ Automatic impersonation context
- ✅ Automatic logging
- ✅ Organization validation
- ✅ Error handling
- ✅ Type safety

**Options:**
- `requireOrg: true` - Ensures organization context exists
- `requireAdmin: true` - Requires admin access (for admin-only endpoints)

---

### TanStack Query with Impersonation

**REQUIRED: Use `apiClient` for all API calls**

**Pattern:**
```typescript
// lib/api/products.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient, queryKeys } from './client'
import { z } from 'zod'

// Query hook
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: async () => {
      // apiClient automatically includes cookies (impersonation cookie)
      const data = await apiClient<{ products: Product[] }>('/api/products')
      return z.object({ products: z.array(productSchema) }).parse(data)
    },
  })
}

// Mutation hook
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      // Validate input with Zod
      const validated = createProductSchema.parse(input)
      
      // apiClient sends cookies automatically
      return apiClient<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(validated),
      })
    },
    onSuccess: () => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
    },
  })
}
```

**How Impersonation Works:**
1. Admin sets impersonation cookie via `/api/impersonate` endpoint
2. `apiClient` automatically includes cookies with `credentials: 'include'`
3. API route reads cookie via `withApiHandler` → gets impersonation context
4. All queries automatically use impersonated user/org context
5. No manual cookie handling needed!

**Query Keys Pattern:**
```typescript
// lib/api/client.ts
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
  },
} as const
```

**Cache Invalidation:**
```typescript
// After mutations, invalidate related queries
queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() })
queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
```

---

### Impersonation Flow

**How Impersonation Works End-to-End:**

1. **Admin initiates impersonation:**
```typescript
// Admin clicks "Impersonate" button
await fetch('/api/impersonate', {
  method: 'POST',
  body: JSON.stringify({ userId: targetUserId }),
})
// Sets cookie: impersonate_user_id=targetUserId
```

2. **Client-side API calls:**
```typescript
// All API calls via apiClient automatically include cookies
const data = await apiClient('/api/products')
// Cookie sent automatically → API gets impersonation context
```

3. **Server-side API route:**
```typescript
// withApiHandler automatically reads cookie and provides context
export const GET = withApiHandler('/api/products', 'GET', 'list_products', 
  async ({ context }) => {
    // context.userId = impersonated user (if applicable)
    // context.organizationId = impersonated org (if applicable)
    // context.isImpersonating = true/false
  }
)
```

4. **Server-side pages:**
```typescript
// Use getEffectiveUserAndProfile() helper
import { getEffectiveUserAndProfile } from '@/lib/auth'

export default async function Page() {
  const { user, profile, organization } = await getEffectiveUserAndProfile()
  // Automatically returns impersonated user/org if cookie is set
}
```

**Key Points:**
- ✅ Impersonation is cookie-based (no query params)
- ✅ Works automatically with TanStack Query
- ✅ Works automatically with API routes (via `withApiHandler`)
- ✅ Works automatically with server pages (via `getEffectiveUserAndProfile`)
- ✅ All actions are logged for audit trail

---

## Best Practices Implementation

### Data Fetching

**REQUIRED: Use TanStack Query + apiClient for all server data:**
```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient, queryKeys } from '@/lib/api/client'

const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.products.lists(),
  queryFn: async () => {
    // apiClient automatically includes cookies (impersonation support)
    return apiClient<{ products: Product[] }>('/api/products')
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
})
```

**See "TanStack Query with Impersonation" section above for full patterns.**

### Form Management

**REQUIRED: Use React Hook Form + Zod for all forms:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})

// Submit handler
const onSubmit = async (data: z.infer<typeof schema>) => {
  // Use TanStack Query mutation
  await createProduct.mutateAsync(data)
}
```

**Always validate with Zod before sending to API.**

### State Management

**REQUIRED: Use the right tool for the right job**

- **TanStack Query**: Server state (API calls, caching) - **ALWAYS use this for API data**
- **Zustand**: Global client state (theme, dialogs, UI state) - **ALWAYS use this for global client state**
- **React Hook Form**: Form state - **ALWAYS use this for forms**
- **useState**: Local component state only - **ONLY for component-specific UI state**

### Animations

**REQUIRED: Use Framer Motion for all animations**

**Button animations (automatic via Button component):**
```typescript
// Button component already includes animations
<Button>Click me</Button> // Automatically has hover/tap animations
```

**Page transitions:**
```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Page content */}
</motion.div>
```

**Component animations:**
```typescript
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
  {/* Interactive element */}
</motion.div>
```

**Principles:**
- Hardware-accelerated (transform/opacity only)
- Respect reduced motion preferences
- Keep animations subtle (scale 1.02, not 1.05)
- Duration: 0.2-0.3s for responsiveness

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

### Additional Packages
- **@ai-sdk/azure 2.0.60** - AI SDK for Azure integration
- **@ai-sdk/react 2.0.87** - AI SDK React integration
- **@ai-sdk/ui-utils 1.2.11** - AI SDK UI utilities
- **ai 5.0.87** - AI SDK core
- **cmdk 1.1.1** - Command menu component
- **embla-carousel-react 8.6.0** - Carousel component
- **nanoid 5.1.6** - ID generator
- **react-country-flag 3.1.0** - Country flag component
- **react-easy-crop 5.5.3** - Image cropping
- **shiki 3.14.0** - Syntax highlighting
- **streamdown 1.4.0** - Streaming utilities
- **tokenlens 1.3.1** - Token utilities
- **use-stick-to-bottom 1.1.1** - Scroll hook

### Removed Packages
- **@xyflow/react** - Removed (not used)
- **motion** - Removed (duplicate of framer-motion)

---

**Last Updated:** December 2024  
**Version:** 2.1 (Updated for Pitchivo)  
**Maintained By:** Pitchivo Development Team

