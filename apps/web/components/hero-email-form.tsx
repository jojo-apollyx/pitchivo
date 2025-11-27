"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    .from('email_domain_policy')
    .select('status, is_public_domain')
    .eq('domain', domain)
    .maybeSingle();

  if (error || !data) {
    return 'allowed';
  }

  // Check if it's a public domain first
  if (data.is_public_domain === true) {
    return 'public';
  }

  // Map backend status to frontend status
  if (data.status === 'blocked') {
    return 'blocked';
  }

  // 'whitelisted' or 'allowed' both mean allowed
  if (data.status === 'whitelisted' || data.status === 'allowed') {
    return 'allowed';
  }

  return 'allowed';
}

// Check if email is invited (either on waitlist with status 'invited' or domain is whitelisted)
async function isInvitedEmail(email: string): Promise<boolean> {
  const supabase = createClient();
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check if domain is whitelisted
  const { data: domainPolicy, error: domainError } = await supabase
    .from('email_domain_policy')
    .select('status')
    .eq('domain', domain)
    .eq('status', 'whitelisted')
    .maybeSingle();

  if (domainError) {
    console.error('Error checking domain policy:', domainError);
  }

  if (domainPolicy) {
    return true;
  }

  // Check if email is on waitlist with status 'invited'
  const { data: waitlistEntry, error: waitlistError } = await supabase
    .from('waitlist')
    .select('status')
    .eq('email', email.toLowerCase())
    .eq('status', 'invited')
    .maybeSingle();

  if (waitlistError) {
    if (waitlistError.code === 'PGRST116') {
      return false;
    }
    console.error('Error checking waitlist:', waitlistError);
    return false;
  }

  return !!waitlistEntry;
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
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-accent-surface flex items-center justify-center">
              <span className="text-lg">🎉</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Join Our Waitlist!</p>
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
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('[Magic Link Request]', {
        timestamp: new Date().toISOString(),
        email: email.toLowerCase().trim(),
        redirect_url: redirectUrl,
        origin: window.location.origin,
        user_agent: navigator.userAgent,
        referrer: document.referrer || 'none'
      });

      const requestStart = Date.now()
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      const requestDuration = Date.now() - requestStart

      if (error) {
        console.error('[Magic Link Request] ❌ FAILED', {
          timestamp: new Date().toISOString(),
          duration_ms: requestDuration,
          email: email.toLowerCase().trim(),
          redirect_url: redirectUrl,
          error: {
            message: error.message,
            status: error.status,
            name: error.name
          },
          user_agent: navigator.userAgent,
          origin: window.location.origin
        });
        
        toast.error("Failed to send magic link", {
          description: error.message,
        });
      } else {
        console.log('[Magic Link Request] ✅ SUCCESS', {
          timestamp: new Date().toISOString(),
          duration_ms: requestDuration,
          email: email.toLowerCase().trim(),
          redirect_url: redirectUrl,
          message: 'Magic link email sent successfully',
          has_response_data: !!data,
          has_user: !!(data && data.user),
          has_session: !!(data && data.session)
        });
        
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
    <form id="hero-cta-form" onSubmit={handleMagicLinkSubmit} className="mt-8">
      <div className="flex max-w-lg flex-col gap-3 sm:flex-row">
        <Input
          id="hero-email-input"
          type="email"
          placeholder="Enter your company email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 sm:h-12 flex-1 text-base bg-background border-border rounded-md px-4 focus:border-primary-dark focus:ring-2 focus:ring-primary/20"
          disabled={isLoading}
          aria-label="Company email address"
        />
        <Button
          id="hero-get-started-button"
          type="submit"
          size="lg"
          className="h-12 px-6 text-base font-medium rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Get Started"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
