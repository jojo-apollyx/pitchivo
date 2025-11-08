import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// FAQ Structured Data for SEO/AEO
const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Pitchivo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pitchivo is an AI-powered B2B outreach platform that transforms ingredient specs into professional product pages and helps suppliers reach verified buyers through smart email campaigns. It automates the entire process from product page generation to buyer matching and campaign tracking.",
      },
    },
    {
      "@type": "Question",
      name: "How does Pitchivo work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pitchivo works in five simple steps: 1) Upload your product PDFs or spec sheets, 2) AI automatically extracts ingredients and generates SEO-optimized product pages, 3) Connect to pre-curated buyer databases for your industry, 4) Launch personalized cold email campaigns, 5) Track analytics and receive RFQs from verified buyers.",
      },
    },
    {
      "@type": "Question",
      name: "What industries does Pitchivo serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pitchivo is designed for ingredient suppliers in the food ingredients, dietary supplements, and chemical industries. It's perfect for suppliers, exporters, and manufacturers looking to scale their B2B outreach.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Pitchivo cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pitchivo offers a free trial with 1 product page and 50 cold emails. Paid plans start at $299/month for Basic (5 product pages, 500 emails), $999/month for Pro (20 pages, 2,000 emails), and custom pricing for Enterprise. All plans include RFQ access and analytics.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need technical knowledge to use Pitchivo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No technical knowledge is required. Pitchivo is designed to be simple and intuitive. Just upload your product files, and our AI handles the rest - from generating product pages to matching you with verified buyers.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is the AI-generated product page?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our AI is trained specifically on ingredient specifications and product data. It automatically extracts ingredients, features, certifications, and technical details from PDFs and spec sheets with high accuracy. You can review and edit any generated content before publishing.",
      },
    },
    {
      "@type": "Question",
      name: "Where do the buyer databases come from?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our buyer databases are pre-curated and industry-specific, containing verified buyers in food ingredients, dietary supplements, and related industries. The databases are regularly updated and maintained to ensure accuracy and relevance.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize the email campaigns?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you have full control over your email campaigns. You can customize email templates, schedule send times, control the number of emails sent, and personalize messages. The AI helps optimize content, but you maintain full control.",
      },
    },
    {
      "@type": "Question",
      name: "What analytics does Pitchivo provide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pitchivo provides comprehensive analytics including email open rates, click-through rates, page views, field-level engagement tracking, QR code scans, and RFQ submissions. You can see exactly which buyers are engaging with your products and when.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Pitchivo uses enterprise-grade security with 256-bit SSL/TLS encryption, encrypted data storage, and regular security audits. We're GDPR and CCPA compliant, and your data is never shared with third parties without your consent.",
      },
    },
    {
      "@type": "Question",
      name: "Can I integrate Pitchivo with my existing CRM?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Pitchivo offers API access for Pro and Enterprise plans, allowing you to integrate with your existing CRM and other business tools. Enterprise plans include custom integrations and dedicated support.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a buyer submits an RFQ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When a buyer submits an RFQ through your product page, you receive an instant email notification with all the buyer's details and requirements. You can then follow up directly with the buyer to close the deal.",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description:
    "Find answers to common questions about Pitchivo - AI-powered B2B outreach platform for ingredient suppliers. Learn about pricing, features, security, and how it works.",
  keywords: [
    "Pitchivo FAQ",
    "B2B outreach questions",
    "ingredient supplier platform",
    "AI product pages FAQ",
    "buyer database questions",
    "campaign analytics FAQ",
  ],
  openGraph: {
    title: "FAQ - Pitchivo",
    description: "Frequently asked questions about Pitchivo - AI-powered B2B outreach for ingredient suppliers",
    type: "website",
  },
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Pitchivo?",
      answer:
        "Pitchivo is an AI-powered B2B outreach platform that transforms ingredient specs into professional product pages and helps suppliers reach verified buyers through smart email campaigns. It automates the entire process from product page generation to buyer matching and campaign tracking.",
    },
    {
      question: "How does Pitchivo work?",
      answer:
        "Pitchivo works in five simple steps: 1) Upload your product PDFs or spec sheets, 2) AI automatically extracts ingredients and generates SEO-optimized product pages, 3) Connect to pre-curated buyer databases for your industry, 4) Launch personalized cold email campaigns, 5) Track analytics and receive RFQs from verified buyers.",
    },
    {
      question: "What industries does Pitchivo serve?",
      answer:
        "Pitchivo is designed for ingredient suppliers in the food ingredients, dietary supplements, and chemical industries. It's perfect for suppliers, exporters, and manufacturers looking to scale their B2B outreach.",
    },
    {
      question: "How much does Pitchivo cost?",
      answer:
        "Pitchivo offers a free trial with 1 product page and 50 cold emails. Paid plans start at $299/month for Basic (5 product pages, 500 emails), $999/month for Pro (20 pages, 2,000 emails), and custom pricing for Enterprise. All plans include RFQ access and analytics.",
    },
    {
      question: "Do I need technical knowledge to use Pitchivo?",
      answer:
        "No technical knowledge is required. Pitchivo is designed to be simple and intuitive. Just upload your product files, and our AI handles the rest - from generating product pages to matching you with verified buyers.",
    },
    {
      question: "How accurate is the AI-generated product page?",
      answer:
        "Our AI is trained specifically on ingredient specifications and product data. It automatically extracts ingredients, features, certifications, and technical details from PDFs and spec sheets with high accuracy. You can review and edit any generated content before publishing.",
    },
    {
      question: "Where do the buyer databases come from?",
      answer:
        "Our buyer databases are pre-curated and industry-specific, containing verified buyers in food ingredients, dietary supplements, and related industries. The databases are regularly updated and maintained to ensure accuracy and relevance.",
    },
    {
      question: "Can I customize the email campaigns?",
      answer:
        "Yes, you have full control over your email campaigns. You can customize email templates, schedule send times, control the number of emails sent, and personalize messages. The AI helps optimize content, but you maintain full control.",
    },
    {
      question: "What analytics does Pitchivo provide?",
      answer:
        "Pitchivo provides comprehensive analytics including email open rates, click-through rates, page views, field-level engagement tracking, QR code scans, and RFQ submissions. You can see exactly which buyers are engaging with your products and when.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, Pitchivo uses enterprise-grade security with 256-bit SSL/TLS encryption, encrypted data storage, and regular security audits. We're GDPR and CCPA compliant, and your data is never shared with third parties without your consent.",
    },
    {
      question: "Can I integrate Pitchivo with my existing CRM?",
      answer:
        "Yes, Pitchivo offers API access for Pro and Enterprise plans, allowing you to integrate with your existing CRM and other business tools. Enterprise plans include custom integrations and dedicated support.",
    },
    {
      question: "What happens if a buyer submits an RFQ?",
      answer:
        "When a buyer submits an RFQ through your product page, you receive an instant email notification with all the buyer's details and requirements. You can then follow up directly with the buyer to close the deal.",
    },
  ];

  return (
    <>
      {/* FAQ Structured Data for SEO/AEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

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
            <div className="text-center mb-12">
              <Badge variant="premium" className="mb-4">
                FAQ
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about Pitchivo and how it can help scale your B2B outreach.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card
                  key={index}
                  variant="premium"
                  className="hover-lift"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                        <HelpCircle className="h-5 w-5 text-primary-dark" />
                      </div>
                      <CardTitle
                        className="text-lg sm:text-xl"
                        itemProp="name"
                      >
                        {faq.question}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-base text-muted-foreground leading-relaxed"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-12 text-center">
              <p className="text-base text-muted-foreground mb-6">
                Still have questions? We're here to help.
              </p>
              <Link href="/contact">
                <Button size="lg" className="h-12 sm:h-14 px-8">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

