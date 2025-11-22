# Pitchivo

B2B chemical marketplace platform with integrated email campaign management.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SMARTLEAD_API_KEY=
BREVO_API_KEY=
```

3. **Run database migrations:**
```bash
cd supabase
supabase db push
```

4. **Start development server:**
```bash
npm run dev
```

## 📖 Documentation

- **[Project Documentation](./PROJECT_DOCUMENTATION.md)** - Complete architecture, setup, and development guide
- **[Smartlead API Reference](./SMARTLEAD_API_REFERENCE.md)** - Full API documentation
- **[Tech Stack](./TECH_STACK.md)** - Technology choices and stack details
- **[Design System](./DESIGN_SYSTEM.md)** - UI/UX design guidelines

### Module-Specific Docs
- [Supabase Schema](./supabase/CURRENT_SCHEMA.md)
- [Brevo Setup](./supabase/BREVO_SETUP.md)
- [Admin Setup](./supabase/ADMIN_SETUP.md)

## 🧱 Repository Structure

```
pitchivo/
├── apps/
│   └── web/              # Main Next.js application
│       ├── app/          # Next.js App Router
│       ├── components/   # React components
│       └── lib/          # Utilities and clients
├── packages/
│   └── ui/               # Shared UI components
└── supabase/
    └── migrations/       # Database migrations
```

## 📦 Tech Stack

- **Frontend:** Next.js 14+, React, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Email:** Smartlead (campaigns), Brevo (transactional)
- **Monorepo:** Turborepo

## 🚢 Deployment

### Vercel

1. Import from GitHub → choose `pitchivo`
2. Set **Root Directory:** `apps/web`
3. Add environment variables
4. Deploy ✅

### Webhook Configuration

After deployment, configure Smartlead webhook:
1. Go to Smartlead → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/smartlead`
3. Select all event types
4. Save

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run clean` - Clean build artifacts

## 🔑 Key Features

- **Campaign Management** - Create and manage email campaigns
- **Smartlead Integration** - Full bi-directional sync with Smartlead
- **Lead Management** - Track and manage leads
- **Analytics Dashboard** - Real-time campaign metrics
- **Multi-tenant Support** - Organization-based attribution

