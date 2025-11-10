# Email System

This directory contains the email system for Pitchivo, structured with spam prevention as the top priority.

## Structure

```
lib/emails/
├── config.ts              # Email configuration and spam prevention settings
├── utils.ts                # Spam prevention utilities and validation
├── index.ts                # Main exports and email sending functions
├── README.md               # This file
└── templates/
    ├── base.tsx            # Base email template with spam prevention best practices
    ├── client/             # Client-facing email templates
    │   ├── welcome.tsx
    │   ├── waitlist-confirmation.tsx
    │   ├── invitation.tsx
    │   └── organization-setup.tsx
    └── admin/              # Admin notification email templates
        └── waitlist-notification.tsx
```

## Spam Prevention First Principle

**CRITICAL:** All email templates prioritize avoiding spam filters. When creating new templates:

1. **Always use the base template** (`templates/base.tsx`) which includes:
   - Proper HTML structure
   - Inline CSS for email client compatibility
   - Text version (required for spam prevention)
   - Physical address footer (CAN-SPAM requirement)
   - Proper meta tags

2. **Follow spam prevention guidelines**:
   - Use `team@` instead of `noreply@` (configured in `config.ts`)
   - Maintain text-to-HTML ratio of at least 30%
   - Limit links to maximum 5 per email
   - Avoid spam trigger words
   - Avoid excessive punctuation
   - Use proper capitalization (no all caps)

3. **Validate before sending**:
   - Use `validateEmailContent()` from `utils.ts`
   - Check spam score with email testing tools
   - Test with multiple email providers

## Usage

### Sending Client Emails

```typescript
import { 
  sendWelcomeEmail,
  sendWaitlistConfirmationEmail,
  sendInvitationEmail,
  sendOrganizationSetupEmail
} from '@/lib/emails'

// Send welcome email
await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  companyName: 'Acme Corp',
})

// Send waitlist confirmation
await sendWaitlistConfirmationEmail({
  to: 'user@example.com',
  fullName: 'John Doe',
  company: 'Acme Corp',
})
```

### Sending Admin Emails

```typescript
import { sendWaitlistAdminNotification } from '@/lib/emails'

// Send admin notification
await sendWaitlistAdminNotification({
  adminEmails: ['admin1@example.com', 'admin2@example.com'],
  waitlistEntry: {
    email: 'user@example.com',
    fullName: 'John Doe',
    company: 'Acme Corp',
    role: 'CEO',
    note: 'Interested in enterprise plan',
  },
})
```

### Creating New Email Templates

1. Create a new template file in `templates/client/` or `templates/admin/`
2. Use `BaseEmailTemplate` from `templates/base.tsx`
3. Export a function that returns `{ html, text, subject }`
4. Add the sending function to `index.ts`

Example:

```typescript
// templates/client/my-email.tsx
import { BaseEmailTemplate } from '../base'

export interface MyEmailData {
  userName: string
}

export function createMyEmail(data: MyEmailData): { html: string; text: string; subject: string } {
  const { html, text } = BaseEmailTemplate({
    title: 'My Email Title',
    preheader: 'Email preview text',
    children: `
      <p>Hello ${data.userName},</p>
      <p>Your email content here.</p>
    `.trim(),
  })

  return {
    html,
    text,
    subject: 'My Email Subject',
  }
}
```

Then add to `index.ts`:

```typescript
export { createMyEmail } from './templates/client/my-email'

export async function sendMyEmail(data: {
  to: string
  userName: string
}): Promise<SendEmailResponse> {
  const template = createMyEmail({ userName: data.userName })
  return sendEmailWithDefaults({
    to: data.to,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
  })
}
```

## Configuration

Email configuration is in `config.ts`:

- **Sender email**: Defaults to `team@pitchivo.com` (NOT `noreply@`)
- **Sender name**: Defaults to "Pitchivo Team"
- **Reply-to**: Defaults to `support@pitchivo.com`
- **Physical address**: Required by CAN-SPAM Act (update with your actual address)
- **Email subdomains**: Configured for promotional emails:
  - `news.pitchivo.com` - For news and announcements
  - `updates.pitchivo.com` - For product updates and feature releases
  - `info.pitchivo.com` - For informational emails
  - `mail.pitchivo.com` - For general marketing emails

### Using Email Subdomains for Promotional Emails

When sending promotional emails, use different subdomains to improve deliverability and sender reputation:

```typescript
import { getPromotionalSenderEmail } from '@/lib/emails/config'

// For news emails
const newsSender = getPromotionalSenderEmail('news') // Returns: team@news.pitchivo.com

// For updates
const updatesSender = getPromotionalSenderEmail('updates') // Returns: team@updates.pitchivo.com

// For informational emails
const infoSender = getPromotionalSenderEmail('info') // Returns: team@info.pitchivo.com

// For marketing emails
const mailSender = getPromotionalSenderEmail('mail') // Returns: team@mail.pitchivo.com

// Use custom local part
const customSender = getPromotionalSenderEmail('news', 'noreply') // Returns: noreply@news.pitchivo.com
```

**Important:** All subdomains must be authenticated in Brevo before use. See `supabase/BREVO_SETUP.md` for authentication instructions.

## Spam Prevention Utilities

The `utils.ts` file provides utilities for spam prevention:

- `validateEmailContent()`: Validates email content and returns warnings
- `createSafeSubjectLine()`: Creates spam-safe subject lines
- `hasSpamTriggerWords()`: Checks for spam trigger words
- `calculateTextToHtmlRatio()`: Calculates text-to-HTML ratio
- `countLinks()`: Counts links in HTML content
- `sanitizeEmailContent()`: Sanitizes content to avoid spam filters

## Testing

Before deploying new email templates:

1. Test with email testing tools (Mail Tester, GlockApps)
2. Check spam score (aim for < 5)
3. Test with multiple email providers
4. Verify SPF, DKIM, DMARC records are passing

## Email Authentication Setup

**REQUIRED:** Set up SPF, DKIM, and DMARC records in your DNS:

1. **SPF**: `v=spf1 include:spf.brevo.com ~all`
2. **DKIM**: Configure in Brevo dashboard
3. **DMARC**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`

See `supabase/BREVO_SETUP.md` for detailed instructions.

