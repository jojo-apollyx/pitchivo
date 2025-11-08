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
} from "lucide-react";
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
      toast.error("Please use your company email", {
        description: "Public emails like Gmail are not allowed.",
        action: {
          label: "Join Waitlist",
          onClick: () => setWaitlistOpen(true),
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const invited = await isInvitedEmail(email);
      if (!invited) {
        toast.warning("This platform is invite-only", {
          description: "You can join the waitlist to request early access.",
          action: {
            label: "Join Waitlist →",
            onClick: () => {
              setWaitlistData((prev) => ({ ...prev, email }));
              setWaitlistOpen(true);
            },
          },
        });
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
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-mesh" aria-hidden="true" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-8 animate-fadeIn">
              {/* Badge */}
              <Badge variant="premium" className="text-sm px-4 py-1.5">
                AI-Powered B2B Outreach Platform
              </Badge>
              
              {/* Headline */}
              <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="text-foreground">Upload. Connect.</span>
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-primary/70">
                  Pitch Smarter.
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl sm:text-2xl text-muted-foreground dark:text-foreground/90 leading-relaxed max-w-3xl mx-auto">
                Turn your ingredient specs into AI-generated product pages and reach verified
                buyers — instantly.
              </p>

              {/* CTA Form */}
              <form onSubmit={handleMagicLinkSubmit} className="mt-10">
                <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="Enter your company email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 sm:h-14 flex-1 text-base"
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
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Free trial available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background" aria-labelledby="how-it-works-heading">
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

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 sm:py-24 lg:py-32 bg-background" aria-labelledby="pricing-heading">
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

            {/* Links */}
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

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    About
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Contact
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Privacy
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                    Terms
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWaitlistOpen(false)}
                disabled={isSubmittingWaitlist}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-h-[44px] touch-manipulation"
                disabled={isSubmittingWaitlist}
              >
                {isSubmittingWaitlist ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
