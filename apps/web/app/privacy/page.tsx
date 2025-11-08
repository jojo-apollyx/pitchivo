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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Pitchivo
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
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
            <Badge variant="premium" className="mb-4">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Commitment to Privacy</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                At Pitchivo, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our Service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <Card variant="premium">
                  <CardHeader>
                    <CardTitle className="text-lg">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      When you create an account, we collect your name, email address, company name, and any other 
                      information you provide during registration.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card variant="premium">
                  <CardHeader>
                    <CardTitle className="text-lg">Usage Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      We collect information about how you use the Service, including pages visited, features used, 
                      and interactions with the platform.
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card variant="premium">
                  <CardHeader>
                    <CardTitle className="text-lg">Product Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      When you upload product specifications, we process and store this data to generate product pages 
                      and match you with potential buyers.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground ml-4">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process transactions and send related information</li>
                <li>To send you technical notices and support messages</li>
                <li>To respond to your comments and questions</li>
                <li>To match your products with potential buyers</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <Card variant="premium">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-6 w-6 text-primary-dark" />
                    <CardTitle className="text-lg">Enterprise-Grade Security</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm space-y-2">
                    <p>
                      We implement industry-standard security measures to protect your data:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>256-bit SSL/TLS encryption for all data in transit</li>
                      <li>Encrypted data storage</li>
                      <li>Regular security audits and updates</li>
                      <li>Access controls and authentication</li>
                    </ul>
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div>
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

            <div>
              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain 
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We may use third-party services for analytics, payment processing, and email delivery. These services 
                have their own privacy policies governing the use of your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Data Retention</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this 
                Privacy Policy, unless a longer retention period is required by law.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:privacy@pitchivo.com" className="text-primary-dark hover:underline">
                  privacy@pitchivo.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

