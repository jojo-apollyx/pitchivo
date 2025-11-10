import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pitchivo Privacy Policy - Learn how we protect your data",
};

export default function PrivacyPage() {
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
            <div className="mb-12">
              <Badge variant="premium" className="mb-4 transition-all duration-300 hover:scale-[1.02]">
                Privacy & Security
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 sm:py-16 lg:py-20 border-b border-border/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="space-y-8">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Our Commitment to Privacy</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                At Pitchivo, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our Service.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                  <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                  <p className="text-sm text-muted-foreground">
                    When you create an account, we collect your name, email address, company name, and any other 
                    information you provide during registration.
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                  <h3 className="text-lg font-semibold mb-2">Usage Data</h3>
                  <p className="text-sm text-muted-foreground">
                    We collect information about how you use the Service, including pages visited, features used, 
                    and interactions with the platform.
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                  <h3 className="text-lg font-semibold mb-2">Product Data</h3>
                  <p className="text-sm text-muted-foreground">
                    When you upload product specifications, we process and store this data to generate product pages 
                    and match you with potential buyers.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground ml-4">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process transactions and send related information</li>
                <li>To send you technical notices and support messages</li>
                <li>To respond to your comments and questions</li>
                <li>To match your products with potential buyers</li>
              </ul>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary-light/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Enterprise-Grade Security</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-muted-foreground">
                  <li>256-bit SSL/TLS encryption for all data in transit</li>
                  <li>Encrypted data storage</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Under GDPR, CCPA, and other privacy laws, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain 
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We may use third-party services for analytics, payment processing, and email delivery. These services 
                have their own privacy policies governing the use of your information.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this 
                Privacy Policy, unless a longer retention period is required by law.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@pitchivo.com" className="text-primary hover:underline transition-colors duration-300">
                  privacy@pitchivo.com
                </a>
                .
              </p>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Pitchivo</strong>
                  <br />
                  4539 N 22ND ST, STE N
                  <br />
                  PHOENIX, AZ 85016
                  <br />
                  United States
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

