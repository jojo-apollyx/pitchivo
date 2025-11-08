"use client";

import { useRef, useState } from "react";
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

// Public email domains to block
const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "mail.com",
  "yandex.com",
  "zoho.com",
];

// Check if email is from public domain
function isPublicEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return PUBLIC_EMAIL_DOMAINS.includes(domain || "");
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check if email is in invited list (placeholder - replace with actual API call)
function isInvitedEmail(_email: string): Promise<boolean> {
  // TODO: Replace with actual API call to check invite list
  // For now, return false to show waitlist flow
  return Promise.resolve(false);
}

// Send magic link
async function sendMagicLink(email: string) {
  try {
    if (typeof globalThis.window === 'undefined') {
      throw new Error('This function must be called on the client side')
    }

    const { createClient } = await import('@supabase/supabase-js')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const client = createClient(supabaseUrl, supabaseKey)

    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${globalThis.window.location.origin}/auth/callback`,
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const client = createClient(supabaseUrl, supabaseKey)

    const { error } = await client.from("waitlist").insert({
      email: data.email,
      full_name: data.fullName,
      company: data.company,
      role: data.role || null,
      note: data.note || null,
    });

    if (error) throw error;

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

// Structured Data for SEO/AEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://pitchivo.com/#website",
      url: "https://pitchivo.com/",
      name: "Pitchivo",
      description:
        "AI-powered B2B outreach platform for ingredient suppliers",
      publisher: {
        "@id": "https://pitchivo.com/#organization",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://pitchivo.com/#organization",
      name: "Pitchivo",
      url: "https://pitchivo.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://pitchivo.com/logo.png",
      },
      sameAs: ["https://twitter.com/pitchivo", "https://linkedin.com/company/pitchivo"],
    },
    {
      "@type": "SoftwareApplication",
      name: "Pitchivo",
      applicationCategory: "BusinessApplication",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "999",
        priceCurrency: "USD",
        offerCount: "4",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: "3",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Pitchivo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pitchivo is an AI-powered B2B outreach platform that transforms ingredient specs into professional product pages and helps suppliers reach verified buyers through smart email campaigns.",
          },
        },
        {
          "@type": "Question",
          name: "How does Pitchivo work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Upload your product specs, connect to buyer databases, launch personalized campaigns, track analytics, and receive RFQs - all automated with AI.",
          },
        },
        {
          "@type": "Question",
          name: "What industries does Pitchivo serve?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pitchivo serves food ingredients, dietary supplements, and chemical suppliers looking to scale their B2B outreach.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistData, setWaitlistData] = useState({
    fullName: "",
    company: "",
    role: "",
    note: "",
  });
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const pricingRef = useRef<HTMLElement>(null);
  const { theme, setTheme } = useTheme();

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

            if (isPublicEmail(email)) {
              toast.error("Company Email Required", {
                description: "We only accept company email addresses for early access.",
                action: {
                  label: "Join Waitlist Instead",
                  onClick: () => setWaitlistOpen(true),
                },
              });
              return;
            }

    setIsLoading(true);

    try {
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
                        We're currently in early access. Join our waitlist to get notified when we open up.
                      </p>
                      <button
                        onClick={() => {
                          setWaitlistData({ fullName: "", company: "", role: "", note: "" });
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

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!waitlistData.fullName.trim() || !waitlistData.company.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingWaitlist(true);

    const success = await addToWaitlist({
      email,
      fullName: waitlistData.fullName,
      company: waitlistData.company,
      role: waitlistData.role || undefined,
      note: waitlistData.note || undefined,
    });

    if (success) {
      setWaitlistOpen(false);
      setWaitlistData({
        fullName: "",
        company: "",
        role: "",
        note: "",
      });
      setEmail("");
    }

    setIsSubmittingWaitlist(false);
  };

  return (
    <>
      {/* Structured Data for SEO/AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen relative">
        {/* Aurora Background - covers header and hero section */}
        <div className="bg-aurora" aria-hidden="true" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Pitchivo</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex hover:bg-primary/10 transition-colors font-medium"
                onClick={scrollToPricing}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 p-0"
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
              
              {/* Headline */}
              <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="text-foreground">Upload. Connect.</span>
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-dark via-primary to-primary-dark">
                  Pitch Smarter.
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl sm:text-2xl text-foreground/80 dark:text-foreground/90 leading-relaxed font-medium">
                Turn your ingredient specs into AI-generated product pages and reach verified
                buyers — instantly.
              </p>

              {/* CTA Form */}
              <form onSubmit={handleMagicLinkSubmit} className="mt-10">
                <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Enter your company email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="!h-16 sm:!h-14 flex-1 text-base bg-background/95 backdrop-blur-sm border-border/50 shadow-sm px-4 py-3"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 sm:h-14 px-8 text-base font-semibold hover-scale shadow-lg"
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
      <section className="py-20 sm:py-24 lg:py-32 bg-transparent relative" aria-labelledby="how-it-works-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              How It Works
            </Badge>
            <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Simple Process, Powerful Results
            </h2>
            <p className="text-lg text-muted-foreground">
              From upload to buyer engagement — all in five easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Upload Product Files",
                description: "Upload PDFs or spec sheets. Our AI extracts ingredients, features, and certifications to generate SEO-optimized product pages.",
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
                <Card 
                  variant="premium" 
                  className="h-full hover-lift group"
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
                </Card>

                {/* Connector Arrow */}
                {index < 2 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Core Features
            </Badge>
            <h2 id="features-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-lg text-muted-foreground">
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
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm hover:border-primary/30 hover:from-primary/10 hover:via-card/80 hover:to-primary/5 transition-all duration-500 hover-lift"
              >
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
              </div>
            ))}
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
            <h2 id="security-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-muted-foreground">
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
                <Card
                  key={index}
                  variant="premium"
                  className="text-center p-6 hover-lift group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                We use industry-standard encryption and security practices to protect your data. 
                All communications are encrypted, and we're fully compliant with international data protection regulations.
              </p>
            </div>
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
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-lg text-muted-foreground">
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
              <Card
                key={index}
                variant="premium"
                className="hover-lift"
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/5 via-background to-background" aria-labelledby="pricing-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="premium" className="mb-4">
              Pricing
            </Badge>
            <h2 id="pricing-heading" className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Plans That Scale With You
            </h2>
            <p className="text-lg text-muted-foreground">
              Try free. Upgrade anytime. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free Trial",
                price: "$0",
                period: "/mo",
                features: [
                  "1 product page",
                  "50 cold emails",
                  "Basic analytics",
                  "Email support",
                ],
                popular: false,
              },
              {
                name: "Basic",
                price: "$299",
                period: "/mo",
                features: [
                  "5 product pages", 
                  "500 emails/month", 
                  "RFQ access",
                  "Priority support",
                ],
                popular: true,
              },
              {
                name: "Pro",
                price: "$999",
                period: "/mo",
                features: [
                  "20 product pages",
                  "2,000 emails/month",
                  "Priority database access",
                  "Monthly reports",
                  "API access",
                ],
                popular: false,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                features: [
                  "Unlimited pages",
                  "Unlimited emails",
                  "Dedicated database",
                  "SLA guarantee",
                  "Custom integrations",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <Card
                key={index}
                variant={plan.popular ? "premium" : "default"}
                className={cn(
                  "transition-all duration-300 hover-lift flex flex-col relative",
                  plan.popular && "border-primary/50 ring-2 ring-primary/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
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
                  <Button
                    className="w-full h-11 font-semibold hover-scale"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {index === 3 ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-gradient-to-b from-background to-background/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Pitchivo</span>
              </div>
              <p className="text-base text-muted-foreground max-w-sm">
                AI-powered B2B outreach platform for suppliers, exporters, and manufacturers who want results — not spreadsheets.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Features
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={scrollToPricing}>
                    Pricing
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    FAQ
                  </Button>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Contact Us
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    About Us
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 border-t border-border/50">
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
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join the Waitlist</DialogTitle>
            <DialogDescription>
              We're onboarding early suppliers in the food & supplement ingredient industry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWaitlistSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={waitlistData.fullName}
                  onChange={(e) =>
                    setWaitlistData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                  className="mt-1 h-11 touch-manipulation"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Company / Organization <span className="text-destructive">*</span>
                </label>
                <Input
                  value={waitlistData.company}
                  onChange={(e) =>
                    setWaitlistData((prev) => ({ ...prev, company: e.target.value }))
                  }
                  placeholder="Acme Inc."
                  className="mt-1 h-11 touch-manipulation"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  value={email}
                  disabled
                  className="mt-1 h-11 bg-muted"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Role / Title</label>
                <Input
                  value={waitlistData.role}
                  onChange={(e) =>
                    setWaitlistData((prev) => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="Product Manager"
                  className="mt-1 h-11 touch-manipulation"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Tell us why you want early access
                </label>
                <textarea
                  value={waitlistData.note}
                  onChange={(e) =>
                    setWaitlistData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Optional message..."
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWaitlistOpen(false)}
                disabled={isSubmittingWaitlist}
                className="h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingWaitlist}
                className="h-11"
              >
                {isSubmittingWaitlist ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
