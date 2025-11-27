'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Bot, 
  Target, 
  Mail, 
  BarChart3, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Database,
  Brain,
  MessageSquare,
  TrendingUp,
  Globe,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: Brain,
      title: 'AI-Curated Leads',
      description: 'Our AI analyzes millions of data points to identify and qualify your ideal B2B buyers automatically.',
    },
    {
      icon: Mail,
      title: 'AI-Generated Outreach',
      description: 'Professionally crafted emails written by AI, supervised by sales experts for maximum response rates.',
    },
    {
      icon: Target,
      title: 'Intent-Based Targeting',
      description: 'AI detects buyer intent signals to reach prospects at the perfect moment in their buying journey.',
    },
    {
      icon: Bot,
      title: 'Smart Sequences',
      description: 'AI-powered follow-up sequences that adapt based on recipient engagement and behavior patterns.',
    },
    {
      icon: BarChart3,
      title: 'Predictive Analytics',
      description: 'AI-driven insights predict which leads are most likely to convert, helping you prioritize outreach.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant infrastructure with AI-powered threat detection to keep your data safe.',
    },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Upload Your Product',
      description: 'Create beautiful product pages with AI-enhanced descriptions and optimized for conversions.',
    },
    {
      step: '02',
      title: 'AI Finds Your Buyers',
      description: 'Our AI analyzes your product and automatically identifies the most relevant B2B buyers.',
    },
    {
      step: '03',
      title: 'Launch Smart Campaigns',
      description: 'AI-curated, professionally supervised email campaigns sent to qualified prospects.',
    },
    {
      step: '04',
      title: 'Receive Quality RFQs',
      description: 'Get actionable requests from interested buyers ready to do business.',
    },
  ]

  const stats = [
    { value: '10x', label: 'Higher Response Rates', description: 'vs cold outreach' },
    { value: '85%', label: 'Lead Qualification', description: 'AI accuracy' },
    { value: '3hrs', label: 'Average Time Saved', description: 'per day on prospecting' },
    { value: '50M+', label: 'B2B Contacts', description: 'in our AI-analyzed database' },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary-dark flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Pitchivo</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-accent-surface px-4 py-2 rounded-full mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Bot className="h-4 w-4 text-primary-dark" />
              <span className="text-sm font-medium text-primary-dark">AI-Powered B2B Outreach</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              AI-Curated Outreach,{' '}
              <span className="text-primary-dark">Professionally Supervised</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Connect with qualified B2B buyers through AI-analyzed lead databases 
              and intelligent email campaigns—all supervised by sales professionals.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/auth/signup">
                <Button size="lg" className="gap-2 h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  See How It Works
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border/30 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-bold text-primary-dark mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              AI That Works For You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI handles the heavy lifting while sales experts ensure quality and compliance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="bg-background-secondary rounded-lg p-6 transition-colors duration-200 hover:bg-accent-surface group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-12 w-12 rounded-lg bg-accent-surface flex items-center justify-center mb-4 transition-colors duration-200 group-hover:bg-primary-dark/10">
                    <Icon className="h-6 w-6 text-primary-dark" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How Pitchivo Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From product upload to qualified leads—all powered by AI, supervised by experts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="bg-background rounded-lg p-6 h-full">
                  <div className="text-4xl font-bold text-primary-dark/20 mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Buyer Database Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-accent-surface px-3 py-1.5 rounded-full mb-4">
                <Database className="h-4 w-4 text-primary-dark" />
                <span className="text-xs font-medium text-primary-dark">AI-Analyzed Database</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                50M+ B2B Contacts,{' '}
                <span className="text-primary-dark">AI-Qualified</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our AI continuously analyzes buyer intent, company data, and market signals 
                to ensure you're reaching the right decision-makers at the right time.
              </p>
              <ul className="space-y-3">
                {[
                  'AI identifies buying intent signals',
                  'Real-time data enrichment and verification',
                  'Industry-specific targeting algorithms',
                  'Compliance-checked contact data',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-semantic-success flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="bg-background-secondary rounded-lg p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, label: 'Global Coverage', value: '190+ Countries' },
                  { icon: Users, label: 'Decision Makers', value: '15M+ Verified' },
                  { icon: TrendingUp, label: 'Intent Signals', value: 'Real-time' },
                  { icon: Lock, label: 'Data Compliance', value: 'GDPR Ready' },
                ].map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} className="bg-background rounded-lg p-4">
                      <Icon className="h-5 w-5 text-primary-dark mb-2" />
                      <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your B2B Outreach?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Join thousands of businesses using AI-powered outreach to connect with qualified buyers.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="gap-2 h-12 px-8">
                Start Your Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary-dark flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">Pitchivo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pitchivo. AI-powered B2B outreach platform.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
