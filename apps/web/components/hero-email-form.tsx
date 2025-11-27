"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient, createAuthClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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

type FormStep = 'email' | 'otp';

export function HeroEmailForm({ onOpenWaitlist }: HeroEmailFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formStep, setFormStep] = useState<FormStep>('email');

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        const toastId = toast(
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
            duration: 10000,
            action: {
              label: "Join Waitlist",
              onClick: () => {
                toast.dismiss(toastId);
                onOpenWaitlist(email);
              },
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Send OTP code to email
      const authClient = createAuthClient();
      
      console.log('[OTP Request]', {
        timestamp: new Date().toISOString(),
        email: email.toLowerCase().trim(),
        user_agent: navigator.userAgent,
      });

      const requestStart = Date.now();
      const { error } = await authClient.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          // Don't set emailRedirectTo - this makes Supabase send OTP code instead of magic link
          shouldCreateUser: true,
        },
      });
      const requestDuration = Date.now() - requestStart;

      if (error) {
        console.error('[OTP Request] ❌ FAILED', {
          timestamp: new Date().toISOString(),
          duration_ms: requestDuration,
          email: email.toLowerCase().trim(),
          error: {
            message: error.message,
            status: error.status,
            name: error.name
          },
        });
        
        toast.error("Failed to send verification code", {
          description: error.message,
        });
      } else {
        console.log('[OTP Request] ✅ SUCCESS', {
          timestamp: new Date().toISOString(),
          duration_ms: requestDuration,
          email: email.toLowerCase().trim(),
          message: 'OTP code sent successfully',
        });
        
        toast.success("Verification code sent!", {
          description: "Check your email for a 6-digit code.",
        });
        setFormStep('otp');
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);

    try {
      const authClient = createAuthClient();
      const supabase = createClient();

      console.log('[OTP Verify]', {
        timestamp: new Date().toISOString(),
        email: email.toLowerCase().trim(),
        otp_length: otpCode.length,
      });

      const verifyStart = Date.now();
      const { data, error } = await authClient.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otpCode,
        type: 'email',
      });
      const verifyDuration = Date.now() - verifyStart;

      if (error) {
        console.error('[OTP Verify] ❌ FAILED', {
          timestamp: new Date().toISOString(),
          duration_ms: verifyDuration,
          email: email.toLowerCase().trim(),
          error: {
            message: error.message,
            status: error.status,
            name: error.name
          },
        });
        
        toast.error("Verification failed", {
          description: error.message.includes('expired') 
            ? "The code has expired. Please request a new one."
            : error.message.includes('invalid')
            ? "Invalid code. Please check and try again."
            : error.message,
        });
        return;
      }

      if (!data.session || !data.user) {
        toast.error("Verification failed", {
          description: "Unable to create session. Please try again.",
        });
        return;
      }

      // Sync the session to the main cookie-based client
      const { error: syncError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (syncError) {
        console.error('[OTP Verify] ❌ SESSION_SYNC_FAILED', syncError);
      }

      console.log('[OTP Verify] ✅ SUCCESS', {
        timestamp: new Date().toISOString(),
        duration_ms: verifyDuration,
        user_id: data.user.id,
        user_email: data.user.email,
        session_synced: !syncError,
      });

      toast.success("Signed in successfully!");

      // Check if user has completed organization setup
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, domain, organization_id, org_role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        console.log('[OTP Verify] Profile not found, redirecting to setup');
        router.push('/setup/organization');
        return;
      }

      // Check organization onboarding status
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, onboarding_completed_at')
        .eq('domain', profile.domain)
        .not('onboarding_completed_at', 'is', null)
        .limit(1);

      const organization = organizations?.[0];
      const hasOrgOnboardingCompleted = !!organization?.onboarding_completed_at;
      const hasUserCompletedProfile = !!profile.org_role;

      if (!hasOrgOnboardingCompleted || !hasUserCompletedProfile) {
        router.push('/setup/organization');
      } else {
        router.push('/dashboard');
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setFormStep('email');
    setOtpCode('');
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const authClient = createAuthClient();
      const { error } = await authClient.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast.error("Failed to resend code", {
          description: error.message,
        });
      } else {
        toast.success("New code sent!", {
          description: "Check your email for a fresh 6-digit code.",
        });
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (formStep === 'otp') {
    return (
      <div className="mt-8 max-w-lg">
        <div className="mb-4">
          <button
            onClick={handleBackToEmail}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <Input
            id="otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="h-12 text-center text-2xl tracking-[0.5em] font-mono bg-background border-border rounded-md px-4 focus:border-primary-dark focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
            autoFocus
            aria-label="Verification code"
          />
          <Button
            id="verify-otp-button"
            type="submit"
            size="lg"
            className="w-full h-12 text-base font-medium rounded-md bg-primary-dark hover:bg-primary-darker text-white transition-colors duration-200"
            disabled={isLoading || otpCode.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={handleResendCode}
              className="text-primary-dark hover:text-primary-darker font-medium transition-colors"
              disabled={isLoading}
            >
              Resend
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <form id="hero-cta-form" onSubmit={handleEmailSubmit} className="mt-8">
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
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
