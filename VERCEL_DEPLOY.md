# Vercel Deployment Guide - Pitchivo

## Current Configuration

The project is already linked to **"pitchivo"** in Vercel:
- Project Name: `pitchivo`
- Project ID: `prj_usjrT2rk9LOjPIjqLGnILLFwH7or`
- Location: `apps/web/.vercel/project.json`

## If Vercel CLI is connecting to the wrong project:

### Option 1: Re-link the project (Recommended)

```bash
# Navigate to the web app directory
cd apps/web

# Remove the existing .vercel directory
rm -rf .vercel

# Re-link to the correct project
vercel link

# When prompted:
# - Select "Set up and deploy" or "Link to existing project"
# - Choose or create the "pitchivo" project
# - Confirm the settings
```

### Option 2: Force link to specific project

```bash
cd apps/web

# Remove existing link
rm -rf .vercel

# Link directly to pitchivo project
vercel link --project=pitchivo

# Or if you know the project ID:
vercel link --project=prj_usjrT2rk9LOjPIjqLGnILLFwH7or
```

### Option 3: Deploy with explicit project flag

```bash
cd apps/web

# Deploy to production with explicit project
vercel --prod --project=pitchivo

# Or with project ID
vercel --prod --project=prj_usjrT2rk9LOjPIjqLGnILLFwH7or
```

## Verify Project Link

```bash
cd apps/web
cat .vercel/project.json
```

Should show:
```json
{
  "projectId": "prj_usjrT2rk9LOjPIjqLGnILLFwH7or",
  "orgId": "team_0DSfN5CZifjKm2SGXuZ6dGlt",
  "projectName": "pitchivo"
}
```

## Deployment Commands

### Deploy to Production
```bash
cd apps/web
vercel --prod
```

### Deploy to Preview
```bash
cd apps/web
vercel
```

### Check Deployment Status
```bash
cd apps/web
vercel ls
```

## Troubleshooting

If you're still seeing "yooquote" instead of "pitchivo":

1. **Check Vercel Dashboard**: Go to https://vercel.com and verify the project name is "pitchivo"
2. **Check CLI Authentication**: Run `vercel whoami` to ensure you're logged in
3. **Clear Vercel Cache**: Remove `.vercel` directory and re-link
4. **Check Workspace**: Ensure you're in the correct workspace/team in Vercel

## Project Structure

```
apps/web/
├── .vercel/          # Vercel project configuration (DO NOT COMMIT)
│   └── project.json  # Contains project ID and name
├── vercel.json       # Vercel build configuration
└── ...
```

## Important Notes

- The `.vercel` directory should be in `.gitignore` (automatically added by Vercel)
- Never commit the `.vercel` directory to git
- Each team member should run `vercel link` on their local machine
- The project name in Vercel dashboard should match "pitchivo"

