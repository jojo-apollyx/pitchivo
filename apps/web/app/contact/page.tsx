"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Send, Mail, MessageSquare, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Message sent!", {
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({
      name: "",
      email: "",
      company: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="relative">
        {/* Header */}
        <nav id="contact-navigation" className="sticky top-0 z-50 border-b border-border/30 bg-background/98 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between">
              <Link 
                id="contact-nav-logo-link"
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
                  id="contact-nav-back-button"
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
        <section id="contact-hero-section" className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="text-center mb-12">
              <span className="inline-flex items-center text-sm font-medium text-primary-dark px-3 py-1 bg-accent-surface rounded-md mb-6">
                Contact Us
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-foreground">
                Get in Touch
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Have questions? We're here to help. Reach out and we'll respond within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 sm:py-20 lg:py-24 bg-background-secondary">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Info */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg p-6 hover:bg-accent-surface transition-colors duration-200 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-accent-surface group-hover:bg-primary-dark/10 transition-colors duration-200">
                      <Mail className="h-5 w-5 text-primary-dark" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Email</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <a href="mailto:hello@pitchivo.com" className="text-primary-dark hover:underline transition-colors duration-200">
                      hello@pitchivo.com
                    </a>
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 hover:bg-accent-surface transition-colors duration-200 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-accent-surface group-hover:bg-primary-dark/10 transition-colors duration-200">
                      <MessageSquare className="h-5 w-5 text-primary-dark" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For technical support or questions about your account, email us at{" "}
                    <a href="mailto:support@pitchivo.com" className="text-primary-dark hover:underline transition-colors duration-200">
                      support@pitchivo.com
                    </a>
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 hover:bg-accent-surface transition-colors duration-200 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-accent-surface group-hover:bg-primary-dark/10 transition-colors duration-200">
                      <MapPin className="h-5 w-5 text-primary-dark" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Address</h3>
                  </div>
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

              {/* Contact Form */}
              <div className="bg-background rounded-lg p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Send us a message</h3>
                  <p className="text-sm text-muted-foreground">Fill out the form below and we'll get back to you soon.</p>
                </div>
                <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-form-name-input" className="text-sm font-medium text-foreground mb-1.5 block">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="contact-form-name-input"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="h-11"
                      aria-label="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-form-email-input" className="text-sm font-medium text-foreground mb-1.5 block">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="contact-form-email-input"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.com"
                      className="h-11"
                      aria-label="Your email address"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-form-company-input" className="text-sm font-medium text-foreground mb-1.5 block">
                      Company
                    </label>
                    <Input
                      id="contact-form-company-input"
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company Name"
                      className="h-11"
                      aria-label="Your company name"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-form-subject-input" className="text-sm font-medium text-foreground mb-1.5 block">
                      Subject <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="contact-form-subject-input"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="What's this about?"
                      className="h-11"
                      aria-label="Subject of your message"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-form-message-textarea" className="text-sm font-medium text-foreground mb-1.5 block">
                      Message <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="contact-form-message-textarea"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more..."
                      className="min-h-[120px]"
                      aria-label="Your message"
                      required
                    />
                  </div>

                  <Button
                    id="contact-form-submit-button"
                    type="submit"
                    className="w-full h-11 rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
                    disabled={isSubmitting}
                    aria-label={isSubmitting ? "Sending message" : "Send message"}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
