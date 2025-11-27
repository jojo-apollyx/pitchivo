"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Database,
  Link as LinkIcon,
  Send,
  Shield,
  Sparkles,
  Zap,
  FileText,
  Users,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { sendWaitlistConfirmationEmail, sendWaitlistAdminNotification } from "@/lib/emails";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PRICING_TIERS, formatPrice, formatQuota } from "@/lib/constants/pricing";
import { ScrollAnimation } from "@/components/ui/scroll-animation";
import { BorderBeam } from "@/components/ui/border-beam";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { SpotlightCard } from "@/components/ui/spotlight-card";

import { Marquee } from "@/components/ui/marquee";
import { HeroEmailForm } from "@/components/hero-email-form";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Check email domain status in database
// Returns: 'public' | 'blocked' | null
async function checkEmailDomainStatus(email: string): Promise<'public' | 'blocked' | null> {
  try {
    if (typeof globalThis.window === 'undefined') {
      return null;
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return null;

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    
    const client = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await client
      .from('email_domain_policy')
      .select('status, is_public_domain')
      .eq('domain', domain)
      .eq('status', 'blocked')
      .maybeSingle()

    if (error) {
      console.error('Error checking email domain status:', error);
      return null;
    }

    if (data === null) {
      return null;
    }

    // Check if it's a public domain first
    if (data.is_public_domain === true) {
      return 'public';
    }

    // Otherwise it's a blocked domain (not public)
    if (data.status === 'blocked') {
      return 'blocked';
    }

    return null;
  } catch (error) {
    console.error('Error checking email domain status:', error);
    return null;
  }
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if email domain is whitelisted
async function isInvitedEmail(email: string): Promise<boolean> {
  try {
    if (typeof globalThis.window === 'undefined') {
      return false;
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables are not set');
      return false;
    }
    
    const client = createClient(supabaseUrl, supabaseKey)

    // Check if user can login (domain is whitelisted and not blocked)
    const { data, error } = await client.rpc('can_user_login', {
      email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in isInvitedEmail:', error);
    return false;
  }
}

// Send magic link
async function sendMagicLink(email: string) {
  try {
    if (typeof globalThis.window === 'undefined') {
      throw new Error('This function must be called on the client side')
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not set')
    }
    
    const client = createClient(supabaseUrl, supabaseKey)

    // Use the auth redirect URL constant
    const { getAuthRedirectUrl } = await import('@/lib/constants/auth')
    const redirectUrl = getAuthRedirectUrl()
    
    console.log('[Magic Link Request]', {
      timestamp: new Date().toISOString(),
      email: email.toLowerCase().trim(),
      redirect_url: redirectUrl,
      origin: globalThis.window.location.origin,
      user_agent: navigator.userAgent,
      referrer: document.referrer || 'none',
      supabase_url: supabaseUrl ? '✓ Set' : '✗ Missing',
      supabase_key: supabaseKey ? '✓ Set' : '✗ Missing'
    });
    
    const requestStart = Date.now()
    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    const requestDuration = Date.now() - requestStart

    if (error) {
      console.error('[Magic Link Request] ❌ FAILED', {
        timestamp: new Date().toISOString(),
        duration_ms: requestDuration,
        email: email.toLowerCase().trim(),
        redirect_url: redirectUrl,
        error: {
          message: error.message,
          status: error.status,
          name: error.name
        },
        user_agent: navigator.userAgent,
        origin: globalThis.window.location.origin
      });
      throw error;
    }

    console.log('[Magic Link Request] ✅ SUCCESS', {
      timestamp: new Date().toISOString(),
      duration_ms: requestDuration,
      email: email.toLowerCase().trim(),
      redirect_url: redirectUrl,
      message: 'Magic link email sent successfully',
      has_response_data: !!data,
      has_user: !!(data && data.user),
      has_session: !!(data && data.session)
    });

    toast.success("Magic link sent!", {
      description: "Check your email for the sign-in link.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Please try again later.";
    toast.error("Failed to send magic link", {
      description: message,
    });
  }
}

// Waitlist form schema
const waitlistSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  fullName: z.string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  company: z.string()
    .min(1, "Company is required")
    .min(2, "Company name must be at least 2 characters"),
  role: z.string().optional(),
  note: z.string().optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

// Add to waitlist
async function addToWaitlist(data: {
  email: string;
  fullName: string;
  company: string;
  role?: string;
  note?: string;
}) {
  try {
    if (typeof globalThis.window === 'undefined') {
      throw new Error('This function must be called on the client side')
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not set')
    }
    
    const client = createClient(supabaseUrl, supabaseKey)

    const { error } = await client.from("waitlist").insert({
      email: data.email,
      full_name: data.fullName,
      company: data.company,
      role: data.role || null,
      note: data.note || null,
    });

    if (error) throw error;

    // Send waitlist confirmation email (non-blocking)
    sendWaitlistConfirmationEmail({
      to: data.email,
      fullName: data.fullName,
      company: data.company,
    }).catch((error) => {
      console.error("Failed to send waitlist confirmation email:", error);
      // Don't show error to user, email sending is not critical
    });

    // Send notification email to all admin users (non-blocking)
    fetch('/api/admin/emails')
      .then((res) => res.json())
      .then((result) => {
        if (result.emails && result.emails.length > 0) {
          return sendWaitlistAdminNotification({
            adminEmails: result.emails,
            waitlistEntry: {
              email: data.email,
              fullName: data.fullName,
              company: data.company,
              role: data.role,
              note: data.note,
            },
          });
        }
      })
      .catch((error) => {
        console.error("Failed to send admin notification email:", error);
        // Don't show error to user, email sending is not critical
      });

    toast.success("Thank you! You're on the list", {
      description: "We'll notify you once your account is approved.",
    });
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Please try again later.";
    toast.error("Failed to join waitlist", {
      description: message,
    });
    return false;
  }
}

export default function Home() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const pricingRef = useRef<HTMLElement>(null);

  // Waitlist form
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
      fullName: "",
      company: "",
      role: "",
      note: "",
    },
  });

  // Handle auth callback on landing page (in case redirect didn't work)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Handle tokens in hash fragment (from Supabase direct redirect)
    if (window.location.hash.includes('access_token')) {
      const hash = window.location.hash
      window.location.replace('/auth/callback' + hash)
      return
    }

    // Handle verification tokens in query params (from Supabase /auth/v1/verify redirect)
    // Format: ?token=xxx&type=magiclink&redirect_to=xxx
    const queryParams = new URLSearchParams(window.location.search)
    const verificationToken = queryParams.get('token')
    const verificationType = queryParams.get('type')
    
    if (verificationToken) {
      console.log('[Root Page] Verification token detected, redirecting to verify endpoint', {
        has_token: !!verificationToken,
        token_type: verificationType,
        token_length: verificationToken.length,
        redirect_to: queryParams.get('redirect_to')
      })
      
      // Redirect to our verification API endpoint which will handle the token exchange
      const verifyUrl = new URL('/api/auth/verify', window.location.origin)
      verifyUrl.searchParams.set('token', verificationToken)
      if (verificationType) verifyUrl.searchParams.set('type', verificationType)
      if (queryParams.get('redirect_to')) {
        verifyUrl.searchParams.set('redirect_to', queryParams.get('redirect_to')!)
      }
      
      window.location.href = verifyUrl.toString()
      return
    }

    // Handle error parameters in query params
    const errorParam = queryParams.get('error')
    const errorMessage = queryParams.get('message')
    
    if (errorParam) {
      console.log('[Root Page] Error parameter detected', {
        error: errorParam,
        message: errorMessage
      })
      
      // Show error toast
      setTimeout(() => {
        const message = errorMessage 
          ? decodeURIComponent(errorMessage) 
          : 'The login link is invalid or has expired.'
        
        toast.error('Authentication Error', {
          description: message,
          duration: 5000,
        })
        
        // Clear error from URL
        window.history.replaceState(null, '', '/')
      }, 100)
    }
  }, [])

  // Handle auth errors (like banned users)
  useEffect(() => {
    
    if (typeof window !== 'undefined' && window.location.hash) {
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const error = hashParams.get('error')
      const error_code = hashParams.get('error_code')
      const error_description = hashParams.get('error_description')
      
      
      if (error) {
        
        // Add a small delay to ensure toast system is ready
        setTimeout(() => {
          if (error_code === 'user_banned') {
            toast.error('Account Suspended', {
              description: 'Your account has been suspended. Please contact support for assistance.',
              duration: 6000,
            })
          } else if (error === 'access_denied') {
            toast.error('Access Denied', {
              description: error_description ? decodeURIComponent(error_description) : 'Unable to sign in. Please try again.',
              duration: 5000,
            })
          }
          
          // Clear the error from URL
          window.history.replaceState(null, '', '/')
        }, 100)
      } else {
        console.log('✅ No auth errors found')
      }
    } else {
      console.log('⚠️ No hash in URL')
    }
  }, [])

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenWaitlist = (email: string) => {
    setWaitlistEmail(email);
    reset({ email, fullName: "", company: "", role: "", note: "" });
    setWaitlistOpen(true);
  };

  const handleWaitlistSubmit = async (data: WaitlistFormData) => {
    try {
      // Check email domain status in database
      const domainStatus = await checkEmailDomainStatus(data.email);
      
      if (domainStatus === 'public') {
        toast.error("Company Email Required", {
          description: "Please use your company email address. Public email domains (Gmail, Yahoo, etc.) are not accepted.",
        });
        return;
      }

      if (domainStatus === 'blocked') {
        toast.error("Domain Blocked", {
          description: "This email domain has been blocked and cannot be used to join the waitlist.",
        });
        return;
      }
    } catch (error) {
      console.error('Error checking email domain:', error);
      // Continue with submission if check fails
    }

    const success = await addToWaitlist({
      email: data.email,
      fullName: data.fullName,
      company: data.company,
      role: data.role || undefined,
      note: data.note || undefined,
    });

    if (success) {
      setWaitlistOpen(false);
      reset();
      setWaitlistEmail("");
    }
  };

  return (
    <>
      <div className="min-h-screen relative bg-background">
        {/* Subtle ambient background - very minimal */}
        <div className="bg-aurora" aria-hidden="true" />

      {/* Navbar - Blends into body, minimal border */}
      <nav id="main-navigation" className="sticky top-0 z-50 bg-background/98 backdrop-blur-sm border-b border-border/30">
        <div className="container mx-auto px-6 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-dark transition-all duration-200 hover:bg-primary-darker">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-foreground tracking-tight">Pitchivo</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                id="nav-pricing-button"
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex hover:bg-background-secondary font-medium rounded-md px-4"
                onClick={scrollToPricing}
              >
                Pricing
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative" aria-labelledby="hero-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left Column - Hero Content */}
            <ScrollAnimation container className="space-y-8">
              {/* Badge - Minimal */}
              <ScrollAnimation>
                <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md">
                  AI-Powered B2B Outreach Platform
                </span>
              </ScrollAnimation>
              
              {/* Headline - ONLY h1 on page */}
              <ScrollAnimation>
                <h1 id="hero-main-heading" className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
                  <span className="text-foreground block">
                    <VerticalCutReveal splitBy="characters" staggerDuration={0.03} transition={{ delay: 0 }}>
                      AI-Powered Outreach
                    </VerticalCutReveal>
                  </span>
                  <span className="block mt-3 text-primary-dark">
                    <VerticalCutReveal splitBy="characters" staggerDuration={0.03} transition={{ delay: 0.5 }}>
                      That Actually Converts
                    </VerticalCutReveal>
                  </span>
                </h1>
              </ScrollAnimation>

              {/* Description */}
              <ScrollAnimation>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Transform product specifications into stunning pages. Launch targeted campaigns to buyers with real purchase intent. Track engagement. Close deals faster.
                </p>
              </ScrollAnimation>

              {/* CTA Form */}
              <ScrollAnimation>
                <HeroEmailForm onOpenWaitlist={handleOpenWaitlist} />
              </ScrollAnimation>

              {/* Social Proof - Simplified */}
              <ScrollAnimation>
                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span>Free trial available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Right Column - UI Showcase - Clean & Minimal */}
            <ScrollAnimation animateIn delay={0.2} className="relative mt-8 lg:mt-0 hidden lg:block">
              {/* Background Card - Campaign Analytics Dashboard */}
              <div className="absolute -top-4 right-4 w-full max-w-md bg-background border border-border/50 rounded-lg shadow-soft transform rotate-1 overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">Campaign Analytics</h3>
                    <BarChart3 className="w-4 h-4 text-primary-dark" />
                  </div>
                  
                  {/* Metrics Grid - Flat, no gradients */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-md bg-background-secondary">
                      <div className="text-xl font-semibold text-foreground">247</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div className="p-3 rounded-md bg-background-secondary">
                      <div className="text-xl font-semibold text-semantic-success">68%</div>
                      <div className="text-xs text-muted-foreground">Opened</div>
                    </div>
                    <div className="p-3 rounded-md bg-background-secondary">
                      <div className="text-xl font-semibold text-primary-dark">23</div>
                      <div className="text-xs text-muted-foreground">RFQs</div>
                    </div>
                  </div>

                  {/* Mini Line Chart - Simplified */}
                  <div className="p-4 rounded-md bg-background-secondary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground">Open Rate Trend</span>
                      <span className="text-xs text-semantic-success font-medium">↑ 12%</span>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {[40, 52, 48, 65, 58, 68, 72, 68].map((height, i) => (
                        <div key={i} className="flex-1 bg-primary-dark rounded-sm" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground Card - Product Page Preview */}
              <div className="relative z-10 bg-background border border-border/50 rounded-lg shadow-premium overflow-hidden max-w-md">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-background-secondary/50">
                  <div className="w-2.5 h-2.5 bg-dot-red rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-dot-yellow rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-dot-green rounded-full"></div>
                  <span className="ml-2 text-xs text-muted-foreground">pitchivo.com/products/curcumin-95</span>
                </div>
                
                {/* Product Content */}
                <div className="p-5 space-y-4">
                  {/* Product Header */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">Organic Curcumin Extract 95%</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">High-purity turmeric extract</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-accent-surface text-primary-dark rounded-md font-medium">
                        In Stock
                      </span>
                    </div>
                  </div>

                  {/* Price & Lead Time - Flat */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-md bg-accent-surface">
                      <div className="text-xs text-muted-foreground mb-0.5">Price (MOQ 100kg)</div>
                      <div className="text-lg font-semibold text-primary-dark">$85/kg</div>
                    </div>
                    <div className="p-3 rounded-md bg-background-secondary">
                      <div className="text-xs text-muted-foreground mb-0.5">Lead Time</div>
                      <div className="text-lg font-semibold text-foreground">15-20 days</div>
                    </div>
                  </div>

                  {/* Specifications - Minimal */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground">Specifications</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between py-2 px-3 bg-background-secondary rounded-md">
                        <span className="text-muted-foreground">Purity:</span>
                        <span className="font-medium text-foreground">95%</span>
                      </div>
                      <div className="flex justify-between py-2 px-3 bg-background-secondary rounded-md">
                        <span className="text-muted-foreground">MOQ:</span>
                        <span className="font-medium text-foreground">100kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications - Clean tags */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-foreground">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-semantic-success-soft text-semantic-success rounded-md">
                        <Shield className="w-3 h-3 mr-1" />
                        USDA Organic
                      </span>
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-semantic-info-soft text-semantic-info rounded-md">
                        <Shield className="w-3 h-3 mr-1" />
                        ISO 22000
                      </span>
                      <span className="text-xs px-2 py-1 bg-semantic-purple-soft text-semantic-purple rounded-md">
                        Kosher
                      </span>
                    </div>
                  </div>

                  {/* CTA Buttons - Clean */}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 bg-primary-dark text-white text-xs font-medium py-3 rounded-md hover:bg-primary-darker transition-colors flex items-center justify-center gap-2">
                      <Send className="w-3.5 h-3.5" />
                      Request Quote
                    </button>
                    <button className="px-4 bg-background-secondary text-foreground text-xs font-medium rounded-md hover:bg-muted transition-colors">
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-20 sm:py-24 lg:py-28 bg-background-secondary" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              How It Works
            </span>
            <ScrollAnimation>
              <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                  Simple Process, Powerful Results
                </VerticalCutReveal>
              </h2>
            </ScrollAnimation>
            <p className="text-lg text-muted-foreground">
              From upload to buyer engagement — all in five easy steps
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Upload Product Files",
                description: "Upload PDFs or spec sheets. Our AI extracts key specifications, features, and certifications to generate SEO-optimized product pages.",
              },
              {
                step: "02",
                icon: Database,
                title: "Connect to Buyers",
                description: "Choose from pre-curated industry-specific buyer databases. AI automatically matches your products with verified potential buyers.",
              },
              {
                step: "03",
                icon: Send,
                title: "Launch Campaigns",
                description: "Send personalized cold emails to selected buyers. Control the number and schedule across days or weeks — no spam, no hassle.",
              },
              {
                step: "04",
                icon: BarChart3,
                title: "Track Interactions",
                description: "View precise analytics: opens, clicks, viewed fields, QR-code tracking, and RFQ submissions. Optimize with real data.",
              },
              {
                step: "05",
                icon: CheckCircle2,
                title: "Receive RFQs",
                description: "Get instant notifications when buyers fill out your RFQ form. No manual follow-up needed.",
              },
            ].map((step, index) => (
              <ScrollAnimation
                key={index}
                className="relative group"
              >
                <div className="h-full p-8 bg-background rounded-lg hover:bg-background transition-colors duration-200">
                  <div className="flex items-start gap-4 mb-5">
                    <span className="text-4xl font-semibold text-border select-none">
                      {step.step}
                    </span>
                    <div className="inline-flex p-3 bg-primary-dark rounded-md">
                      <step.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Managed Email Campaign Service Section */}
      <section id="managed-campaigns-section" className="py-20 sm:py-24 lg:py-28 bg-background" aria-labelledby="managed-campaigns-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Managed Campaign Service
            </span>
            <ScrollAnimation>
              <h2 id="managed-campaigns-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                  Professional Email Outreach, Done For You
                </VerticalCutReveal>
              </h2>
            </ScrollAnimation>
            <p className="text-lg text-muted-foreground">
              Our team handles the heavy lifting so you can focus on closing deals
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Automated Email Warmup */}
            <ScrollAnimation>
              <div className="h-full p-8 bg-background-secondary rounded-lg hover:bg-muted transition-colors duration-200 group">
                <div className="mb-6">
                  <div className="inline-flex p-3 bg-semantic-success-soft rounded-md">
                    <Zap className="w-6 h-6 text-semantic-success" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Automated Email Warmup
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We automatically warm up your email domain to ensure maximum deliverability. No spam folders, no blacklists — just professional outreach that reaches inboxes.
                </p>
              </div>
            </ScrollAnimation>

            {/* Professional Copywriting */}
            <ScrollAnimation>
              <div className="h-full p-8 bg-background-secondary rounded-lg hover:bg-muted transition-colors duration-200 group">
                <div className="mb-6">
                  <div className="inline-flex p-3 bg-semantic-purple-soft rounded-md">
                    <FileText className="w-6 h-6 text-semantic-purple" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Curated Professional Copy
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our expert writers craft compelling, personalized outreach messages that resonate with B2B buyers. Every email is optimized for engagement and conversions.
                </p>
              </div>
            </ScrollAnimation>

            {/* Strategic Follow-ups */}
            <ScrollAnimation>
              <div className="h-full p-8 bg-background-secondary rounded-lg hover:bg-muted transition-colors duration-200 group">
                <div className="mb-6">
                  <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                    <Send className="w-6 h-6 text-semantic-info" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Smart Follow-Up Sequences
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Professionally timed follow-up emails crafted by our team. We handle the entire nurture sequence to keep prospects engaged without being pushy.
                </p>
              </div>
            </ScrollAnimation>
          </ScrollAnimation>

          {/* CTA */}
          <div className="mt-14 text-center">
            <Button 
              id="managed-campaign-cta-button"
              size="lg" 
              className="h-12 px-8 text-base font-medium rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
              onClick={() => {
                const heroForm = document.getElementById('hero-email-input');
                heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
              }}
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Intent-Based Targeting Section */}
      <section id="intent-targeting-section" className="py-20 sm:py-24 lg:py-28 bg-background-secondary" aria-labelledby="intent-targeting-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center max-w-6xl mx-auto">
            {/* Left Content */}
            <ScrollAnimation container className="space-y-6">
              <ScrollAnimation>
                <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md">
                  Smart Targeting
                </span>
              </ScrollAnimation>
              <ScrollAnimation>
              <h2 id="intent-targeting-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight">
                <span className="block text-foreground">
                  <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                    Reach Buyers With
                  </VerticalCutReveal>
                </span>
                <span className="text-primary-dark block mt-2">
                  <VerticalCutReveal splitBy="characters" staggerDuration={0.03} transition={{ delay: 0.8 }}>
                    Real Purchase Intent
                  </VerticalCutReveal>
                </span>
              </h2>
              </ScrollAnimation>
              <ScrollAnimation>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We don't spam entire industries with generic messages. Our AI analyzes buyer behavior, recent purchases, and market signals to identify companies actively seeking your products.
                </p>
              </ScrollAnimation>
              
              <ScrollAnimation container className="space-y-4 pt-4">
                <ScrollAnimation className="flex items-start gap-4 p-5 rounded-lg bg-background hover:bg-background transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-semantic-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Verified Buyer Signals</h4>
                    <p className="text-sm text-muted-foreground">
                      We track RFQ submissions, product searches, and market activity to find buyers who are actually looking to purchase.
                    </p>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation className="flex items-start gap-4 p-5 rounded-lg bg-background hover:bg-background transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-semantic-info mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Perfect Product Match</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI matches your products to buyers based on their specific needs, certifications required, and order volumes.
                    </p>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation className="flex items-start gap-4 p-5 rounded-lg bg-background hover:bg-background transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-semantic-purple mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Perfect Timing</h4>
                    <p className="text-sm text-muted-foreground">
                      Reach buyers at the exact moment they're evaluating suppliers, not months before or after their purchasing window.
                    </p>
                  </div>
                </ScrollAnimation>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Right Visual - Clean & Minimal */}
            <ScrollAnimation animateIn className="relative">
              <div className="bg-background border border-border/50 rounded-lg shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Buyer Intent Score</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-semantic-success-soft text-semantic-success rounded-md">
                    High Intent
                  </span>
                </div>

                {/* Intent Signals */}
                <div className="space-y-4">
                  {[
                    { label: "Active Product Search", value: 95, color: "bg-gradient-progress-green" },
                    { label: "Recent RFQ Submitted", value: 88, color: "bg-gradient-progress-blue" },
                    { label: "Budget Allocated", value: 82, color: "bg-gradient-progress-purple" },
                    { label: "Decision Timeline", value: 90, color: "bg-gradient-progress-orange" },
                  ].map((signal, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{signal.label}</span>
                        <span className="font-medium text-foreground">{signal.value}%</span>
                      </div>
                      <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${signal.color} rounded-full`}
                          style={{ width: `${signal.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-accent-surface rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-primary-dark">Recommendation:</strong> High-priority target. Buyer is actively evaluating suppliers for Q1 2025 orders.
                  </p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-28 bg-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Core Features
            </span>
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Everything You Need to Scale
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to automate your B2B outreach and close more deals
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: "AI-Generated Product Pages",
                description:
                  "Automatically extract data from PDFs, COAs, and spec sheets to build beautiful, SEO-optimized pages.",
              },
              {
                icon: Database,
                title: "Built-in Buyer Databases",
                description:
                  "Access curated industry-specific buyer databases powered by AI matching.",
              },
              {
                icon: Send,
                title: "Smart Cold Email Campaigns",
                description:
                  "Launch, schedule, and track personalized outreach in a few clicks.",
              },
              {
                icon: BarChart3,
                title: "Precision Tracking",
                description:
                  "Track opens, clicks, views, and RFQs — see exactly what buyers are engaging with.",
              },
              {
                icon: Shield,
                title: "Access Control",
                description:
                  "Set who can view each field — public, campaign recipients only, or after RFQ submission.",
              },
              {
                icon: LinkIcon,
                title: "Multi-link & QR Code Friendly",
                description:
                  "Generate shareable, analytics-enabled QR codes and short links for each campaign.",
              },
              {
                icon: Bell,
                title: "Real-time Notifications",
                description:
                  "Get instant email alerts when a buyer opens, clicks, or sends an RFQ.",
              },
              {
                icon: Zap,
                title: "Automated Workflows",
                description:
                  "Set up automatic follow-ups and nurture sequences to keep prospects engaged.",
              },
              {
                icon: Users,
                title: "CRM Integration",
                description:
                  "Sync with your existing CRM and keep all buyer data in one place.",
              },
            ].map((feature, index) => (
              <ScrollAnimation
                key={index}
                className="h-full"
              >
                <div className="h-full p-7 bg-background-secondary rounded-lg hover:bg-muted transition-colors duration-200 group">
                  {/* Icon */}
                  <div className="mb-5">
                    <div className="inline-flex p-3 bg-accent-surface rounded-md">
                      <feature.icon className="w-5 h-5 text-primary-dark" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Case Study Demo Section */}
      <section id="case-study-section" className="py-20 sm:py-24 lg:py-28 bg-background-secondary" aria-labelledby="case-study-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Real Results
            </span>
            <h2 id="case-study-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                See The Difference Pitchivo Makes
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Real companies, real campaigns, real results
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* BEFORE */}
              <ScrollAnimation className="relative">
                <div className="absolute -top-3 left-6 z-20">
                  <span className="text-xs font-medium px-3 py-1.5 bg-semantic-error-soft text-semantic-error rounded-md">
                    ❌ Before Pitchivo
                  </span>
                </div>
                <div className="bg-background rounded-lg border border-border/50 h-full p-8 pt-10">
                  <h3 className="text-xl font-semibold text-foreground mb-6">Traditional Outreach</h3>
                  
                  <div className="space-y-6">
                    {/* Metrics - Before */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-background-secondary rounded-lg">
                        <div className="text-2xl font-semibold text-red-600 mb-1">2-3%</div>
                        <div className="text-sm text-muted-foreground">Email Open Rate</div>
                      </div>
                      <div className="p-4 bg-background-secondary rounded-lg">
                        <div className="text-2xl font-semibold text-red-600 mb-1">0.5%</div>
                        <div className="text-sm text-muted-foreground">Response Rate</div>
                      </div>
                      <div className="p-4 bg-background-secondary rounded-lg">
                        <div className="text-2xl font-semibold text-red-600 mb-1">5-6</div>
                        <div className="text-sm text-muted-foreground">RFQs/month</div>
                      </div>
                      <div className="p-4 bg-background-secondary rounded-lg">
                        <div className="text-2xl font-semibold text-red-600 mb-1">4-6 mo</div>
                        <div className="text-sm text-muted-foreground">Sales Cycle</div>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-red-500">✗</span>
                        <span>Manual email list building from scratch</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-red-500">✗</span>
                        <span>Generic mass emails to broad industries</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-red-500">✗</span>
                        <span>No tracking, no insights on engagement</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-red-500">✗</span>
                        <span>Time-consuming follow-ups and no automation</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="text-red-500">✗</span>
                        <span>Inconsistent branding and product presentation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              {/* AFTER */}
              <ScrollAnimation className="relative">
                <div className="absolute -top-3 left-6 z-20">
                  <span className="text-xs font-medium px-3 py-1.5 bg-semantic-success-soft text-semantic-success rounded-md">
                    ✅ After Pitchivo
                  </span>
                </div>
                <div className="bg-background rounded-lg border border-primary-dark/30 h-full p-8 pt-10">
                  <h3 className="text-xl font-semibold text-foreground mb-6">AI-Powered Results</h3>
                  
                  <div className="space-y-6">
                    {/* Metrics - After */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-semantic-success-soft rounded-lg">
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-semibold text-semantic-success">45-68%</div>
                          <span className="text-semantic-success text-xs font-medium">↑ 20x</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Email Open Rate</div>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-semibold text-semantic-info">12-18%</div>
                          <span className="text-semantic-info text-xs font-medium">↑ 30x</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Response Rate</div>
                      </div>
                      <div className="p-4 bg-semantic-purple-soft rounded-lg">
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-semibold text-semantic-purple">50-80</div>
                          <span className="text-purple-600 text-xs font-medium">↑ 12x</span>
                        </div>
                        <div className="text-sm text-muted-foreground">RFQs/month</div>
                      </div>
                      <div className="p-4 bg-semantic-warning-soft rounded-lg">
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-semibold text-semantic-warning">6-8 wk</div>
                          <span className="text-semantic-warning text-xs font-medium">↓ 75%</span>
                        </div>
                        <div className="text-sm text-muted-foreground">Sales Cycle</div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <span className="text-primary-dark">✓</span>
                        <span>AI-curated buyers with verified purchase intent</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <span className="text-primary-dark">✓</span>
                        <span>Personalized campaigns to targeted decision-makers</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <span className="text-primary-dark">✓</span>
                        <span>Real-time analytics on every interaction</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <span className="text-primary-dark">✓</span>
                        <span>Automated follow-ups by our professional team</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <span className="text-primary-dark">✓</span>
                        <span>Beautiful AI-generated product pages & storefronts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* CTA */}
            <div className="mt-14 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Join hundreds of suppliers who have transformed their outreach
              </p>
              <Button 
                id="case-study-cta-button"
                size="lg" 
                className="h-12 px-8 text-base font-medium rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
                onClick={() => {
                  const heroForm = document.getElementById('hero-email-input');
                  heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                }}
              >
                Get These Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound & Inbound Sales Section */}
      <section id="sales-automation-section" className="py-20 sm:py-24 lg:py-28 bg-background" aria-labelledby="sales-automation-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Two-Way Sales Engine
            </span>
            <h2 id="sales-automation-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.025}>
                We Find Buyers For You & Route Buyers To You
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Outbound campaigns to reach buyers + inbound lead routing when buyers find you
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Outbound Sales Automation */}
              <ScrollAnimation className="bg-background-secondary rounded-lg p-8 hover:bg-muted transition-colors duration-200">
                <div className="mb-6">
                  <div className="inline-flex p-3 bg-accent-surface rounded-md">
                    <Send className="w-6 h-6 text-primary-dark" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Outbound: We Find Buyers For You
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We proactively reach out to verified buyers on your behalf. Your products are pitched directly to companies with active purchasing needs, complete with professional messaging and strategic follow-ups.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">AI matches your products to buyer requirements</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Professional outreach campaigns managed by our team</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-dark mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Real-time notifications when buyers respond</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Inbound Lead Routing */}
              <ScrollAnimation className="bg-background-secondary rounded-lg p-8 hover:bg-muted transition-colors duration-200">
                <div className="mb-6">
                  <div className="inline-flex p-3 bg-semantic-purple-soft rounded-md">
                    <Database className="w-6 h-6 text-semantic-purple" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Inbound: We Route Buyers To You
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We capture buyer interest and intelligently route leads to the right sellers. When buyers search products or submit RFQs, we automatically match them with your offerings and notify you instantly.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Capture inbound buyer interest automatically</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Intelligent routing to matching sellers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Pre-qualified leads delivered to your inbox</span>
                  </div>
                </div>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Visual Flow Diagram */}
            <ScrollAnimation animateIn className="mt-12 p-8 bg-background rounded-lg border border-border/30">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary-dark text-white font-semibold text-lg mb-2">
                    S
                  </div>
                  <p className="text-sm font-medium text-foreground">Sellers</p>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-primary-dark" />
                  <span className="text-sm text-muted-foreground">Outbound</span>
                  <ArrowRight className="w-5 h-5 text-primary-dark" />
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary-dark text-white font-semibold text-xl mb-2">
                    P
                  </div>
                  <p className="text-sm font-medium text-foreground">Pitchivo</p>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-purple-600 rotate-180 md:rotate-0" />
                  <span className="text-sm text-muted-foreground">Inbound</span>
                  <ArrowRight className="w-5 h-5 text-purple-600 rotate-180 md:rotate-0" />
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-semantic-purple text-white font-semibold text-lg mb-2">
                    B
                  </div>
                  <p className="text-sm font-medium text-foreground">Buyers</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Storefront Generation Section */}
      <section id="storefront-section" className="py-20 sm:py-24 lg:py-28 bg-background-secondary" aria-labelledby="storefront-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Visual */}
              <ScrollAnimation className="relative order-2 lg:order-1">
                <div className="relative bg-background border border-border/50 rounded-lg shadow-soft overflow-hidden">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-background-secondary/50">
                    <div className="w-2.5 h-2.5 bg-dot-red rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-dot-yellow rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-dot-green rounded-full"></div>
                    <span className="ml-2 text-xs text-muted-foreground">yourcompany.pitchivo.com</span>
                  </div>

                  {/* Storefront Preview - Real Content */}
                  <div className="p-6 space-y-4">
                    {/* Company Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-border/30">
                      <div className="w-12 h-12 rounded-md bg-primary-dark flex items-center justify-center text-white font-semibold text-lg">
                        AC
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Acme Chemicals Co.</div>
                        <div className="text-xs text-muted-foreground">Premium B2B Supplier</div>
                      </div>
                    </div>

                    {/* Featured Products */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">Featured Products</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'Titanium Dioxide', color: 'bg-semantic-info-soft' },
                          { name: 'Citric Acid', color: 'bg-semantic-success-soft' },
                          { name: 'Ascorbic Acid', color: 'bg-semantic-purple-soft' }
                        ].map((product, i) => (
                          <div key={i} className={`aspect-square rounded-md ${product.color} flex items-center justify-center p-2`}>
                            <span className="text-[9px] text-center font-medium text-muted-foreground leading-tight">{product.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product Description */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">About Our Products</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        High-quality chemicals and raw materials for food, pharmaceutical, and industrial applications. ISO certified, competitive pricing, reliable delivery.
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 h-9 bg-primary-dark rounded-md flex items-center justify-center text-white text-xs font-medium">
                        Request Quote
                      </div>
                      <div className="h-9 w-9 bg-background-secondary rounded-md flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-3 -right-3 z-10">
                  <span className="text-xs font-medium px-2 py-1 bg-semantic-success-soft text-semantic-success rounded-md">
                    SEO Optimized
                  </span>
                </div>
                <div className="absolute -bottom-3 -left-3 z-10">
                  <span className="text-xs font-medium px-2 py-1 bg-semantic-info-soft text-semantic-info rounded-md">
                    AEO Ready
                  </span>
                </div>
              </ScrollAnimation>

              {/* Right Content */}
              <ScrollAnimation container className="space-y-6 order-1 lg:order-2">
                <ScrollAnimation>
                  <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md">
                    AI-Generated Storefronts
                  </span>
                </ScrollAnimation>
                <ScrollAnimation>
                  <h2 id="storefront-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                    <VerticalCutReveal splitBy="characters" staggerDuration={0.025}>
                      Beautiful Websites That Drive Traffic
                    </VerticalCutReveal>
                  </h2>
                </ScrollAnimation>
                <ScrollAnimation>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We automatically generate professional storefronts and product pages that rank on Google and answer AI assistants. Drive organic traffic without hiring developers or SEO experts.
                  </p>
                </ScrollAnimation>

                <ScrollAnimation container className="space-y-4 pt-2">
                  <ScrollAnimation className="flex items-start gap-4 p-4 rounded-lg bg-background">
                    <CheckCircle2 className="w-5 h-5 text-semantic-success mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">SEO-Friendly Architecture</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized meta tags, structured data, and semantic HTML ensure your products rank high on search engines.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation className="flex items-start gap-4 p-4 rounded-lg bg-background">
                    <CheckCircle2 className="w-5 h-5 text-semantic-info mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">AEO-Ready Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized for AI search engines (ChatGPT, Perplexity). Your products appear when buyers ask AI for recommendations.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation className="flex items-start gap-4 p-4 rounded-lg bg-background">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Organic Traffic Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Watch as qualified leads find you organically through search engines and AI assistants, reducing your outreach costs.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation className="flex items-start gap-4 p-4 rounded-lg bg-background">
                    <CheckCircle2 className="w-5 h-5 text-semantic-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Built-In Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Track page views, visitor behavior, and conversion rates. Understand which products generate the most interest.
                      </p>
                    </div>
                  </ScrollAnimation>
                </ScrollAnimation>

                <ScrollAnimation>
                  <Button 
                    id="storefront-cta-button"
                    size="lg" 
                    className="h-12 px-8 text-base font-medium rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
                    onClick={() => {
                      const heroForm = document.getElementById('hero-email-input');
                      heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                    }}
                  >
                    Create Your Storefront
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </ScrollAnimation>
              </ScrollAnimation>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-20 sm:py-24 lg:py-28 bg-background" aria-labelledby="security-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Security & Compliance
            </span>
            <h2 id="security-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Enterprise-Grade Security
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Your data security and privacy are our top priorities
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: "🔒",
                  title: "SSL/TLS",
                  description: "256-bit Encryption",
                },
                {
                  icon: "🇪🇺",
                  title: "GDPR",
                  description: "Compliant",
                },
                {
                  icon: "🇺🇸",
                  title: "CCPA",
                  description: "Compliant",
                },
                {
                  icon: "🛡️",
                  title: "ISO 27001",
                  description: "Certified",
                },
              ].map((item, index) => (
                <ScrollAnimation
                  key={index}
                  className="text-center p-6 bg-background-secondary rounded-lg hover:bg-muted transition-colors duration-200"
                >
                  <div className="text-3xl mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </ScrollAnimation>
              ))}
            </ScrollAnimation>
            
            <ScrollAnimation animateIn className="mt-12 text-center">
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                We use industry-standard encryption and security practices to protect your data. 
                All communications are encrypted, and we're fully compliant with international data protection regulations.
              </p>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-24 lg:py-28 bg-background-secondary" aria-labelledby="testimonials-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Testimonials
            </span>
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Trusted by Industry Leaders
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our customers say about Pitchivo
            </p>
          </div>

          <Marquee pauseOnHover duration={35} gap={24} className="py-4">
            {[
              {
                name: "Sarah Chen",
                role: "Export Manager",
                company: "NutriGlobal Inc.",
                content: "Pitchivo transformed how we reach international buyers. We generated 50+ qualified leads in the first month and closed 3 major deals. The AI-generated product pages are incredibly professional.",
                rating: 5,
              },
              {
                name: "Michael Rodriguez",
                role: "Sales Director",
                company: "BioIngredients Corp",
                content: "The campaign analytics are game-changing. We can see exactly which buyers are interested and when to follow up. Our close rate increased by 40% since using Pitchivo.",
                rating: 5,
              },
              {
                name: "Emma Thompson",
                role: "Business Development",
                company: "OrganicSource Ltd",
                content: "Setting up used to take weeks. With Pitchivo, we launched our first campaign in hours. The platform handles everything from product pages to buyer matching. Absolutely worth it.",
                rating: 5,
              },
              {
                name: "David Park",
                role: "CEO",
                company: "GreenLeaf Extracts",
                content: "We've tried many B2B platforms, but Pitchivo's AI-powered targeting is unmatched. The quality of leads we receive is exceptional - these are real buyers ready to purchase.",
                rating: 5,
              },
              {
                name: "Lisa Wang",
                role: "Marketing Director",
                company: "PureNature Labs",
                content: "The automated follow-up sequences have saved us countless hours. Our team can now focus on closing deals instead of chasing leads. Revenue is up 60% this quarter.",
                rating: 5,
              },
              {
                name: "James Miller",
                role: "VP of Sales",
                company: "Botanical Solutions",
                content: "From product pages to email campaigns, everything just works. The ROI we've seen with Pitchivo is incredible. It's become essential to our sales process.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="w-[350px] sm:w-[380px] flex-shrink-0 bg-background rounded-lg p-6 border border-border/30"
              >
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                  <div className="w-10 h-10 rounded-md bg-primary-dark flex items-center justify-center text-white font-medium">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 sm:py-24 lg:py-28 bg-background" aria-labelledby="pricing-heading">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
              Pricing
            </span>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Plans That Scale With You
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Try free. Upgrade anytime. Cancel anytime.
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {Object.entries(PRICING_TIERS).map(([key, tierConfig]) => {
              const features = [
                `${tierConfig.features.productListing} product listings`,
                `${formatQuota(tierConfig.features.emailQuota)} emails/month`,
                `${formatQuota(tierConfig.features.qrLinksPerProduct)} QR/custom links per product`,
                tierConfig.features.browseable ? "Browseable directory" : "Private listings",
              ]
              
              if (!tierConfig.features.aiExposed) {
                features.push("Not exposed to AI")
              }
              if (tierConfig.features.apiAccess) {
                features.push("Custom API access")
              }
              if (tierConfig.features.datasetIntegration) {
                features.push("Dataset integration")
              }
              if (tierConfig.features.sla) {
                features.push("SLA support")
              }

              return {
                key,
                name: tierConfig.name,
                price: tierConfig.price === null ? "Custom" : formatPrice(tierConfig.price),
                period: tierConfig.price === null ? "" : "/mo",
                features,
                popular: tierConfig.popular,
                cta: tierConfig.cta
              }
            }).map((plan, index) => (
              <ScrollAnimation key={index} className="h-full">
                <div
                  className={cn(
                    "flex flex-col relative h-full rounded-lg p-6 transition-colors duration-200",
                    plan.popular 
                      ? "bg-accent-surface border border-primary-dark/30" 
                      : "bg-background-secondary hover:bg-muted"
                  )}
                >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="text-xs font-medium px-3 py-1 bg-primary-dark text-white rounded-md">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-dark mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <footer id="main-footer" className="border-t border-border/30 bg-background-secondary px-6 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-dark">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-foreground">Pitchivo</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                AI-powered B2B outreach platform for chemical suppliers, manufacturers, and distributors who want results — not spreadsheets.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    id="footer-features-link"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    id="footer-pricing-link"
                    className="text-muted-foreground hover:text-foreground transition-colors" 
                    onClick={scrollToPricing}
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <Link 
                    id="footer-faq-link"
                    href="/faq"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-medium text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    id="footer-privacy-link"
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-terms-link"
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-contact-link"
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-about-link"
                    href="/about"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border/30">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2025 Pitchivo. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Built with</span>
                  <span className="text-primary-dark">♥</span>
                  <span>for B2B teams</span>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pitchivo</strong>
                  <br />
                  4539 N 22ND ST, STE N, PHOENIX, AZ 85016, United States
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="sm:max-w-md rounded-lg border border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Join the Waitlist</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              We're onboarding B2B suppliers across food, chemicals, pharmaceuticals, and industrial products.
            </DialogDescription>
          </DialogHeader>

          <form id="waitlist-form" onSubmit={handleFormSubmit(handleWaitlistSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email-input" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-email-input"
                  type="email"
                  {...register("email")}
                  placeholder="you@company.com"
                  className={cn("h-11 rounded-md border-border focus:border-primary-dark focus:ring-primary/20", errors.email && "border-destructive")}
                  aria-label="Email address"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-fullname-input" className="text-sm font-medium">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-fullname-input"
                  {...register("fullName")}
                  placeholder="John Doe"
                  className={cn("h-11 rounded-md border-border focus:border-primary-dark focus:ring-primary/20", errors.fullName && "border-destructive")}
                  aria-label="Full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-company-input" className="text-sm font-medium">
                  Company / Organization <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-company-input"
                  {...register("company")}
                  placeholder="Acme Inc."
                  className={cn("h-11 rounded-md border-border focus:border-primary-dark focus:ring-primary/20", errors.company && "border-destructive")}
                  aria-label="Company name"
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-role-input" className="text-sm font-medium">Role / Title</Label>
                <Input
                  id="waitlist-role-input"
                  {...register("role")}
                  placeholder="Product Manager"
                  className="h-11 rounded-md border-border focus:border-primary-dark focus:ring-primary/20"
                  aria-label="Job role or title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-note-input" className="text-sm font-medium">
                  Tell us why you want early access
                </Label>
                <textarea
                  id="waitlist-note-input"
                  {...register("note")}
                  placeholder="Optional message..."
                  className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                  aria-label="Additional notes"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                id="waitlist-cancel-button"
                type="button"
                variant="outline"
                onClick={() => setWaitlistOpen(false)}
                disabled={isSubmitting}
                className="h-11 rounded-md border-border hover:bg-background-secondary"
              >
                Cancel
              </Button>
              <Button
                id="waitlist-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-md bg-primary-dark hover:bg-primary-darker text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

