import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pitchivo Terms of Service - Read our terms and conditions",
};

export default function TermsPage() {
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

        {/* Content */}
        <section className="py-12 sm:py-16 lg:py-20 border-b border-border/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="mb-12">
              <Badge variant="premium" className="mb-4 transition-all duration-300 hover:scale-[1.02]">
                Legal
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  By accessing and using Pitchivo ("the Service"), you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  Permission is granted to temporarily use Pitchivo for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on Pitchivo</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  You are responsible for maintaining the confidentiality of your account and password. You agree to 
                  accept responsibility for all activities that occur under your account or password.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">4. Service Availability</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  We strive to provide continuous availability of the Service, but we do not guarantee uninterrupted 
                  access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">5. Prohibited Uses</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  You may not use the Service:
                </p>
                <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground ml-4">
                  <li>In any way that violates any applicable law or regulation</li>
                  <li>To transmit any malicious code or viruses</li>
                  <li>To spam or send unsolicited communications</li>
                  <li>To impersonate or attempt to impersonate another user or entity</li>
                </ul>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  The Service and its original content, features, and functionality are owned by Pitchivo and are 
                  protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  In no event shall Pitchivo, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages, including without 
                  limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  We reserve the right to modify these terms at any time. We will notify users of any changes by posting 
                  the new Terms of Service on this page and updating the "Last updated" date.
                </p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h2 className="text-2xl font-bold mb-4">9. Contact Information</h2>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@pitchivo.com" className="text-primary hover:underline transition-colors duration-300">
                    legal@pitchivo.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

