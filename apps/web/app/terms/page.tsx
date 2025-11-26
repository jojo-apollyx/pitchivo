import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pitchivo Terms of Service - Read our terms and conditions",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="relative">
        {/* Header */}
        <nav id="terms-navigation" className="sticky top-0 z-50 border-b border-border/30 bg-background/98 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between">
              <Link 
                id="terms-nav-logo-link"
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
                  id="terms-nav-back-button"
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
        <section id="terms-hero-section" className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="mb-12">
              <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
                Legal
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-foreground">
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section id="terms-content-section" className="py-16 sm:py-20 lg:py-24 bg-background-secondary">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="space-y-6">
              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using Pitchivo ("the Service"), you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Use License</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Permission is granted to temporarily use Pitchivo for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on Pitchivo</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to 
                  accept responsibility for all activities that occur under your account or password.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to provide continuous availability of the Service, but we do not guarantee uninterrupted 
                  access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Prohibited Uses</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You may not use the Service:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>In any way that violates any applicable law or regulation</li>
                  <li>To transmit any malicious code or viruses</li>
                  <li>To spam or send unsolicited communications</li>
                  <li>To impersonate or attempt to impersonate another user or entity</li>
                </ul>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Service and its original content, features, and functionality are owned by Pitchivo and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall Pitchivo, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
                  limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any changes by posting 
                  the new Terms of Service on this page and updating the "Last updated" date.
                </p>
              </div>

              <div className="bg-background rounded-lg p-6 sm:p-8">
                <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@pitchivo.com" className="text-primary-dark hover:underline transition-colors duration-200">
                    legal@pitchivo.com
                  </a>
                  .
                </p>
                <div className="mt-4 pt-4 border-t border-border/30">
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
    </main>
  );
}
