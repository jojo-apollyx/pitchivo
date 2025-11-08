// Supabase Edge Function to send transactional emails via Brevo
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
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

interface BrevoEmailPayload {
  sender: {
    name?: string
    email: string
  }
  to: Array<{ email: string; name?: string }>
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, any>
  replyTo?: {
    name?: string
    email: string
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get Brevo configuration from environment
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL")
    const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME") || "Pitchivo"

    // Validate required environment variables
    if (!brevoApiKey || !brevoSenderEmail) {
      console.error("Missing Brevo configuration:", {
        hasApiKey: !!brevoApiKey,
        hasSenderEmail: !!brevoSenderEmail,
      })
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Parse request body
    const emailData: EmailRequest = await req.json()

    // Validate required fields
    if (!emailData.to || !emailData.subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: 'to' and 'subject' are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Normalize 'to' field to array
    const toEmails = Array.isArray(emailData.to) ? emailData.to : [emailData.to]

    // Build Brevo email payload
    const brevoPayload: BrevoEmailPayload = {
      sender: {
        email: emailData.sender?.email || brevoSenderEmail,
        name: emailData.sender?.name || brevoSenderName,
      },
      to: toEmails.map((email) => {
        // Handle both string emails and {email, name} objects
        if (typeof email === "string") {
          return { email }
        }
        return { email: email.email, name: email.name }
      }),
      subject: emailData.subject,
      htmlContent: emailData.htmlContent,
      textContent: emailData.textContent,
    }

    // Add template ID if provided
    if (emailData.templateId) {
      brevoPayload.templateId = emailData.templateId
      if (emailData.params) {
        brevoPayload.params = emailData.params
      }
    }

    // Add reply-to if provided
    if (emailData.replyTo) {
      brevoPayload.replyTo = {
        email: emailData.replyTo.email,
        name: emailData.replyTo.name,
      }
    }

    // Send email via Brevo API
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    })

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text()
      console.error("Brevo API error:", {
        status: brevoResponse.status,
        statusText: brevoResponse.statusText,
        error: errorText,
      })
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: errorText,
          status: brevoResponse.status,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const brevoResult = await brevoResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        messageId: brevoResult.messageId,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("Error sending email:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

