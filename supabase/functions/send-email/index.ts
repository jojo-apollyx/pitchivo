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
    // Check if we're in local development (use Mailpit/Inbucket)
    // In Supabase Edge Functions running locally, the SUPABASE_URL is set to internal URLs
    // like "http://kong:8000", so we need to check for the absence of production indicators
    // or check for local development environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const requestUrl = req.url || ""
    
    // Get Brevo configuration from environment first (needed for detection)
    // Note: In local dev, these may not be set, which is fine - we'll just log the email
    const brevoApiKey = Deno.env.get("BREVO_API_KEY")
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL") || "noreply@pitchivo.com"
    const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME") || "Pitchivo"
    
    // Check if we're in local development:
    // 1. If SUPABASE_URL contains internal Docker service names (kong, supabase_edge_runtime)
    // 2. If request URL contains internal service names
    // 3. If BREVO_API_KEY is not set (local dev typically doesn't have it)
    // 4. If SUPABASE_URL is empty or contains localhost/127.0.0.1
    const hasInternalUrl = supabaseUrl.includes("kong") || 
                          supabaseUrl.includes("supabase_edge_runtime") ||
                          requestUrl.includes("supabase_edge_runtime") ||
                          requestUrl.includes("kong")
    const hasLocalhost = supabaseUrl.includes("localhost") || 
                        supabaseUrl.includes("127.0.0.1") ||
                        requestUrl.includes("localhost") ||
                        requestUrl.includes("127.0.0.1") ||
                        requestUrl.includes("54321")
    
    // If we have internal URLs (Docker services) and no Brevo API key, assume local dev
    const isLocalDev = hasInternalUrl || hasLocalhost || (!brevoApiKey && supabaseUrl !== "")
    
    // Log environment detection for debugging
    console.log("🔍 Environment detection:", {
      isLocalDev,
      supabaseUrl,
      requestUrl: requestUrl.substring(0, 100), // Truncate for logging
      hasBrevoApiKey: !!brevoApiKey,
      hasBrevoSenderEmail: !!brevoSenderEmail,
      hasInternalUrl,
      hasLocalhost,
    })

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

    // In local development, send email via SMTP to Mailpit
    if (isLocalDev) {
      console.log("📧 Local development mode detected - sending to Mailpit via SMTP")
      console.log("📧 Email details:", {
        to: toEmails,
        subject: emailData.subject,
        from: emailData.sender?.email || brevoSenderEmail,
      })

      try {
        // Send email via SMTP to Mailpit (Inbucket)
        // In Docker, we need to use the correct service/container name
        // Important: Inside Docker network, use port 1025 (not 54325)
        // Port 54325 is only for external access from the host
        const mailpitPort = 1025 // SMTP port inside Docker container
        
        const fromEmail = emailData.sender?.email || brevoSenderEmail
        const fromName = emailData.sender?.name || brevoSenderName
        const subject = emailData.subject
        const htmlContent = emailData.htmlContent || emailData.textContent || ""
        const textContent = emailData.textContent || emailData.htmlContent?.replace(/<[^>]*>/g, "") || ""
        
        // Build email message in RFC 2822 format
        const messageId = `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@pitchivo.local>`
        const date = new Date().toUTCString()
        
        // Build email headers and body
        let emailMessage = `From: ${fromName ? `"${fromName}" ` : ""}<${fromEmail}>\r\n`
        emailMessage += `To: ${toEmails.map(e => typeof e === "string" ? e : e.email).join(", ")}\r\n`
        emailMessage += `Subject: ${subject}\r\n`
        emailMessage += `Date: ${date}\r\n`
        emailMessage += `Message-ID: ${messageId}\r\n`
        emailMessage += `MIME-Version: 1.0\r\n`
        
        if (htmlContent && textContent) {
          // Multipart email with both HTML and text
          const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          emailMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`
          emailMessage += `\r\n`
          emailMessage += `--${boundary}\r\n`
          emailMessage += `Content-Type: text/plain; charset=UTF-8\r\n`
          emailMessage += `Content-Transfer-Encoding: 7bit\r\n`
          emailMessage += `\r\n`
          emailMessage += `${textContent}\r\n`
          emailMessage += `--${boundary}\r\n`
          emailMessage += `Content-Type: text/html; charset=UTF-8\r\n`
          emailMessage += `Content-Transfer-Encoding: 7bit\r\n`
          emailMessage += `\r\n`
          emailMessage += `${htmlContent}\r\n`
          emailMessage += `--${boundary}--\r\n`
        } else if (htmlContent) {
          emailMessage += `Content-Type: text/html; charset=UTF-8\r\n`
          emailMessage += `Content-Transfer-Encoding: 7bit\r\n`
          emailMessage += `\r\n`
          emailMessage += `${htmlContent}\r\n`
        } else {
          emailMessage += `Content-Type: text/plain; charset=UTF-8\r\n`
          emailMessage += `Content-Transfer-Encoding: 7bit\r\n`
          emailMessage += `\r\n`
          emailMessage += `${textContent}\r\n`
        }
        
        // Connect to Mailpit SMTP server
        // Try different possible service names in Docker network
        // Container name is: supabase_inbucket_pitchivo
        // Service name might be: inbucket or supabase_inbucket_pitchivo
        let conn: Deno.Conn | null = null
        const possibleHosts = [
          "supabase_inbucket_pitchivo", // Container name
          "inbucket", // Possible service name
          "127.0.0.1", // Fallback
        ]
        
        for (const host of possibleHosts) {
          try {
            console.log(`📧 Attempting to connect to Mailpit SMTP at ${host}:${mailpitPort}`)
            conn = await Deno.connect({ hostname: host, port: mailpitPort })
            console.log(`✅ Connected to Mailpit SMTP at ${host}:${mailpitPort}`)
            break
          } catch (err) {
            console.warn(`⚠️ Failed to connect to ${host}:${mailpitPort}:`, err)
            if (host === possibleHosts[possibleHosts.length - 1]) {
              throw err // If all fail, throw the error
            }
          }
        }
        
        if (!conn) {
          throw new Error("Failed to connect to Mailpit SMTP server")
        }
        
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const buffer = new Uint8Array(1024)
        
        // Read SMTP greeting
        const greetingBytes = await conn.read(buffer)
        if (greetingBytes === null) {
          throw new Error("Failed to read SMTP greeting")
        }
        const greeting = decoder.decode(buffer.slice(0, greetingBytes)).trim()
        console.log("📧 SMTP greeting:", greeting)
        
        // Send EHLO
        await conn.write(encoder.encode(`EHLO localhost\r\n`))
        const ehloBytes = await conn.read(buffer)
        if (ehloBytes === null) {
          throw new Error("Failed to read EHLO response")
        }
        console.log("📧 EHLO response received")
        
        // Send MAIL FROM
        await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`))
        const mailFromBytes = await conn.read(buffer)
        if (mailFromBytes === null) {
          throw new Error("Failed to read MAIL FROM response")
        }
        console.log("📧 MAIL FROM response received")
        
        // Send RCPT TO for each recipient
        for (const toEmail of toEmails) {
          const email = typeof toEmail === "string" ? toEmail : toEmail.email
          await conn.write(encoder.encode(`RCPT TO:<${email}>\r\n`))
          const rcptBytes = await conn.read(buffer)
          if (rcptBytes === null) {
            throw new Error(`Failed to read RCPT TO response for ${email}`)
          }
          console.log(`📧 RCPT TO ${email} response received`)
        }
        
        // Send DATA
        await conn.write(encoder.encode(`DATA\r\n`))
        const dataBytes = await conn.read(buffer)
        if (dataBytes === null) {
          throw new Error("Failed to read DATA response")
        }
        console.log("📧 DATA response received")
        
        // Send email message
        await conn.write(encoder.encode(emailMessage))
        await conn.write(encoder.encode(`\r\n.\r\n`))
        const messageBytes = await conn.read(buffer)
        if (messageBytes === null) {
          throw new Error("Failed to read message response")
        }
        console.log("📧 Message response received")
        
        // Send QUIT
        await conn.write(encoder.encode(`QUIT\r\n`))
        await conn.read(buffer)
        
        conn.close()
        
        console.log("✅ Email sent to Mailpit successfully via SMTP:", {
          messageId,
          to: toEmails,
          subject: emailData.subject,
          timestamp: new Date().toISOString(),
          mailpitUrl: "http://localhost:54324",
        })

        return new Response(
          JSON.stringify({
            success: true,
            messageId,
            message: "Email sent to Mailpit successfully",
            localDev: true,
            mailpitUrl: "http://localhost:54324",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      } catch (smtpError) {
        console.error("❌ Failed to send email via SMTP to Mailpit:", smtpError)
        console.log("📧 Falling back to logging email details...")
        
        // Fallback: Log email details
        const emailDetails = {
          from: emailData.sender?.email || brevoSenderEmail,
          fromName: emailData.sender?.name || brevoSenderName,
          to: toEmails,
          subject: emailData.subject,
          htmlContent: emailData.htmlContent,
          textContent: emailData.textContent,
          timestamp: new Date().toISOString(),
        }
        
        console.log("📧 Email details (SMTP failed, logged instead):")
        console.log(JSON.stringify(emailDetails, null, 2))
        
        const messageId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        return new Response(
          JSON.stringify({
            success: true,
            messageId,
            message: "Email logged (SMTP to Mailpit failed, check console for details)",
            localDev: true,
            error: smtpError instanceof Error ? smtpError.message : String(smtpError),
            note: "Check browser console for full email content. Make sure Mailpit SMTP is running on port 54325.",
            mailpitUrl: "http://localhost:54324",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
    }

    // Production: Use Brevo API
    // Validate required environment variables
    if (!brevoApiKey || !brevoSenderEmail) {
      console.error("Missing Brevo configuration:", {
        hasApiKey: !!brevoApiKey,
        hasSenderEmail: !!brevoSenderEmail,
        isLocalDev,
        supabaseUrl,
        requestUrl: req.url,
      })
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

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

