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
} from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10" />
        
        {/* Sloped Lines Background */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              hsl(var(--primary-light)) 20px,
              hsl(var(--primary-light)) 21px
            )`,
          }}
        />
        
        {/* Vector Shapes */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-light/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Pitchville</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex hover:bg-primary-light/20 transition-colors"
                onClick={scrollToPricing}
              >
                Pricing
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-primary-light/20 transition-colors">
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Upload. Connect. Pitch Smarter.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg lg:text-xl">
              Turn your ingredient specs into AI-generated product pages and reach verified
              buyers — instantly.
            </p>

            {/* Magic Link Input */}
            <form onSubmit={handleMagicLinkSubmit} className="mt-8">
              <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Enter your company email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 flex-1 touch-manipulation"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-[44px] touch-manipulation transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/30"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Get Magic Link 🔑"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border/50 bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            How Pitchville Works
          </h2>

          <div className="mt-12 space-y-8 sm:mt-16">
            {/* Step 1 */}
            <div className="flex gap-4 transition-all duration-300 hover:translate-x-2 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
                <span className="text-lg font-semibold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Upload your product files
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Upload product PDFs or spec sheets — our AI automatically extracts ingredients,
                  features, and certifications, then generates a clean, SEO-friendly product page
                  optimized for search and buyers.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 transition-all duration-300 hover:translate-x-2 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
                <span className="text-lg font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Connect to your industry buyer database
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Choose from pre-curated buyer databases for your industry (e.g. Food
                  Ingredients, Dietary Supplements). The system automatically matches your products
                  with verified potential buyers.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 transition-all duration-300 hover:translate-x-2 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
                <span className="text-lg font-semibold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Launch your outreach campaign
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  Pitchville sends personalized cold emails to your selected buyers over time — no
                  spam, no setup headaches. You can control the number of emails and schedule them
                  across days or weeks.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 transition-all duration-300 hover:translate-x-2 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
                <span className="text-lg font-semibold">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Track every interaction
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  View precise analytics for each campaign: Email opened, link clicked, viewed
                  fields, QR-code entry tracking, RFQ forms submitted. Every detail is logged for
                  you to optimize future outreach.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4 transition-all duration-300 hover:translate-x-2 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary-dark">
                <span className="text-lg font-semibold">5</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Receive real RFQs from verified buyers
                </h3>
                <p className="mt-2 text-base text-muted-foreground">
                  When a buyer fills out your RFQ form, you get notified instantly — no manual
                  follow-up needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="border-t border-border/50 bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
            Core Features
          </h2>

          <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
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
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20 hover:-translate-y-1 hover:border-primary-light/50 cursor-pointer group active:scale-[0.98]"
              >
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:text-primary-dark" />
                  <CardTitle className="text-lg sm:text-xl group-hover:text-primary-dark transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="border-t border-border/50 bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
              Pricing Snapshot
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Try free. Upgrade anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Free Trial",
                price: "$0/mo",
                features: [
                  "1 product page",
                  "50 cold emails",
                  "1 hidden RFQ (upgrade to view)",
                ],
              },
              {
                name: "Basic",
                price: "$299/mo",
                features: ["5 product pages", "500 emails", "RFQ access"],
              },
              {
                name: "Pro",
                price: "$999/mo",
                features: [
                  "20 pages",
                  "2,000 emails",
                  "Priority database access",
                  "Monthly report",
                ],
              },
              {
                name: "Enterprise",
                price: "Custom",
                features: [
                  "Dedicated database",
                  "SLA",
                  "API integration",
                ],
              },
            ].map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  "border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20 hover:-translate-y-1 hover:border-primary-light/50 flex flex-col",
                  index === 1 && "border-primary/50 shadow-lg ring-2 ring-primary-light/20"
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-semibold text-foreground">{plan.price}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full min-h-[44px] touch-manipulation transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    variant={index === 1 ? "default" : "outline"}
                  >
                    {index === 3 ? "Contact Sales" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button variant="link" className="text-base">
              View Pricing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">Pitchville</span>
            </div>
            <p className="mt-4 text-base text-muted-foreground">
              AI for B2B Outreach
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Built for suppliers, exporters, and manufacturers who want results — not spreadsheets.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm">
                About
              </Button>
              <Button variant="ghost" size="sm">
                Privacy
              </Button>
              <Button variant="ghost" size="sm">
                Terms
              </Button>
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </div>

            <div className="mt-8">
              <p className="text-sm text-muted-foreground">Have an invite?</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 min-h-[44px] touch-manipulation transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-light/20"
              >
                Sign In with Magic Link
              </Button>
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
