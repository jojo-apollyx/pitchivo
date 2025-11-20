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
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
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

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Check email domain status in database
      const domainStatus = await checkEmailDomainStatus(email);
      
      if (domainStatus === 'public') {
        toast.error("Company Email Required", {
          description: "Please use your company email address. Public email domains (Gmail, Yahoo, etc.) are not accepted.",
        });
        setIsLoading(false);
        return;
      }

      if (domainStatus === 'blocked') {
        toast.error("Domain Blocked", {
          description: "This email domain has been blocked and cannot be used to sign up.",
        });
        setIsLoading(false);
        return;
      }

      const invited = await isInvitedEmail(email);
              if (!invited) {
                toast(
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-dark" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-1">Invite-Only Access</div>
                      <p className="text-sm text-foreground/70 mb-3">
                        We are invitation only. Join our waitlist to get notified when we open up.
                      </p>
                      <button
                        onClick={() => {
                          reset({ email, fullName: "", company: "", role: "", note: "" });
                          setWaitlistOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-accent text-white text-sm font-medium rounded-lg hover:shadow-lg transition-shadow"
                      >
                        Join Waitlist
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>,
                  { duration: 6000 }
                );
                setIsLoading(false);
                return;
              }

      await sendMagicLink(email);
      setEmail("");
    } catch (_error) {
      // Error already handled in sendMagicLink
    } finally {
      setIsLoading(false);
    }
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
      setEmail("");
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
                className="hidden sm:flex hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20 font-medium"
                onClick={scrollToPricing}
              >
                Pricing
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
            <div className="space-y-8 animate-fadeIn">
              {/* Badge */}
              <Badge variant="premium" className="text-sm px-4 py-1.5 bg-background/90 backdrop-blur-sm border-primary-dark/40 shadow-sm text-primary-dark font-semibold">
                AI-Powered B2B Outreach Platform
              </Badge>
              
              {/* Headline - ONLY h1 on page */}
              <h1 id="hero-main-heading" className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-tight">
                <span className="text-foreground">AI-Powered Outreach</span>
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-primary-dark">
                  That Actually Converts
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl sm:text-2xl text-foreground/80 dark:text-foreground/90 leading-relaxed font-medium">
                Transform product specifications into stunning pages. Launch targeted campaigns to buyers with real purchase intent. Track engagement. Close deals faster.
              </p>

              {/* CTA Form */}
              <form id="hero-cta-form" onSubmit={handleMagicLinkSubmit} className="mt-10">
                <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
                  <Input
                    id="hero-email-input"
                    type="email"
                    placeholder="Enter your company email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="!h-16 sm:!h-14 flex-1 text-base bg-background/95 backdrop-blur-sm border-border/50 shadow-sm px-4 py-3"
                    disabled={isLoading}
                    aria-label="Company email address"
                  />
                  <Button
                    id="hero-get-started-button"
                    type="submit"
                    size="lg"
                    className="h-12 sm:h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Get Started"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>

              {/* Social Proof */}
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
            </div>

            {/* Right Column - UI Showcase */}
            <div className="relative mt-8 lg:mt-0 animate-fadeIn hidden lg:block" style={{ animationDelay: '200ms' }}>
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
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-20 sm:py-24 lg:py-32 relative" aria-labelledby="how-it-works-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              How It Works
            </Badge>
            <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Simple Process, Powerful Results
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              From upload to buyer engagement — all in five easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
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
              <div
                key={index}
                className={cn(
                  "relative",
                  index < 2 ? "lg:col-span-1" : index === 2 ? "lg:col-span-1" : "lg:col-span-1"
                )}
              >
                <div 
                  className="h-full p-8 rounded-3xl bg-gradient-to-br from-card/50 to-card/10 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 group"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="inline-flex p-3.5 bg-gradient-accent rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-4xl font-display font-bold text-foreground/10 select-none group-hover:text-primary/10 transition-colors duration-500">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Managed Email Campaign Service Section */}
      <section id="managed-campaigns-section" className="py-20 sm:py-24 lg:py-32 relative overflow-hidden" aria-labelledby="managed-campaigns-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-30" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Managed Campaign Service
            </Badge>
            <h2 id="managed-campaigns-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Professional Email Outreach, Done For You
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Our team handles the heavy lifting so you can focus on closing deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Automated Email Warmup */}
            <div id="managed-campaign-warmup-card" className="group relative overflow-hidden rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 p-8 hover:bg-card/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500">
                    <Zap className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-green-500 transition-colors duration-300">
                  Automated Email Warmup
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  We automatically warm up your email domain to ensure maximum deliverability. No spam folders, no blacklists — just professional outreach that reaches inboxes.
                </p>
              </div>
            </div>

            {/* Professional Copywriting */}
            <div id="managed-campaign-copy-card" className="group relative overflow-hidden rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 p-8 hover:bg-card/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500">
                    <FileText className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-purple-500 transition-colors duration-300">
                  Curated Professional Copy
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Our expert writers craft compelling, personalized outreach messages that resonate with B2B buyers. Every email is optimized for engagement and conversions.
                </p>
              </div>
            </div>

            {/* Strategic Follow-ups */}
            <div id="managed-campaign-followup-card" className="group relative overflow-hidden rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 p-8 hover:bg-card/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500">
                    <Send className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-blue-500 transition-colors duration-300">
                  Smart Follow-Up Sequences
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Professionally timed follow-up emails crafted by our team. We handle the entire nurture sequence to keep prospects engaged without being pushy.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Button 
              id="managed-campaign-cta-button"
              size="lg" 
              className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary-dark"
              onClick={() => {
                const heroForm = document.getElementById('hero-email-input');
                heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
              }}
            >
              Start Your Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Intent-Based Targeting Section */}
      <section id="intent-targeting-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="intent-targeting-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Left Content */}
            <div className="space-y-6">
              <Badge variant="premium" className="mb-2">
                Smart Targeting
              </Badge>
              <h2 id="intent-targeting-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                Reach Buyers With <span className="text-primary">Real Purchase Intent</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We don't spam entire industries with generic messages. Our AI analyzes buyer behavior, recent purchases, and market signals to identify companies actively seeking your products.
              </p>
              
              <div className="space-y-4 pt-4">
                <div id="intent-signal-verified" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Verified Buyer Signals</h4>
                    <p className="text-sm text-muted-foreground">
                      We track RFQ submissions, product searches, and market activity to find buyers who are actually looking to purchase.
                    </p>
                  </div>
                </div>

                <div id="intent-signal-match" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Perfect Product Match</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI matches your products to buyers based on their specific needs, certifications required, and order volumes.
                    </p>
                  </div>
                </div>

                <div id="intent-signal-timing" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Perfect Timing</h4>
                    <p className="text-sm text-muted-foreground">
                      Reach buyers at the exact moment they're evaluating suppliers, not months before or after their purchasing window.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative bg-background/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-6 overflow-hidden">
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

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none -z-10" />
              <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden" aria-labelledby="features-heading">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#333_1px,transparent_1px)]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Core Features
            </Badge>
            <h2 id="features-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Everything You Need to Scale
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Powerful tools to automate your B2B outreach and close more deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl bg-card/50 backdrop-blur-xl border border-white/10 dark:border-white/5 p-8 hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500 group-hover:bg-primary/20">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Demo Section */}
      <section id="case-study-section" className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden" aria-labelledby="case-study-heading">
        {/* Decorative background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Real Results
            </Badge>
            <h2 id="case-study-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              See The Difference Pitchivo Makes
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Real companies, real campaigns, real results
            </p>
          </div>

          {/* Before/After Comparison */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* BEFORE */}
              <div id="case-study-before-card" className="relative group">
                <div className="absolute -top-4 left-4 z-10">
                  <Badge className="bg-destructive text-destructive-foreground border-destructive/50 shadow-lg">
                    ❌ Before Pitchivo
                  </Badge>
                </div>
                <div className="bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 h-full transition-all duration-500 hover:bg-card/40">
                  <h3 className="text-2xl font-bold text-foreground/80 mb-6">Traditional Outreach</h3>
                  
                  <div className="space-y-6">
                    {/* Metrics - Before */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-background/40 rounded-2xl border border-border/30 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-destructive mb-1">2-3%</div>
                        <div className="text-sm text-muted-foreground">Email Open Rate</div>
                      </div>
                      <div className="p-4 bg-background/40 rounded-2xl border border-border/30 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-destructive mb-1">0.5%</div>
                        <div className="text-sm text-muted-foreground">Response Rate</div>
                      </div>
                      <div className="p-4 bg-background/40 rounded-2xl border border-border/30 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-destructive mb-1">5-6</div>
                        <div className="text-sm text-muted-foreground">RFQs/month</div>
                      </div>
                      <div className="p-4 bg-background/40 rounded-2xl border border-border/30 backdrop-blur-sm">
                        <div className="text-3xl font-bold text-destructive mb-1">4-6 mo</div>
                        <div className="text-sm text-muted-foreground">Sales Cycle</div>
                      </div>
                    </div>

                    {/* Pain Points */}
                    <div className="space-y-3 pt-4">
                      {[
                        "Manual email list building from scratch",
                        "Generic mass emails to broad industries",
                        "No tracking, no insights on engagement",
                        "Time-consuming follow-ups and no automation",
                        "Inconsistent branding and product presentation"
                      ].map((point, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="text-destructive font-bold">✗</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER */}
              <div id="case-study-after-card" className="relative group">
                <div className="absolute -top-4 left-4 z-10">
                  <Badge className="bg-primary text-primary-foreground border-primary/50 shadow-lg shadow-primary/20">
                    ✅ After Pitchivo
                  </Badge>
                </div>
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 h-full shadow-2xl shadow-primary/5 transition-all duration-500 hover:shadow-primary/10 hover:scale-[1.01]">
                  <h3 className="text-2xl font-bold text-foreground mb-6">AI-Powered Results</h3>
                  
                  <div className="space-y-6">
                    {/* Metrics - After */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl border border-green-500/30 shadow-sm">
                        <div className="flex items-baseline gap-1">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">45-68%</div>
                          <span className="text-green-600 text-sm font-semibold">↑ 20x</span>
                        </div>
                        <div className="text-sm text-foreground/80 font-medium">Email Open Rate</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl border border-blue-500/30 shadow-sm">
                        <div className="flex items-baseline gap-1">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12-18%</div>
                          <span className="text-blue-600 text-sm font-semibold">↑ 30x</span>
                        </div>
                        <div className="text-sm text-foreground/80 font-medium">Response Rate</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl border border-purple-500/30 shadow-sm">
                        <div className="flex items-baseline gap-1">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">50-80</div>
                          <span className="text-purple-600 text-sm font-semibold">↑ 12x</span>
                        </div>
                        <div className="text-sm text-foreground/80 font-medium">RFQs/month</div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-2xl border border-orange-500/30 shadow-sm">
                        <div className="flex items-baseline gap-1">
                          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">6-8 wk</div>
                          <span className="text-orange-600 text-sm font-semibold">↓ 75%</span>
                        </div>
                        <div className="text-sm text-foreground/80 font-medium">Sales Cycle</div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 pt-4">
                      {[
                        "AI-curated buyers with verified purchase intent",
                        "Personalized campaigns to targeted decision-makers",
                        "Real-time analytics on every interaction",
                        "Automated follow-ups by our professional team",
                        "Beautiful AI-generated product pages & storefronts"
                      ].map((benefit, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-foreground">
                          <div className="rounded-full bg-primary/20 p-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-medium">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="text-lg text-muted-foreground mb-8 font-medium">
                Join hundreds of suppliers who have transformed their outreach
              </p>
              <Button 
                id="case-study-cta-button"
                size="lg" 
                className="h-14 px-10 text-lg font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary-dark"
                onClick={() => {
                  const heroForm = document.getElementById('hero-email-input');
                  heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                }}
              >
                Get These Results
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Outbound & Inbound Sales Section */}
      <section id="sales-automation-section" className="py-20 sm:py-24 lg:py-32 bg-background relative" aria-labelledby="sales-automation-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Two-Way Sales Engine
            </Badge>
            <h2 id="sales-automation-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              We Find Buyers For You & Route Buyers To You
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Outbound campaigns to reach buyers + inbound lead routing when buyers find you
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Outbound Sales Automation */}
              <div id="outbound-sales-card" className="group relative overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-card/30 backdrop-blur-xl p-8 hover:bg-card/50 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500">
                      <Send className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Outbound: We Find Buyers For You
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    We proactively reach out to verified buyers on your behalf. Your products are pitched directly to companies with active purchasing needs, complete with professional messaging and strategic follow-ups.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors duration-300">
                      <div className="rounded-full bg-primary/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">AI matches your products to buyer requirements</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors duration-300">
                      <div className="rounded-full bg-primary/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Professional outreach campaigns managed by our team</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors duration-300">
                      <div className="rounded-full bg-primary/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Real-time notifications when buyers respond</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inbound Lead Routing */}
              <div id="inbound-routing-card" className="group relative overflow-hidden rounded-3xl border border-white/10 dark:border-white/5 bg-card/30 backdrop-blur-xl p-8 hover:bg-card/50 hover:border-accent/20 hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl shadow-inner group-hover:scale-110 transition-all duration-500">
                      <Database className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Inbound: We Route Buyers To You
                  </h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    We capture buyer interest and intelligently route leads to the right sellers. When buyers search products or submit RFQs, we automatically match them with your offerings and notify you instantly.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10 group-hover:bg-accent/10 transition-colors duration-300">
                      <div className="rounded-full bg-accent/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Capture inbound buyer interest automatically</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10 group-hover:bg-accent/10 transition-colors duration-300">
                      <div className="rounded-full bg-accent/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Intelligent routing to matching sellers</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10 group-hover:bg-accent/10 transition-colors duration-300">
                      <div className="rounded-full bg-accent/20 p-1">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-foreground">Pre-qualified leads delivered to your inbox</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Flow Diagram */}
            <div className="mt-12 p-10 bg-gradient-to-br from-card/30 to-card/10 backdrop-blur-xl rounded-3xl border border-white/10 dark:border-white/5 shadow-2xl shadow-primary/5">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                    S
                  </div>
                  <p className="text-base font-bold text-foreground">Sellers</p>
                </div>

                <div className="flex flex-col items-center gap-2 text-primary animate-pulse">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-6 h-6" />
                    <ArrowRight className="w-6 h-6 -ml-3 opacity-70" />
                    <ArrowRight className="w-6 h-6 -ml-3 opacity-40" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Outbound</span>
                </div>

                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-accent text-white font-bold text-3xl mb-4 shadow-xl shadow-primary/30 group-hover:scale-110 transition-transform duration-300 ring-4 ring-background">
                    P
                  </div>
                  <p className="text-lg font-bold text-foreground">Pitchivo</p>
                </div>

                <div className="flex flex-col items-center gap-2 text-accent animate-pulse delay-75">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-6 h-6 rotate-180 md:rotate-0" />
                    <ArrowRight className="w-6 h-6 -ml-3 opacity-70 rotate-180 md:rotate-0" />
                    <ArrowRight className="w-6 h-6 -ml-3 opacity-40 rotate-180 md:rotate-0" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inbound</span>
                </div>

                <div className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent text-accent-foreground font-bold text-2xl mb-4 shadow-lg shadow-accent/30 group-hover:scale-110 transition-transform duration-300">
                    B
                  </div>
                  <p className="text-base font-bold text-foreground">Buyers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storefront Generation Section */}
      <section id="storefront-section" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background" aria-labelledby="storefront-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Visual */}
              <div className="relative order-2 lg:order-1">
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
              </div>

              {/* Right Content */}
              <div className="space-y-6 order-1 lg:order-2">
                <Badge variant="premium" className="mb-2">
                  AI-Generated Storefronts
                </Badge>
                <h2 id="storefront-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                  Beautiful Websites That <span className="text-primary">Drive Traffic</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We automatically generate professional storefronts and product pages that rank on Google and answer AI assistants. Drive organic traffic without hiring developers or SEO experts.
                </p>

                <div className="space-y-4 pt-4">
                  <div id="storefront-benefit-seo" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">SEO-Friendly Architecture</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized meta tags, structured data, and semantic HTML ensure your products rank high on search engines.
                      </p>
                    </div>
                  </div>

                  <div id="storefront-benefit-aeo" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                    <CheckCircle2 className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">AEO-Ready Content</h4>
                      <p className="text-sm text-muted-foreground">
                        Optimized for AI search engines (ChatGPT, Perplexity). Your products appear when buyers ask AI for recommendations.
                      </p>
                    </div>
                  </div>

                  <div id="storefront-benefit-traffic" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                    <CheckCircle2 className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Organic Traffic Growth</h4>
                      <p className="text-sm text-muted-foreground">
                        Watch as qualified leads find you organically through search engines and AI assistants, reducing your outreach costs.
                      </p>
                    </div>
                  </div>

                  <div id="storefront-benefit-analytics" className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20">
                    <CheckCircle2 className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Built-In Analytics</h4>
                      <p className="text-sm text-muted-foreground">
                        Track page views, visitor behavior, and conversion rates. Understand which products generate the most interest.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  id="storefront-cta-button"
                  size="lg" 
                  className="h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20"
                  onClick={() => {
                    const heroForm = document.getElementById('hero-email-input');
                    heroForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => (heroForm as HTMLInputElement)?.focus(), 500);
                  }}
                >
                  Create Your Storefront
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Security Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden" aria-labelledby="security-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-primary/5 to-background" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Security & Compliance
            </Badge>
            <h2 id="security-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Your data security and privacy are our top priorities
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
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
                <div
                  key={index}
                  className="text-center p-8 rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto bg-card/50 backdrop-blur-sm py-3 px-6 rounded-full inline-block border border-white/10">
                We use industry-standard encryption and security practices to protect your data. 
                All communications are encrypted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative" aria-labelledby="testimonials-heading">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.05),transparent)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Testimonials
            </Badge>
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              See what our customers say about Pitchivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
            ].map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 hover:bg-card/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 p-8 flex flex-col"
                >
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-base text-foreground/80 mb-8 leading-relaxed italic flex-1">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-border/30">
                    <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-base text-foreground">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden" aria-labelledby="pricing-heading">
        <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4 shadow-lg shadow-primary/20 border-primary/20 backdrop-blur-md">
              Pricing
            </Badge>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Plans That Scale With You
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              Try free. Upgrade anytime. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
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
                <div
                  key={index}
                  className={cn(
                    "rounded-3xl bg-card/30 backdrop-blur-xl border border-white/10 dark:border-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 flex flex-col relative p-8 group",
                    plan.popular && "bg-gradient-to-b from-primary/10 to-card/30 border-primary/30 shadow-xl shadow-primary/5"
                  )}
                >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-lg shadow-primary/25 bg-gradient-accent text-white px-4 py-1 border-none">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className="pb-8 border-b border-border/30 mb-8">
                  <h3 className={cn("text-xl font-bold mb-2", plan.popular ? "text-primary" : "text-foreground")}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground font-medium">{plan.period}</span>}
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <ul className="space-y-4 flex-1 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-sm">
                        <div className={cn("rounded-full p-0.5 mt-0.5 shrink-0", plan.popular ? "bg-primary/20" : "bg-muted")}>
                          <CheckCircle2 className={cn("h-3.5 w-3.5", plan.popular ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={cn("mt-auto", plan.popular && "[&>button]:bg-gradient-accent [&>button]:text-white [&>button]:shadow-lg [&>button:hover]:shadow-primary/25")}>
                    {plan.cta}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
