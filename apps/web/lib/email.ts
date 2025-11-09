// Client-side utility for sending emails via Supabase Edge Function

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in local development
const isLocalDevelopment = () => {
  const url = SUPABASE_URL || ''
  return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('127.0.0.1:54321')
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, any>
  sender?: {
    name?: string
    email: string
  }
  replyTo?: {
    name?: string
    email: string
  }
}

export interface SendEmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a transactional email via Brevo using Supabase Edge Function
 * In local development, emails are sent via Edge Function which can be configured to use Mailpit
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
  // In local development, log email details
  if (isLocalDevelopment()) {
    console.log('📧 Local development mode: Email sending')
    console.log('📧 Email details:', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString(),
    })
    console.log('📧 Full email content:', {
      to: options.to,
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent,
      sender: options.sender,
      replyTo: options.replyTo,
    })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables are not set, skipping email")
    return {
      success: false,
      error: "Supabase environment variables are not set",
    }
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(options),
    })

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type")
    let data: any = {}
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json()
      } catch (parseError) {
        const text = await response.text()
        console.error("Failed to parse JSON response:", text)
        return {
          success: false,
          error: `Invalid response: ${text.substring(0, 100)}`,
        }
      }
    } else {
      const text = await response.text()
      
      // In local development, if Edge Function is not running, provide helpful message
      if (isLocalDevelopment() && (text.includes("Function not found") || response.status === 404)) {
        console.warn("⚠️ Edge Function not running. To start it, run:")
        console.warn("   npm run supabase:functions:serve")
        console.warn("   or")
        console.warn("   supabase functions serve send-email --env-file .env.local")
        console.warn("📧 Email details logged above. In production, this would be sent via Brevo.")
        
        return {
          success: true,
          messageId: `local-${Date.now()}`,
        }
      }
      
      console.error("Non-JSON response:", text)
      return {
        success: false,
        error: `Function not found or not deployed. Response: ${text.substring(0, 100)}`,
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to send email",
      }
    }

    return {
      success: true,
      messageId: data.messageId,
    }
  } catch (error) {
    // In local development, if fetch fails (Edge Function not running), provide helpful message
    if (isLocalDevelopment() && error instanceof TypeError && error.message.includes("fetch")) {
      console.warn("⚠️ Edge Function not accessible. To start it, run:")
      console.warn("   npm run supabase:functions:serve")
      console.warn("   or")
      console.warn("   supabase functions serve send-email --env-file .env.local")
      console.warn("📧 Email details logged above. In production, this would be sent via Brevo.")
      
      return {
        success: true,
        messageId: `local-${Date.now()}`,
      }
    }
    
    console.error("Error sending email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: {
  to: string
  userName: string
  companyName?: string
}): Promise<SendEmailResponse> {
  const { to, userName, companyName } = data
  const companyText = companyName ? ` at ${companyName}` : ""

  return sendEmail({
    to,
    subject: `Welcome to Pitchivo${companyText}!`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Pitchivo!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We're excited to have you${companyText}! Your account has been successfully created and you're all set to start using Pitchivo.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              If you have any questions or need help getting started, feel free to reach out to our support team.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>The Pitchivo Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Welcome to Pitchivo${companyText}!

      Hi ${userName},

      We're excited to have you${companyText}! Your account has been successfully created and you're all set to start using Pitchivo.

      If you have any questions or need help getting started, feel free to reach out to our support team.

      Best regards,
      The Pitchivo Team
    `,
  })
}

/**
 * Send organization setup completion email
 */
export async function sendOrganizationSetupEmail(data: {
  to: string
  userName: string
  companyName: string
}): Promise<SendEmailResponse> {
  const { to, userName, companyName } = data

  return sendEmail({
    to,
    subject: `${companyName} workspace is ready!`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Workspace Ready!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your ${companyName} workspace has been successfully set up and is ready to use.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You can now start inviting team members and managing your organization. All users with the same email domain will automatically join your workspace.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>The Pitchivo Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      Workspace Ready!

      Hi ${userName},

      Great news! Your ${companyName} workspace has been successfully set up and is ready to use.

      You can now start inviting team members and managing your organization. All users with the same email domain will automatically join your workspace.

      Best regards,
      The Pitchivo Team
    `,
  })
}

/**
 * Send waitlist confirmation email
 */
export async function sendWaitlistConfirmationEmail(data: {
  to: string
  fullName: string
  company: string
}): Promise<SendEmailResponse> {
  const { to, fullName, company } = data

  return sendEmail({
    to,
    subject: "You're on the Pitchivo waitlist!",
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're on the list!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${fullName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for joining the Pitchivo waitlist! We've received your request for ${company} and will notify you as soon as your account is approved.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We're excited to have you on board and will be in touch soon.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>The Pitchivo Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      You're on the list!

      Hi ${fullName},

      Thank you for joining the Pitchivo waitlist! We've received your request for ${company} and will notify you as soon as your account is approved.

      We're excited to have you on board and will be in touch soon.

      Best regards,
      The Pitchivo Team
    `,
  })
}

/**
 * Send invitation email to waitlist user
 */
export async function sendInvitationEmail(data: {
  to: string
  fullName: string
  company: string
  inviteLink?: string
}): Promise<SendEmailResponse> {
  const { to, fullName, company, inviteLink } = data
  const signupUrl = inviteLink || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'}/auth/signup`

  console.log('📧 Sending invitation email:', {
    to,
    fullName,
    company,
    signupUrl,
    timestamp: new Date().toISOString(),
  })

  const result = await sendEmail({
    to,
    subject: `You're invited to join Pitchivo!`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${fullName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your request for ${company} has been approved. You're now invited to join Pitchivo!
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Click the button below to create your account and get started:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Create Account</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${signupUrl}" style="color: #667eea; word-break: break-all;">${signupUrl}</a>
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #666; margin: 0;">Best regards,<br>The Pitchivo Team</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textContent: `
      You're Invited!

      Hi ${fullName},

      Great news! Your request for ${company} has been approved. You're now invited to join Pitchivo!

      Click the link below to create your account and get started:
      ${signupUrl}

      Best regards,
      The Pitchivo Team
    `,
  })

  if (result.success) {
    console.log('✅ Invitation email sent successfully:', {
      to,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error('❌ Failed to send invitation email:', {
      to,
      error: result.error,
      timestamp: new Date().toISOString(),
    })
  }

  return result
}

