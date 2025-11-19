"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Send, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <nav id="contact-navigation" className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link 
                id="contact-nav-logo-link"
                href="/" 
                className="flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
                aria-label="Pitchivo home"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Pitchivo
                </span>
              </Link>
              <Link href="/">
                <Button 
                  id="contact-nav-back-button"
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
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
        <section id="contact-hero-section" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-12">
              <Badge variant="premium" className="mb-4 transition-all duration-300 hover:scale-[1.02]">
                Contact Us
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
                Get in Touch
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Have questions? We're here to help. Reach out and we'll respond within 24 hours.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 sm:py-16 lg:py-20 border-b border-border/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <Mail className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">Email</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <a href="mailto:hello@pitchivo.com" className="text-primary hover:underline transition-colors duration-300">
                      hello@pitchivo.com
                    </a>
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <MessageSquare className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For technical support or questions about your account, email us at{" "}
                    <a href="mailto:support@pitchivo.com" className="text-primary hover:underline transition-colors duration-300">
                      support@pitchivo.com
                    </a>
                  </p>
                </div>

                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                      <Mail className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">Address</h3>
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
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Send us a message</h3>
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
                      className="h-11 transition-all duration-300"
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
                      className="h-11 transition-all duration-300"
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
                      className="h-11 transition-all duration-300"
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
                      className="h-11 transition-all duration-300"
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
                      className="min-h-[120px] transition-all duration-300"
                      aria-label="Your message"
                      required
                    />
                  </div>

                  <Button
                    id="contact-form-submit-button"
                    type="submit"
                    className="w-full h-11 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
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

