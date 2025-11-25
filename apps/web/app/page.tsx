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
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
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

    const redirectUrl = `${globalThis.window.location.origin}/auth/callback`
    
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;

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
  const { theme, setTheme } = useTheme();

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
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const hash = window.location.hash
      window.location.replace('/auth/callback' + hash)
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
      <div className="min-h-screen relative bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />
        {/* Aurora Background - covers header and hero section */}
        <div className="bg-aurora" aria-hidden="true" />

      {/* Navbar */}
      <nav id="main-navigation" className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Pitchivo</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                id="nav-pricing-button"
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20 font-medium group relative overflow-hidden rounded-full"
                onClick={scrollToPricing}
              >
                <span className="relative z-10">Pricing</span>
                <BorderBeam size={40} duration={3} delay={0} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              <Button
                id="nav-theme-toggle-button"
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 p-0 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-mesh" aria-hidden="true" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Hero Content */}
            <ScrollAnimation container className="space-y-8">
              {/* Badge */}
              <ScrollAnimation>
                <Badge variant="premium" className="text-sm px-4 py-1.5 bg-background/90 backdrop-blur-sm border-primary-dark/40 shadow-sm text-primary-dark font-semibold">
                  AI-Powered B2B Outreach Platform
                </Badge>
              </ScrollAnimation>
              
              {/* Headline - ONLY h1 on page */}
              <ScrollAnimation>
                <h1 id="hero-main-heading" className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-tight">
                  <span className="text-foreground block">
                    <VerticalCutReveal splitBy="characters" staggerDuration={0.03} transition={{ delay: 0 }}>
                      AI-Powered Outreach
                    </VerticalCutReveal>
                  </span>
                  <span className="block mt-2 text-primary-dark">
                    <VerticalCutReveal splitBy="characters" staggerDuration={0.03} transition={{ delay: 0.5 }}>
                      That Actually Converts
                    </VerticalCutReveal>
                  </span>
                </h1>
              </ScrollAnimation>

              {/* Description */}
              <ScrollAnimation>
                <p className="text-xl sm:text-2xl text-foreground/80 dark:text-foreground/90 leading-relaxed font-medium">
                  Transform product specifications into stunning pages. Launch targeted campaigns to buyers with real purchase intent. Track engagement. Close deals faster.
                </p>
              </ScrollAnimation>

              {/* CTA Form */}
              <ScrollAnimation>
                <HeroEmailForm onOpenWaitlist={handleOpenWaitlist} />
              </ScrollAnimation>

              {/* Social Proof */}
              <ScrollAnimation>
                <div className="flex flex-wrap items-start gap-6 text-sm text-foreground/80 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span className="font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span className="font-medium">Free trial available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-dark" />
                    <span className="font-medium">Cancel anytime</span>
                  </div>
                </div>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Right Column - UI Showcase */}
            <ScrollAnimation animateIn delay={0.2} className="relative mt-8 lg:mt-0 hidden lg:block">
              {/* Background Card - Campaign Analytics Dashboard */}
              <div className="absolute -top-6 right-6 w-full max-w-md bg-background/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl transform rotate-2 overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Campaign Analytics</h3>
                    <BarChart3 className="w-4 h-4 text-primary-dark" />
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-lg border border-primary/20">
                      <div className="text-lg font-bold text-primary-dark">247</div>
                      <div className="text-[10px] text-foreground/60">Sent</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 p-2 rounded-lg border border-green-500/20">
                      <div className="text-lg font-bold text-green-700">68%</div>
                      <div className="text-[10px] text-foreground/60">Opened</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                      <div className="text-lg font-bold text-blue-700">23</div>
                      <div className="text-[10px] text-foreground/60">RFQs</div>
                    </div>
                  </div>

                  {/* Mini Line Chart */}
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-foreground/70">Open Rate Trend</span>
                      <span className="text-[10px] text-green-600 font-semibold">↑ 12%</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {[40, 52, 48, 65, 58, 68, 72, 68].map((height, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-primary to-primary-light rounded-t" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* Mini Pie Chart Representation */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/30 p-2 rounded-lg border border-border/30">
                      <div className="text-[10px] text-foreground/60 mb-1">Buyer Types</div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full" style={{ 
                            background: `conic-gradient(
                              hsl(var(--primary)) 0deg 180deg,
                              hsl(var(--chart-2)) 180deg 288deg,
                              hsl(var(--chart-3)) 288deg 360deg
                            )` 
                          }} />
                          <div className="absolute inset-2 bg-background rounded-full" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-1 text-[9px]">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-foreground/60">B2B 50%</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px]">
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                            <span className="text-foreground/60">Dist 30%</span>
                          </div>
                          <div className="flex items-center gap-1 text-[9px]">
                            <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-3))]" />
                            <span className="text-foreground/60">Mfg 20%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg border border-border/30">
                      <div className="text-[10px] text-foreground/60 mb-1">Top Regions</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-foreground/70">🇺🇸 USA</span>
                          <span className="font-semibold text-foreground">42%</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-foreground/70">🇪🇺 EU</span>
                          <span className="font-semibold text-foreground">28%</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-foreground/70">🇨🇳 Asia</span>
                          <span className="font-semibold text-foreground">30%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground Card - Detailed Product Page Preview */}
              <div className="relative z-10 bg-background/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-w-md">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <span className="ml-2 text-[10px] text-foreground/50">pitchivo.com/products/curcumin-95</span>
                </div>
                
                {/* Product Content */}
                <div className="p-4 space-y-3">
                  {/* Product Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-foreground">Organic Curcumin Extract 95%</h3>
                        <p className="text-[10px] text-foreground/60 mt-0.5">High-purity turmeric extract</p>
                      </div>
                      <Badge className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary-dark border-primary/20">
                        In Stock
                      </Badge>
                    </div>
                  </div>

                  {/* Price & Lead Time */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-2 rounded-lg border border-primary/20">
                      <div className="text-[10px] text-foreground/60 mb-0.5">Price (MOQ 100kg)</div>
                      <div className="text-base font-bold text-primary-dark">$85/kg</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-lg border border-border/50">
                      <div className="text-[10px] text-foreground/60 mb-0.5">Lead Time</div>
                      <div className="text-base font-bold text-foreground">15-20 days</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-semibold text-foreground">Description</h4>
                    <p className="text-[10px] text-foreground/70 leading-relaxed line-clamp-2">
                      Premium organic curcumin extract standardized to 95% curcuminoids. Sourced from certified organic turmeric roots.
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-semibold text-foreground">Specifications</h4>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="flex justify-between py-1 px-2 bg-muted/30 rounded">
                        <span className="text-foreground/60">Purity:</span>
                        <span className="font-medium text-foreground">95%</span>
                      </div>
                      <div className="flex justify-between py-1 px-2 bg-muted/30 rounded">
                        <span className="text-foreground/60">MOQ:</span>
                        <span className="font-medium text-foreground">100kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-semibold text-foreground">Certifications</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-700 border-green-500/20">
                        <Shield className="w-2.5 h-2.5 mr-0.5" />
                        USDA Organic
                      </Badge>
                      <Badge className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20">
                        <Shield className="w-2.5 h-2.5 mr-0.5" />
                        ISO 22000
                      </Badge>
                      <Badge className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-700 border-purple-500/20">
                        Kosher
                      </Badge>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-semibold text-foreground">Documents</h4>
                    <div className="grid grid-cols-2 gap-1">
                      <button className="flex items-center gap-1.5 p-1.5 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/30 transition-colors">
                        <FileText className="w-3 h-3 text-primary-dark" />
                        <span className="text-[9px] font-medium text-foreground">TDS</span>
                      </button>
                      <button className="flex items-center gap-1.5 p-1.5 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/30 transition-colors">
                        <FileText className="w-3 h-3 text-primary-dark" />
                        <span className="text-[9px] font-medium text-foreground">COA</span>
                      </button>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 bg-gradient-accent text-white text-[11px] font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5">
                      <Send className="w-3 h-3" />
                      Request Quote
                    </button>
                    <button className="px-3 border border-border/50 text-[11px] font-medium rounded-lg hover:bg-muted/50 transition-colors">
                      <Bell className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-20 sm:py-24 lg:py-32 bg-transparent relative" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              How It Works
            </Badge>
            <ScrollAnimation>
              <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                  Simple Process, Powerful Results
                </VerticalCutReveal>
              </h2>
            </ScrollAnimation>
            <p className="text-lg text-muted-foreground">
              From upload to buyer engagement — all in five easy steps
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
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
                className={cn(
                  "relative",
                  index < 2 ? "lg:col-span-1" : index === 2 ? "lg:col-span-1" : "lg:col-span-1"
                )}
              >
                <SpotlightCard 
                  className="h-full border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-5xl font-bold text-primary/20 select-none">
                        {step.step}
                      </span>
                      <div className="inline-flex p-3 bg-gradient-accent rounded-xl shadow-premium group-hover:shadow-premium-lg transition-shadow duration-300">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </SpotlightCard>

                {/* Connector Arrow */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Managed Email Campaign Service Section */}
      <section id="managed-campaigns-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background" aria-labelledby="managed-campaigns-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Managed Campaign Service
            </Badge>
            <ScrollAnimation>
              <h2 id="managed-campaigns-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
                <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                  Professional Email Outreach, Done For You
                </VerticalCutReveal>
              </h2>
            </ScrollAnimation>
            <p className="text-lg text-muted-foreground">
              Our team handles the heavy lifting so you can focus on closing deals
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Automated Email Warmup */}
            <ScrollAnimation id="managed-campaign-warmup-card">
              <SpotlightCard className="h-full border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary-light/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
                <div className="p-8">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <Zap className="w-7 h-7 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    Automated Email Warmup
                  </h3>
                  <p className="text-muted-foreground dark:text-foreground/80 leading-relaxed text-sm">
                    We automatically warm up your email domain to ensure maximum deliverability. No spam folders, no blacklists — just professional outreach that reaches inboxes.
                  </p>
                </div>
              </SpotlightCard>
            </ScrollAnimation>

            {/* Professional Copywriting */}
            <ScrollAnimation id="managed-campaign-copy-card">
              <SpotlightCard className="h-full border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary-light/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
                <div className="p-8">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <FileText className="w-7 h-7 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    Curated Professional Copy
                  </h3>
                  <p className="text-muted-foreground dark:text-foreground/80 leading-relaxed text-sm">
                    Our expert writers craft compelling, personalized outreach messages that resonate with B2B buyers. Every email is optimized for engagement and conversions.
                  </p>
                </div>
              </SpotlightCard>
            </ScrollAnimation>

            {/* Strategic Follow-ups */}
            <ScrollAnimation id="managed-campaign-followup-card">
              <SpotlightCard className="h-full border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary-light/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
                <div className="p-8">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                      <Send className="w-7 h-7 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    Smart Follow-Up Sequences
                  </h3>
                  <p className="text-muted-foreground dark:text-foreground/80 leading-relaxed text-sm">
                    Professionally timed follow-up emails crafted by our team. We handle the entire nurture sequence to keep prospects engaged without being pushy.
                  </p>
                </div>
              </SpotlightCard>
            </ScrollAnimation>
          </ScrollAnimation>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Button 
              id="managed-campaign-cta-button"
              size="lg" 
              className="group relative overflow-hidden rounded-full h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20"
              onClick={() => {
                const heroForm = document.getElementById('hero-email-input');
                heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
              }}
            >
              <span className="relative z-10 flex items-center">
                Start Your Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </span>
              <BorderBeam size={70} duration={3} delay={0} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
          </div>
        </div>
      </section>

      {/* Intent-Based Targeting Section */}
      <section id="intent-targeting-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="intent-targeting-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Left Content */}
            <ScrollAnimation container className="space-y-6">
              <ScrollAnimation>
                <Badge variant="premium" className="mb-2">
                  Smart Targeting
                </Badge>
              </ScrollAnimation>
              <ScrollAnimation>
              <h2 id="intent-targeting-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                <span className="block">
                  <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                    Reach Buyers With
                  </VerticalCutReveal>
                </span>
                <span className="text-primary block mt-2">
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
                <ScrollAnimation id="intent-signal-verified" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Verified Buyer Signals</h4>
                    <p className="text-sm text-muted-foreground">
                      We track RFQ submissions, product searches, and market activity to find buyers who are actually looking to purchase.
                    </p>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation id="intent-signal-match" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Perfect Product Match</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI matches your products to buyers based on their specific needs, certifications required, and order volumes.
                    </p>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation id="intent-signal-timing" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Perfect Timing</h4>
                    <p className="text-sm text-muted-foreground">
                      Reach buyers at the exact moment they're evaluating suppliers, not months before or after their purchasing window.
                    </p>
                  </div>
                </ScrollAnimation>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Right Visual */}
            <ScrollAnimation animateIn className="relative">
              <SpotlightCard className="bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">Buyer Intent Score</h3>
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      High Intent
                    </Badge>
                  </div>

                  {/* Intent Signals */}
                  <div className="space-y-3">
                    {[
                      { label: "Active Product Search", value: 95, color: "green" },
                      { label: "Recent RFQ Submitted", value: 88, color: "blue" },
                      { label: "Budget Allocated", value: 82, color: "purple" },
                      { label: "Decision Timeline", value: 90, color: "orange" },
                    ].map((signal, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/80">{signal.label}</span>
                          <span className="font-bold text-foreground">{signal.value}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r from-${signal.color}-500 to-${signal.color}-600 rounded-full transition-all duration-1000`}
                            style={{ width: `${signal.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-primary">Recommendation:</strong> High-priority target. Buyer is actively evaluating suppliers for Q1 2025 orders.
                    </p>
                  </div>
                </div>
              </SpotlightCard>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />
              <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none -z-10" />
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Core Features
            </Badge>
            <h2 id="features-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Everything You Need to Scale
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to automate your B2B outreach and close more deals
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
                <SpotlightCard className="h-full border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group">
                  {/* Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className="inline-flex p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-muted-foreground dark:text-foreground/80 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Case Study Demo Section */}
      <section id="case-study-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-accent/5 to-background" aria-labelledby="case-study-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Real Results
            </Badge>
            <h2 id="case-study-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                See The Difference Pitchivo Makes
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Real companies, real campaigns, real results
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* BEFORE */}
              <ScrollAnimation id="case-study-before-card" className="relative">
                <div className="absolute -top-4 left-4 z-20">
                  <Badge className="bg-destructive text-destructive-foreground border-destructive/50 shadow-lg">
                    ❌ Before Pitchivo
                  </Badge>
                </div>
                <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.1)" className="bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border-2 border-border/50 h-full">
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground/80 mb-6">Traditional Outreach</h3>
                    
                    <div className="space-y-6">
                      {/* Metrics - Before */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                          <div className="text-3xl font-bold text-destructive mb-1">2-3%</div>
                          <div className="text-sm text-muted-foreground">Email Open Rate</div>
                        </div>
                        <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                          <div className="text-3xl font-bold text-destructive mb-1">0.5%</div>
                          <div className="text-sm text-muted-foreground">Response Rate</div>
                        </div>
                        <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                          <div className="text-3xl font-bold text-destructive mb-1">5-6</div>
                          <div className="text-sm text-muted-foreground">RFQs/month</div>
                        </div>
                        <div className="p-4 bg-background/50 rounded-xl border border-border/30">
                          <div className="text-3xl font-bold text-destructive mb-1">4-6 mo</div>
                          <div className="text-sm text-muted-foreground">Sales Cycle</div>
                        </div>
                      </div>

                      {/* Pain Points */}
                      <div className="space-y-3 pt-4">
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive">✗</span>
                          <span>Manual email list building from scratch</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive">✗</span>
                          <span>Generic mass emails to broad industries</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive">✗</span>
                          <span>No tracking, no insights on engagement</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive">✗</span>
                          <span>Time-consuming follow-ups and no automation</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive">✗</span>
                          <span>Inconsistent branding and product presentation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </ScrollAnimation>

              {/* AFTER */}
              <ScrollAnimation id="case-study-after-card" className="relative">
                <div className="absolute -top-4 left-4 z-20">
                  <Badge className="bg-primary text-primary-foreground border-primary/50 shadow-lg">
                    ✅ After Pitchivo
                  </Badge>
                </div>
                <SpotlightCard className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 backdrop-blur-sm border-2 border-primary/30 h-full shadow-xl shadow-primary/10">
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-6">AI-Powered Results</h3>
                    
                    <div className="space-y-6">
                      {/* Metrics - After */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl border border-green-500/30">
                          <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-bold text-green-700">45-68%</div>
                            <span className="text-green-600 text-sm font-semibold">↑ 20x</span>
                          </div>
                          <div className="text-sm text-foreground/80 font-medium">Email Open Rate</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl border border-blue-500/30">
                          <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-bold text-blue-700">12-18%</div>
                            <span className="text-blue-600 text-sm font-semibold">↑ 30x</span>
                          </div>
                          <div className="text-sm text-foreground/80 font-medium">Response Rate</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl border border-purple-500/30">
                          <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-bold text-purple-700">50-80</div>
                            <span className="text-purple-600 text-sm font-semibold">↑ 12x</span>
                          </div>
                          <div className="text-sm text-foreground/80 font-medium">RFQs/month</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-xl border border-orange-500/30">
                          <div className="flex items-baseline gap-1">
                            <div className="text-3xl font-bold text-orange-700">6-8 wk</div>
                            <span className="text-orange-600 text-sm font-semibold">↓ 75%</span>
                          </div>
                          <div className="text-sm text-foreground/80 font-medium">Sales Cycle</div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-3 pt-4">
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <span className="text-primary">✓</span>
                          <span className="font-medium">AI-curated buyers with verified purchase intent</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <span className="text-primary">✓</span>
                          <span className="font-medium">Personalized campaigns to targeted decision-makers</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <span className="text-primary">✓</span>
                          <span className="font-medium">Real-time analytics on every interaction</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <span className="text-primary">✓</span>
                          <span className="font-medium">Automated follow-ups by our professional team</span>
                        </div>
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <span className="text-primary">✓</span>
                          <span className="font-medium">Beautiful AI-generated product pages & storefronts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* CTA */}
            <div className="mt-12 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Join hundreds of suppliers who have transformed their outreach
              </p>
              <Button 
                id="case-study-cta-button"
                size="lg" 
                className="group relative overflow-hidden rounded-full h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20"
                onClick={() => {
                  const heroForm = document.getElementById('hero-email-input');
                  heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                }}
              >
                <span className="relative z-10 flex items-center">
                  Get These Results
                  <ArrowRight className="ml-2 h-5 w-5" />
                </span>
                <BorderBeam size={70} duration={3} delay={0} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound & Inbound Sales Section */}
      <section id="sales-automation-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="sales-automation-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Two-Way Sales Engine
            </Badge>
            <h2 id="sales-automation-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.025}>
                We Find Buyers For You & Route Buyers To You
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Outbound campaigns to reach buyers + inbound lead routing when buyers find you
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Outbound Sales Automation */}
              <ScrollAnimation id="outbound-sales-card" className="group relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 backdrop-blur-sm p-8 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-primary/30 to-primary/20 rounded-2xl shadow-lg">
                    <Send className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Outbound: We Find Buyers For You
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We proactively reach out to verified buyers on your behalf. Your products are pitched directly to companies with active purchasing needs, complete with professional messaging and strategic follow-ups.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">AI matches your products to buyer requirements</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Professional outreach campaigns managed by our team</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Real-time notifications when buyers respond</span>
                  </div>
                </div>
              </ScrollAnimation>

              {/* Inbound Lead Routing */}
              <ScrollAnimation id="inbound-routing-card" className="group relative overflow-hidden rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 via-card/80 to-card/60 backdrop-blur-sm p-8 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-accent/30 to-accent/20 rounded-2xl shadow-lg">
                    <Database className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Inbound: We Route Buyers To You
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We capture buyer interest and intelligently route leads to the right sellers. When buyers search products or submit RFQs, we automatically match them with your offerings and notify you instantly.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Capture inbound buyer interest automatically</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Intelligent routing to matching sellers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Pre-qualified leads delivered to your inbox</span>
                  </div>
                </div>
              </ScrollAnimation>
            </ScrollAnimation>

            {/* Visual Flow Diagram */}
            <ScrollAnimation animateIn className="mt-12 p-8 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm rounded-2xl border border-border/50">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-2">
                    S
                  </div>
                  <p className="text-sm font-semibold text-foreground">Sellers</p>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Outbound</span>
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent text-white font-bold text-2xl mb-2">
                    P
                  </div>
                  <p className="text-sm font-semibold text-foreground">Pitchivo</p>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-accent rotate-180 md:rotate-0" />
                  <span className="text-sm font-medium text-muted-foreground">Inbound</span>
                  <ArrowRight className="w-6 h-6 text-accent rotate-180 md:rotate-0" />
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground font-bold text-xl mb-2">
                    B
                  </div>
                  <p className="text-sm font-semibold text-foreground">Buyers</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Storefront Generation Section */}
      <section id="storefront-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background" aria-labelledby="storefront-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Visual */}
              <ScrollAnimation className="relative order-2 lg:order-1">
                <div className="relative bg-gradient-to-br from-background/95 via-background/90 to-background/85 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span className="ml-2 text-xs text-muted-foreground">yourcompany.pitchivo.com</span>
                  </div>

                  {/* Storefront Preview - Real Content */}
                  <div className="p-6 space-y-4 bg-background/50">
                    {/* Company Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                      <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        AC
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Acme Chemicals Co.</div>
                        <div className="text-xs text-muted-foreground">Premium B2B Supplier</div>
                      </div>
                    </div>

                    {/* Featured Products */}
                    <div>
                      <div className="text-xs font-semibold text-foreground/80 mb-2">Featured Products</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { name: 'Titanium Dioxide', color: 'from-blue-500/30 to-blue-500/20' },
                          { name: 'Citric Acid', color: 'from-green-500/30 to-green-500/20' },
                          { name: 'Ascorbic Acid', color: 'from-purple-500/30 to-purple-500/20' }
                        ].map((product, i) => (
                          <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${product.color} border border-border/30 flex items-center justify-center p-2`}>
                            <span className="text-[8px] text-center font-medium text-foreground/70 leading-tight">{product.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product Description */}
                    <div>
                      <div className="text-xs font-semibold text-foreground/80 mb-1.5">About Our Products</div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          High-quality chemicals and raw materials for food, pharmaceutical, and industrial applications.
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          ISO certified, competitive pricing, reliable delivery.
                        </div>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 h-8 bg-gradient-accent rounded-lg flex items-center justify-center text-white text-[10px] font-semibold shadow-md">
                        Request Quote
                      </div>
                      <div className="h-8 w-8 bg-muted/50 rounded-lg flex items-center justify-center border border-border/30">
                        <Bell className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-6 -right-6 z-10">
                  <Badge className="bg-green-500 text-white border-green-600 shadow-lg">
                    SEO Optimized
                  </Badge>
                </div>
                <div className="absolute -bottom-6 -left-6 z-10">
                  <Badge className="bg-blue-500 text-white border-blue-600 shadow-lg">
                    AEO Ready
                  </Badge>
                </div>
              </ScrollAnimation>

              {/* Right Content */}
              <ScrollAnimation container className="space-y-6 order-1 lg:order-2">
                <ScrollAnimation>
                  <Badge variant="premium" className="mb-2">
                    AI-Generated Storefronts
                  </Badge>
                </ScrollAnimation>
                <ScrollAnimation>
                  <h2 id="storefront-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
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

                <ScrollAnimation container className="space-y-4 pt-4">
                  <ScrollAnimation id="storefront-benefit-seo" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">SEO-Friendly Architecture</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized meta tags, structured data, and semantic HTML ensure your products rank high on search engines.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation id="storefront-benefit-aeo" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">AEO-Ready Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized for AI search engines (ChatGPT, Perplexity). Your products appear when buyers ask AI for recommendations.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation id="storefront-benefit-traffic" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                    <CheckCircle2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Organic Traffic Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Watch as qualified leads find you organically through search engines and AI assistants, reducing your outreach costs.
                      </p>
                    </div>
                  </ScrollAnimation>

                  <ScrollAnimation id="storefront-benefit-analytics" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
                    <CheckCircle2 className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Built-In Analytics</h4>
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
                    className="group relative overflow-hidden rounded-full h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20"
                    onClick={() => {
                      const heroForm = document.getElementById('hero-email-input');
                      heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                    }}
                  >
                    <span className="relative z-10 flex items-center">
                      Create Your Storefront
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                    <BorderBeam size={70} duration={3} delay={0} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </ScrollAnimation>
              </ScrollAnimation>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="security-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Security & Compliance
            </Badge>
            <h2 id="security-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Enterprise-Grade Security
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Your data security and privacy are our top priorities
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <ScrollAnimation container className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
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
                  className="text-center p-6 hover-lift group"
                >
                  <Card
                    variant="premium"
                    className="h-full border-none shadow-none bg-transparent"
                  >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Card>
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
      <section className="py-20 sm:py-24 lg:py-32 bg-background" aria-labelledby="testimonials-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Testimonials
            </Badge>
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
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
              <SpotlightCard
                key={index}
                className="w-[350px] sm:w-[400px] flex-shrink-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 border-border/50 shadow-premium"
              >
                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </SpotlightCard>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="pricing-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Pricing
            </Badge>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              <VerticalCutReveal splitBy="characters" staggerDuration={0.03}>
                Plans That Scale With You
              </VerticalCutReveal>
            </h2>
            <p className="text-lg text-muted-foreground">
              Try free. Upgrade anytime. Cancel anytime.
            </p>
          </div>

          <ScrollAnimation container className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
                <SpotlightCard
                  className={cn(
                    "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] flex flex-col relative h-full",
                    plan.popular ? "border-primary/50 ring-2 ring-primary/20 shadow-premium" : "border-border/50"
                  )}
                >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge variant="default" className="shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-8">
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </SpotlightCard>
              </ScrollAnimation>
            ))}
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <footer id="main-footer" className="border-t border-border/50 bg-gradient-to-b from-background to-background/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Pitchivo</span>
              </div>
              <p className="text-base text-muted-foreground max-w-sm">
                AI-powered B2B outreach platform for chemical suppliers, manufacturers, and distributors who want results — not spreadsheets.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Button 
                    id="footer-features-link"
                    variant="link" 
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    Features
                  </Button>
                </li>
                <li>
                  <Button 
                    id="footer-pricing-link"
                    variant="link" 
                    className="h-auto p-0 text-muted-foreground hover:text-foreground" 
                    onClick={scrollToPricing}
                  >
                    Pricing
                  </Button>
                </li>
                <li>
                  <Link 
                    id="footer-faq-link"
                    href="/faq"
                    className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-muted-foreground hover:text-foreground")}
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    id="footer-privacy-link"
                    href="/privacy"
                    className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-muted-foreground hover:text-foreground")}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-terms-link"
                    href="/terms"
                    className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-muted-foreground hover:text-foreground")}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-contact-link"
                    href="/contact"
                    className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-muted-foreground hover:text-foreground")}
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link 
                    id="footer-about-link"
                    href="/about"
                    className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-muted-foreground hover:text-foreground")}
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2025 Pitchivo. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Built with</span>
                  <span className="text-primary">♥</span>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Waitlist</DialogTitle>
            <DialogDescription>
              We're onboarding B2B suppliers across food, chemicals, pharmaceuticals, and industrial products.
            </DialogDescription>
          </DialogHeader>

          <form id="waitlist-form" onSubmit={handleFormSubmit(handleWaitlistSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email-input">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-email-input"
                  type="email"
                  {...register("email")}
                  placeholder="you@company.com"
                  className={cn("h-11 touch-manipulation", errors.email && "border-destructive")}
                  aria-label="Email address"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-fullname-input">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-fullname-input"
                  {...register("fullName")}
                  placeholder="John Doe"
                  className={cn("h-11 touch-manipulation", errors.fullName && "border-destructive")}
                  aria-label="Full name"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-company-input">
                  Company / Organization <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-company-input"
                  {...register("company")}
                  placeholder="Acme Inc."
                  className={cn("h-11 touch-manipulation", errors.company && "border-destructive")}
                  aria-label="Company name"
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-role-input">Role / Title</Label>
                <Input
                  id="waitlist-role-input"
                  {...register("role")}
                  placeholder="Product Manager"
                  className="h-11 touch-manipulation"
                  aria-label="Job role or title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-note-input">
                  Tell us why you want early access
                </Label>
                <textarea
                  id="waitlist-note-input"
                  {...register("note")}
                  placeholder="Optional message..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                id="waitlist-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="h-11"
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
