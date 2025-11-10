# Brevo Transactional Email Setup

This document explains how to set up Brevo (formerly Sendinblue) for transactional emails in your Supabase project.

## Prerequisites

- A Brevo account (sign up at https://www.brevo.com/)
- A Brevo API key with transactional email permissions
- Access to your Supabase project dashboard

## API Key

Your Brevo API key can be found in your Brevo account:
1. Log in to your Brevo account
2. Go to **Settings** → **API Keys**
3. Create a new API key or use an existing one with transactional email permissions

**Important:** Never commit your actual API key to git. Use placeholders in documentation.

## Setting Up in Production Supabase

### Step 1: Add the API Key as a Secret

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Add the following secrets:

   **Secret 1 (Required):**
   - **Name:** `BREVO_API_KEY`
   - **Value:** `YOUR_BREVO_API_KEY_HERE` (replace with your actual API key from Brevo)

   **Secret 2 (Required):**
   - **Name:** `BREVO_SENDER_EMAIL`
   - **Value:** Your verified sender email (e.g., `team@yourdomain.com`)
   - **Note:** This must be a verified sender email in your Brevo account
   - **IMPORTANT:** Use `team@` instead of `noreply@` to improve deliverability. `noreply@` addresses are often flagged as spam by email providers.

   **Secret 3 (Optional):**
   - **Name:** `BREVO_SENDER_NAME`
   - **Value:** Your sender name (e.g., `Pitchivo`)
   - **Note:** If not set, defaults to "Pitchivo"

### Important Notes

- **BREVO_API_KEY** and **BREVO_SENDER_EMAIL** are **REQUIRED** - the function will fail if these are not set
- **BREVO_SENDER_NAME** is **OPTIONAL** - defaults to "Pitchivo" if not provided
- You do **NOT** need to set these in `config.toml` - that's only for local Supabase configuration
- Secrets are set in the Supabase Dashboard for production, or via environment variables for local development

### Step 2: Deploy the Edge Function

Deploy the `send-email` edge function to production:

```bash
# From the project root
supabase functions deploy send-email
```

Or use the Supabase CLI with your project reference:

```bash
supabase functions deploy send-email --project-ref your-project-ref
```

### Step 3: Verify Sender Email in Brevo

1. Log in to your Brevo account
2. Go to **Settings** → **Senders & IP**
3. Add and verify your sender email address
4. This email will be used as the default sender for transactional emails

### Step 4: Authenticate Email Subdomains (For Promotional Emails)

**IMPORTANT:** The following subdomains are configured for promotional emails and must be authenticated in Brevo:

- **news.pitchivo.com** - For news and announcements
- **updates.pitchivo.com** - For product updates and feature releases
- **info.pitchivo.com** - For informational emails
- **mail.pitchivo.com** - For general marketing emails

To authenticate these subdomains:

1. Log in to your Brevo account
2. Go to **Settings** → **Senders & IP** → **Domain Authentication**
3. For each subdomain:
   - Click **Authenticate a domain**
   - Enter the subdomain (e.g., `news.pitchivo.com`)
   - Follow the DNS configuration instructions
   - Add the required SPF, DKIM, and DMARC records to your DNS
   - Wait for verification (usually takes a few minutes to 24 hours)

**DNS Records Required for Each Subdomain:**

For each subdomain, you'll need to add:
- **SPF Record**: `v=spf1 include:spf.brevo.com ~all`
- **DKIM Records**: Provided by Brevo during domain authentication
- **DMARC Record**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@pitchivo.com`

**Note:** These subdomains are configured in the email system (`/apps/web/lib/emails/config.ts`) and can be used for promotional emails to improve deliverability and sender reputation.

## Local Development

For local development, you can set the API key as an environment variable:

1. Create or update `.env.local` in the project root:
   ```bash
   # Required
   BREVO_API_KEY=YOUR_BREVO_API_KEY_HERE
   BREVO_SENDER_EMAIL=team@pitchivo.com
   
   # Optional (defaults to "Pitchivo Team" if not set)
   BREVO_SENDER_NAME=Pitchivo Team
   ```

2. When running the edge function locally, it will use these environment variables:
   ```bash
   supabase functions serve send-email --env-file .env.local
   ```

### About config.toml

**You do NOT need to set these in `config.toml`**. The `config.toml` file is for local Supabase instance configuration (database, auth, etc.), not for edge function secrets. Edge function secrets are:

- **Production**: Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets
- **Local Development**: Set via `.env.local` file and passed with `--env-file` flag

## Usage

### From Client-Side Code

```typescript
import { sendEmail, sendWelcomeEmail, sendOrganizationSetupEmail } from '@/lib/email'

// Send a custom email
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  htmlContent: '<h1>Hello World</h1>',
  textContent: 'Hello World',
})

// Send a welcome email
await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  companyName: 'Acme Corp',
})

