// Shared email templates for transactional emails

export interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

/**
 * Welcome email template for new users
 */
export function getWelcomeEmailTemplate(data: {
  userName: string
  companyName?: string
}): EmailTemplate {
  const { userName, companyName } = data
  const companyText = companyName ? ` at ${companyName}` : ""

  return {
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
  }
}

/**
 * Organization setup completion email
 */
export function getOrganizationSetupEmailTemplate(data: {
  userName: string
  companyName: string
}): EmailTemplate {
  const { userName, companyName } = data

  return {
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
  }
}

/**
 * Waitlist confirmation email
 */
export function getWaitlistConfirmationEmailTemplate(data: {
  fullName: string
  company: string
}): EmailTemplate {
  const { fullName, company } = data

  return {
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
  }
}

