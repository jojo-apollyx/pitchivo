"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BorderBeam } from "@/components/ui/border-beam";
import { createClient } from "@/lib/supabase/client";

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check email domain status from database
async function checkEmailDomainStatus(email: string): Promise<'public' | 'blocked' | 'allowed'> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'allowed';

  const supabase = createClient();
  const { data, error } = await supabase
    .from('email_domains')
    .select('status')
    .eq('domain', domain)
    .single();

  if (error || !data) {
    return 'allowed';
  }

  return data.status as 'public' | 'blocked' | 'allowed';
}

// Check if email is in invited_emails table
async function isInvitedEmail(email: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invited_emails')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    console.error('Error checking invited email:', error);
    return false;
  }

  return !!data;
}

interface HeroEmailFormProps {
  onOpenWaitlist: (email: string) => void;
}

export function HeroEmailForm({ onOpenWaitlist }: HeroEmailFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Check email domain status in database
      const domainStatus = await checkEmailDomainStatus(email);
      
      if (domainStatus === 'public') {
        toast.error("Company Email Required", {
          description: "Please use your company email address. Public email domains (Gmail, Yahoo, etc.) are not accepted.",
        });
        setIsLoading(false);
        return;
      }

      if (domainStatus === 'blocked') {
        toast.error("Domain Blocked", {
          description: "This email domain has been blocked and cannot be used to sign up.",
        });
        setIsLoading(false);
        return;
      }

      const invited = await isInvitedEmail(email);
      if (!invited) {
        toast(
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg">🎉</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">Join Our Waitlist!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;re currently in private beta. Join the waitlist to get early access when we launch.
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            action: {
              label: "Join Waitlist",
              onClick: () => onOpenWaitlist(email),
            },
          }
        );
        setIsLoading(false);
        onOpenWaitlist(email);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Failed to send magic link", {
          description: error.message,
        });
      } else {
        toast.success("Magic link sent!", {
          description: "Check your email for a login link.",
        });
        setEmail("");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="hero-cta-form" onSubmit={handleMagicLinkSubmit} className="mt-10">
      <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
        <Input
          id="hero-email-input"
          type="email"
          placeholder="Enter your company email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="!h-16 sm:!h-14 flex-1 text-base bg-background/95 backdrop-blur-sm border-border/50 shadow-sm px-4 py-3"
          disabled={isLoading}
          aria-label="Company email address"
        />
        <Button
          id="hero-get-started-button"
          type="submit"
          size="lg"
          className="group relative overflow-hidden rounded-full h-12 sm:h-14 px-8 text-base font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20 shadow-lg"
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center">
            {isLoading ? "Sending..." : "Get Started"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </span>
          <BorderBeam size={70} duration={3} delay={0} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </div>
    </form>
  );
}