// Send organization setup email
await sendOrganizationSetupEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  companyName: 'Acme Corp',
})
```

### From Server-Side Code (API Routes, Server Actions)

You can call the edge function directly:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Hello!',
    htmlContent: '<h1>Hello World</h1>',
  }),
})
```

## Email Templates

The following email templates are available:

1. **Welcome Email** - Sent to new users after account creation
2. **Organization Setup Email** - Sent after organization setup is completed
3. **Waitlist Confirmation Email** - Sent to users who join the waitlist
4. **Invitation Email** - Sent to waitlist users when they're invited
5. **Admin Notification Email** - Sent to admins when someone joins the waitlist

You can also use Brevo's template system by providing a `templateId` in the email options.

## Spam Prevention Best Practices

**CRITICAL:** All email templates follow spam-prevention best practices to ensure maximum deliverability. When creating new email templates, always prioritize spam prevention.

### 1. Sender Configuration

- **Use `team@` instead of `noreply@`**: `noreply@` addresses are often flagged as spam
- **Use a proper sender name**: "Pitchivo Team" instead of just "Pitchivo"
- **Set up proper reply-to**: Use `support@yourdomain.com` or similar

### 2. Email Authentication (SPF, DKIM, DMARC)

**REQUIRED:** Set up proper email authentication records in your DNS:

1. **SPF Record**: Authorizes Brevo to send emails on your behalf
   ```
   TXT record: v=spf1 include:spf.brevo.com ~all
   ```

2. **DKIM Record**: Adds cryptographic signature to emails
   - Configure in Brevo dashboard: Settings → Senders & IP → Domain Authentication
   - Add the provided DKIM records to your DNS

3. **DMARC Record**: Policy for handling failed authentication
   ```
   TXT record: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
   ```

### 3. Email Content Best Practices

- **Avoid spam trigger words**: "free", "guarantee", "act now", "limited time", etc.
- **Maintain text-to-HTML ratio**: At least 30% text content
- **Limit links**: Maximum 5 links per email
- **Avoid excessive punctuation**: No more than 2 exclamation marks
- **Avoid all caps**: Use proper capitalization
- **Include physical address**: Required by CAN-SPAM Act (included in all templates)

### 4. Subject Line Best Practices

- Keep subject lines under 50 characters
- Avoid spam trigger words
- Be clear and descriptive
- Don't use all caps or excessive punctuation

### 5. HTML Structure

- Use proper HTML structure with DOCTYPE
- Include meta tags (charset, viewport)
- Use inline CSS (better email client compatibility)
- Include both HTML and text versions
- Use table-based layouts for better compatibility

### 6. Testing

Before sending production emails:

1. Test with multiple email providers (Gmail, Outlook, Yahoo, etc.)
2. Use email testing tools (Mail Tester, GlockApps)
3. Check spam score (aim for score < 5)
4. Verify SPF, DKIM, DMARC records are passing

### 7. Monitoring

- Monitor bounce rates (should be < 5%)
- Track spam complaints (should be < 0.1%)
- Monitor delivery rates (should be > 95%)
- Set up alerts for high bounce/spam rates

## Email Structure

All emails follow this structure (located in `/apps/web/lib/emails/`):

```
lib/emails/
├── config.ts              # Email configuration (sender, spam prevention settings)
├── utils.ts               # Spam prevention utilities
├── index.ts               # Main exports and email sending functions
└── templates/
    ├── base.tsx           # Base email template with spam prevention
    ├── client/            # Client-facing emails
    │   ├── welcome.tsx
    │   ├── waitlist-confirmation.tsx
    │   ├── invitation.tsx
    │   └── organization-setup.tsx
    └── admin/             # Admin notification emails
        └── waitlist-notification.tsx
```

When creating new email templates:

1. Use the `BaseEmailTemplate` from `templates/base.tsx`
2. Follow the spam prevention guidelines above
3. Include both HTML and text versions
4. Test with email testing tools before deploying

## Testing

To test the email function locally:

1. Start Supabase locally:
   ```bash
   supabase start
   ```

2. Serve the edge function:
   ```bash
   supabase functions serve send-email --env-file .env.local
   ```

3. Test using curl or your API client:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/send-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "test@example.com",
       "subject": "Test Email",
       "htmlContent": "<h1>Test</h1>"
     }'
   ```

## Troubleshooting

### Error: "BREVO_API_KEY is not set in Supabase secrets"

- Make sure you've added the secret in the Supabase dashboard
- Verify the secret name is exactly `BREVO_API_KEY`
- After adding the secret, redeploy the edge function

### Error: "Brevo API error: 401"

- Verify your API key is correct
- Check that the API key has transactional email permissions in Brevo

### Error: "Brevo API error: 400"

- Verify your sender email is verified in Brevo
- Check that the email format is correct

## Security Notes

- **Never commit API keys to git**
- The API key is stored as a Supabase secret and is only accessible to edge functions
- Use environment variables for local development
- Rotate API keys regularly for security

## Additional Resources

- [Brevo API Documentation](https://developers.brevo.com/)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)

