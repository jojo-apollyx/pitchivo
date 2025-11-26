import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Pitchivo - AI-powered B2B outreach platform for ingredient suppliers",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative">
        {/* Header */}
        <nav id="about-navigation" className="sticky top-0 z-50 border-b border-border/30 bg-background/98 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between">
              <Link 
                id="about-nav-logo-link"
                href="/" 
                className="flex items-center gap-3"
                aria-label="Pitchivo home"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-dark transition-colors duration-200 hover:bg-primary-darker">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-foreground tracking-tight">
                  Pitchivo
                </span>
              </Link>
              <Link href="/">
                <Button 
                  id="about-nav-back-button"
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 h-10 rounded-md hover:bg-background-secondary"
                  aria-label="Go back to home"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="about-hero-section" className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="text-center mb-16">
              <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
                About Us
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-foreground">
                Building the Future of B2B Outreach
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                We're on a mission to help ingredient suppliers reach verified buyers faster and more effectively.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="about-mission-section" className="py-16 sm:py-20 lg:py-24 bg-background-secondary">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="space-y-12">
              <div className="bg-background rounded-lg p-8">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Pitchivo was born from a simple observation: ingredient suppliers spend too much time on manual outreach 
                  and not enough time closing deals. We believe AI can transform how B2B suppliers connect with buyers, 
                  making the process faster, smarter, and more effective.
                </p>
              </div>

              <div className="bg-background rounded-lg p-8">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">What We Do</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  We provide an AI-powered platform that helps ingredient suppliers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Zap,
                      title: "Automate Product Pages",
                      description: "Transform specs into professional product pages instantly",
                    },
                    {
                      icon: Target,
                      title: "Reach Verified Buyers",
                      description: "Connect with pre-verified buyers in your industry",
                    },
                    {
                      icon: Users,
                      title: "Track Everything",
                      description: "See exactly what buyers are engaging with",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-background-secondary rounded-lg p-6 hover:bg-accent-surface transition-colors duration-200 group"
                    >
                      <div className="mb-4">
                        <div className="inline-flex p-3 bg-accent-surface rounded-md group-hover:bg-primary-dark/10 transition-colors duration-200">
                          <item.icon className="h-6 w-6 text-primary-dark" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background rounded-lg p-8">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-6 text-foreground">Our Values</h2>
                <div className="space-y-4">
                  <div className="p-5 rounded-lg bg-background-secondary hover:bg-accent-surface transition-colors duration-200">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Simplicity First</h3>
                    <p className="text-muted-foreground">
                      We believe powerful tools should be simple to use. No complex dashboards, no overwhelming features—just what you need to succeed.
                    </p>
                  </div>
                  <div className="p-5 rounded-lg bg-background-secondary hover:bg-accent-surface transition-colors duration-200">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Results-Driven</h3>
                    <p className="text-muted-foreground">
                      Every feature we build is designed to help you close more deals. We measure success by your success.
                    </p>
                  </div>
                  <div className="p-5 rounded-lg bg-background-secondary hover:bg-accent-surface transition-colors duration-200">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">Privacy & Security</h3>
                    <p className="text-muted-foreground">
                      Your data is yours. We're GDPR and CCPA compliant, and we take security seriously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="about-cta-section" className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl text-center">
            <div className="bg-accent-surface rounded-lg p-10 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-foreground">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join B2B suppliers who are already using Pitchivo to scale their outreach.
              </p>
              <Link href="/">
                <Button 
                  id="about-get-started-button"
                  size="lg" 
                  className="h-12 px-8 rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
                  aria-label="Get started with Pitchivo"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
