# Pitchivo

A clean monorepo boilerplate built with Next.js, Tailwind CSS, Supabase, and Turborepo.

## 🧱 Structure

```
pitchivo/
├── apps/
│   └── web/          # Main Next.js app
├── packages/
│   └── ui/           # Shared UI components
```

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase credentials
```

3. Run development server:
```bash
npm run dev
```

## 📦 Tech Stack

- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service
- **Turborepo** - Monorepo build system
- **TypeScript** - Type safety

## 🚢 Deployment

### Vercel

1. Import from GitHub → choose `pitchivo`
2. Set **Root Directory:** `apps/web`
3. Add environment variables from `.env.example`
4. Deploy ✅

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run clean` - Clean build artifacts

