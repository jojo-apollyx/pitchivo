import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        text: "Pitchivo offers a free plan with unlimited product listings and 30 emails per month. Paid plans start at $499/month for Basic (400 emails/month, 10 QR links per product), $1,999/month for Premium (2,000 emails/month, unlimited QR links), and custom pricing for Enterprise with unlimited emails and features.",
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
        "Pitchivo offers a free plan with unlimited product listings and 30 emails per month. Paid plans start at $499/month for Basic (400 emails/month, 10 QR links per product), $1,999/month for Premium (2,000 emails/month, unlimited QR links), and custom pricing for Enterprise with unlimited emails and features.",
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

      <main className="min-h-screen bg-background">
        <div className="relative">
          {/* Header */}
          <nav id="faq-navigation" className="sticky top-0 z-50 border-b border-border/30 bg-background/98 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-5 sm:px-8 lg:px-12">
              <div className="flex items-center justify-between">
                <Link 
                  id="faq-nav-logo-link"
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
                    id="faq-nav-back-button"
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
          <section id="faq-hero-section" className="py-16 sm:py-20 lg:py-24">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
              <div className="text-center mb-12">
                <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
                  FAQ
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-foreground">
                  Frequently Asked Questions
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Find answers to common questions about Pitchivo and how it can help scale your B2B outreach.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq-questions-section" className="py-16 sm:py-20 lg:py-24 bg-background-secondary">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    id={`faq-item-${index + 1}`}
                    className="bg-background rounded-lg p-6 hover:bg-accent-surface transition-colors duration-200 group"
                    itemScope
                    itemType="https://schema.org/Question"
                    role="article"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 p-2 rounded-md bg-accent-surface group-hover:bg-primary-dark/10 transition-colors duration-200">
                        <HelpCircle className="h-5 w-5 text-primary-dark" />
                      </div>
                      <h2
                        className="text-lg font-semibold text-foreground"
                        itemProp="name"
                      >
                        {faq.question}
                      </h2>
                    </div>
                    <div
                      className="text-muted-foreground leading-relaxed pl-12"
                      itemScope
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <span itemProp="text">{faq.answer}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Section */}
              <div id="faq-cta-section" className="mt-16 text-center">
                <div className="bg-accent-surface rounded-lg p-10">
                  <p className="text-lg text-muted-foreground mb-6">
                    Still have questions? We're here to help.
                  </p>
                  <Link href="/contact">
                    <Button 
                      id="faq-contact-us-button"
                      size="lg" 
                      className="h-12 px-8 rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
                      aria-label="Contact us for more information"
                    >
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
