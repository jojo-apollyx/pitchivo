import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Users, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Pitchivo - AI-powered B2B outreach platform for ingredient suppliers",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Pitchivo
                </span>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="premium" className="mb-4 transition-all duration-300 hover:scale-[1.02]">
                About Us
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Building the Future of B2B Outreach
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                We're on a mission to help ingredient suppliers reach verified buyers faster and more effectively.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-12 sm:py-16 lg:py-20 border-b border-border/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="space-y-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Pitchivo was born from a simple observation: ingredient suppliers spend too much time on manual outreach 
                  and not enough time closing deals. We believe AI can transform how B2B suppliers connect with buyers, 
                  making the process faster, smarter, and more effective.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">What We Do</h2>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                  We provide an AI-powered platform that helps ingredient suppliers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                      className="bg-background/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group"
                    >
                      <div className="mb-4">
                        <div className="inline-flex p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                          <item.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Values</h2>
                <div className="space-y-4">
                  <div className="p-4 sm:p-6 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                    <h3 className="font-semibold text-lg mb-2">Simplicity First</h3>
                    <p className="text-sm text-muted-foreground">
                      We believe powerful tools should be simple to use. No complex dashboards, no overwhelming features—just what you need to succeed.
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                    <h3 className="font-semibold text-lg mb-2">Results-Driven</h3>
                    <p className="text-sm text-muted-foreground">
                      Every feature we build is designed to help you close more deals. We measure success by your success.
                    </p>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                    <h3 className="font-semibold text-lg mb-2">Privacy & Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is yours. We're GDPR and CCPA compliant, and we take security seriously.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 sm:p-12 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                Join ingredient suppliers who are already using Pitchivo to scale their outreach.
              </p>
              <Link href="/">
                <Button size="lg" className="h-12 sm:h-14 px-8 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

