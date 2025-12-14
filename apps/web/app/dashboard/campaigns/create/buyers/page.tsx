'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, MapPin, ExternalLink, Briefcase, ChevronDown, ChevronUp, User, Search, Sparkles, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { useEffect, useState } from 'react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { LoadingIllustration } from '@/components/ui/loading-illustration'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Buyer {
  company: string
  companyType: string
  location: string
  website: string | null
  employeeCount: string | null
  contacts: number
  contactDetails?: Array<{
    name: string
    email: string | null
    title: string | null
  }>
  interactionTypes?: string[] // Most recent 3 distinct interaction types
  categoryFit?: 'High' | 'Medium' | 'Low' | 'Assessment Pending'
  cooperationPotential?: 'Strong' | 'Neutral' | 'Weak' | 'Assessment Pending'
  matchScore?: 'A' | 'B' | 'C' | 'D' | 'Assessment Pending'
}

interface MatchedItem {
  id: string
  name: string
  aliases: string[]
  similarity: number
}

interface BuyerStats {
  totalBuyers: number
  totalContacts: number
  verifiedFields: number
  countries: number
  avgContactsPerBuyer: number
}

// User-friendly messages for interaction types
const INTERACTION_TYPE_MESSAGES: Record<string, string> = {
  'purchased': 'Previously purchased this product',
  'requested_quote': 'Requested a quote in the past',
  'viewed_item': 'Showed buying interest',
  'added_to_cart': 'Added to cart previously',
  'imported': 'Has imported this product',
  'used_in_production': 'Uses this in their production',
  'distributed': 'Distributes this product',
  'mentioned_in_article': 'Mentioned in industry coverage',
  'partnership_announced': 'Partnership related to this product',
  'exported': 'Has exported this product',
  'manufactured': 'Manufactures this product',
  'sold': 'Has sold this product',
  'supplied': 'Supplies this product'
}

// Get user-friendly message for interaction type
function getInteractionMessage(interactionType: string): string {
  return INTERACTION_TYPE_MESSAGES[interactionType] || interactionType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function MatchedBuyersPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep, prevStep } = useCampaignStore()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [stats, setStats] = useState<BuyerStats>({
    totalBuyers: 0,
    totalContacts: 0,
    verifiedFields: 0,
    countries: 0,
    avgContactsPerBuyer: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function loadBuyers() {
      if (!draft.productName) {
        setError('Product name is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setProgress(0)

        // Simulate progress for dopamine effect
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            // Accelerate then slow down for smooth feel
            const increment = prev < 30 ? 8 : prev < 70 ? 5 : 2
            return Math.min(prev + increment, 90)
          })
        }, 200)

        const response = await fetch('/api/campaigns/generate-buyers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productName: draft.productName,
            productIndustry: draft.productIndustry
          })
        })

        clearInterval(progressInterval)
        setProgress(100)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load buyers')
        }

        const data = await response.json()
        setBuyers(data.buyers || [])
        setMatchedItems(data.matchedItems || [])
        setSearchQuery(data.searchQuery || draft.productName || '')
        setStats({
          totalBuyers: data.totalBuyers || 0,
          totalContacts: data.totalContacts || 0,
          verifiedFields: data.verifiedFields || 0,
          countries: data.countries || 0,
          avgContactsPerBuyer: data.avgContactsPerBuyer || 0
        })

        // Save full buyer data with contact details for later steps
        // Store all buyers (not just top 10) with full contact details including emails
        const allBuyersWithContacts = (data.buyers || []).map((b: Buyer) => ({
          company: b.company,
          companyType: b.companyType,
          location: b.location,
          website: b.website,
          employeeCount: b.employeeCount,
          contacts: b.contacts,
          contactDetails: b.contactDetails || []
        }))
        setDraft({
          matchedBuyers: allBuyersWithContacts, // Store full buyer data
          sampleBuyers: (data.buyers || []).map((b: Buyer) => ({ 
            company: b.company, 
            contacts: b.contacts
          })), // Keep for backward compatibility
          buyerCount: data.totalBuyers || 0,
          totalContacts: data.totalContacts || 0
        })
      } catch (err) {
        console.error('Error loading buyers:', err)
        setError(err instanceof Error ? err.message : 'Failed to load buyers')
      } finally {
        // Small delay before hiding loading for smooth transition
        setTimeout(() => {
          setLoading(false)
          setProgress(0)
        }, 300)
      }
    }

    loadBuyers()
  }, [draft.productName, draft.productIndustry, setDraft])

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  function handleNext() {
    nextStep()
    router.push('/dashboard/campaigns/create/config')
  }

  function handleBack() {
    prevStep()
    router.push('/dashboard/campaigns/create/product')
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top Bar */}
      <section id="campaign-buyers-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              id="campaign-buyers-back-button"
              aria-label="Go back to product selection"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-display font-semibold">Campaign Setup</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Step 2 of 4</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Section - Buyer List */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2">
                  Matched Buyers from Pitchivo Database
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  These companies have purchased or sourced this ingredient in the past.
                </p>
              </div>

              {/* Matched Items Section - Show what was searched */}
              {!loading && matchedItems.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Semantic Search Results</span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">
                            We used AI-powered semantic search to find products matching &quot;{searchQuery}&quot;. 
                            This finds similar items even with different names (e.g., &quot;Vitamin C&quot; matches &quot;Ascorbic Acid&quot;).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {matchedItems.slice(0, 5).map((item, idx) => (
                      <TooltipProvider key={item.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background/80 rounded-lg border border-border/50 cursor-help">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium">{item.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {Math.round(item.similarity * 100)}%
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <div className="space-y-1.5">
                              <p className="font-medium text-xs">Match Confidence: {Math.round(item.similarity * 100)}%</p>
                              {item.aliases.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-1">Also known as:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.aliases.slice(0, 5).map((alias, aliasIdx) => (
                                      <Badge key={aliasIdx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {alias}
                                      </Badge>
                                    ))}
                                    {item.aliases.length > 5 && (
                                      <span className="text-[10px] text-muted-foreground">+{item.aliases.length - 5} more</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {matchedItems.length > 5 && (
                      <span className="text-xs text-muted-foreground self-center">
                        +{matchedItems.length - 5} more matches
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Buyers Table */}
              {loading ? (
                <div className="bg-card/50 rounded-xl p-12 sm:p-16 flex items-center justify-center min-h-[400px]">
                  <LoadingIllustration 
                    size="lg" 
                    progress={progress} 
                    message="Finding potential buyers from our database..."
                  />
                </div>
              ) : error ? (
                <div className="bg-card/50 rounded-xl p-12 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              ) : buyers.length === 0 ? (
                <div className="bg-card/50 rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">No buyers found for this product.</p>
                </div>
              ) : (
                <div className="bg-card/50 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold">
                            Buyer Company
                          </th>
                          <th className="text-right px-4 py-3 text-sm font-semibold">
                            Contacts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {buyers.map((buyer, index) => {
                          const isExpanded = expandedRows.has(index)
                          const hasContacts = buyer.contactDetails && buyer.contactDetails.length > 0
                          
                          return (
                            <React.Fragment key={index}>
                              <tr 
                                className={cn(
                                  "hover:bg-accent/5 transition-colors",
                                  hasContacts && "cursor-pointer"
                                )}
                                onClick={() => hasContacts && toggleRow(index)}
                              >
                                <td className="px-4 py-3">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm font-medium">{buyer.company}</span>
                                      {hasContacts && (
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </motion.div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs">
                                        <Briefcase className="h-3 w-3 mr-1" />
                                        {buyer.companyType}
                                      </Badge>
                                      {buyer.location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{buyer.location}</span>
                                        </div>
                                      )}
                                      {buyer.employeeCount && (
                                        <span>• {buyer.employeeCount} employees</span>
                                      )}
                                      {buyer.website && buyer.website.trim() !== '' && (
                                        <a
                                          href={buyer.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-primary hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          <span>Website</span>
                                        </a>
                                      )}
                                    </div>
                                    {buyer.interactionTypes && buyer.interactionTypes.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                        <span className="text-xs text-muted-foreground">Why selected:</span>
                                        {buyer.interactionTypes.map((interactionType, idx) => (
                                          <TooltipProvider key={idx} delayDuration={200}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Badge 
                                                  variant="secondary" 
                                                  className="text-xs font-normal cursor-help bg-primary/10 text-primary border-primary/20"
                                                >
                                                  {getInteractionMessage(interactionType)}
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs">
                                                <p className="text-xs">
                                                  This company was selected because they have {getInteractionMessage(interactionType).toLowerCase()}.
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ))}
                                      </div>
                                    )}
                                    {/* Signal Metrics */}
                                    <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-border/20">
                                      {/* Product Category Fit */}
                                      {buyer.categoryFit && (
                                        <TooltipProvider delayDuration={200}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Category Fit:</span>
                                                <Badge 
                                                  variant={
                                                    buyer.categoryFit === 'High' ? 'default' :
                                                    buyer.categoryFit === 'Medium' ? 'secondary' :
                                                    buyer.categoryFit === 'Assessment Pending' ? 'outline' :
                                                    'outline'
                                                  }
                                                  className={cn(
                                                    "text-xs font-medium cursor-help",
                                                    buyer.categoryFit === 'High' && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
                                                    buyer.categoryFit === 'Medium' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
                                                    buyer.categoryFit === 'Low' && "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
                                                    buyer.categoryFit === 'Assessment Pending' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                  )}
                                                >
                                                  {buyer.categoryFit}
                                                </Badge>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <div className="space-y-1">
                                                <p className="font-semibold">Product Category Fit</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {buyer.categoryFit === 'Assessment Pending' 
                                                    ? 'Category fit assessment is being evaluated. We are analyzing company data to determine alignment with your product category.'
                                                    : buyer.categoryFit === 'High'
                                                    ? 'Strong match: Company operates in the same industry/category as your product.'
                                                    : buyer.categoryFit === 'Medium'
                                                    ? 'Moderate match: Company has some relevance to your product category.'
                                                    : 'Low match: Limited category alignment with your product.'}
                                                </p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      
                                      {/* Long-term Cooperation Potential */}
                                      {buyer.cooperationPotential && (
                                        <TooltipProvider delayDuration={200}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Cooperation:</span>
                                                <Badge 
                                                  variant={
                                                    buyer.cooperationPotential === 'Strong' ? 'default' :
                                                    buyer.cooperationPotential === 'Neutral' ? 'secondary' :
                                                    buyer.cooperationPotential === 'Assessment Pending' ? 'outline' :
                                                    'outline'
                                                  }
                                                  className={cn(
                                                    "text-xs font-medium cursor-help",
                                                    buyer.cooperationPotential === 'Strong' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                                                    buyer.cooperationPotential === 'Neutral' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
                                                    buyer.cooperationPotential === 'Weak' && "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
                                                    buyer.cooperationPotential === 'Assessment Pending' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                  )}
                                                >
                                                  {buyer.cooperationPotential}
                                                </Badge>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <div className="space-y-1">
                                                <p className="font-semibold">Long-term Cooperation Potential</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {buyer.cooperationPotential === 'Assessment Pending'
                                                    ? 'Cooperation potential assessment is being evaluated. We are analyzing interaction history and engagement patterns.'
                                                    : buyer.cooperationPotential === 'Strong'
                                                    ? 'High potential: Multiple verified signals, recent activity, and high-value interactions indicate strong partnership potential.'
                                                    : buyer.cooperationPotential === 'Neutral'
                                                    ? 'Moderate potential: Some signals and activity suggest possible cooperation.'
                                                    : 'Low potential: Limited or old signals indicate lower cooperation likelihood.'}
                                                </p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      
                                      {/* System Match Score */}
                                      {buyer.matchScore && (
                                        <TooltipProvider delayDuration={200}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Match Score:</span>
                                                <Badge 
                                                  variant={
                                                    buyer.matchScore === 'A' ? 'default' :
                                                    buyer.matchScore === 'B' ? 'secondary' :
                                                    buyer.matchScore === 'Assessment Pending' ? 'outline' :
                                                    'outline'
                                                  }
                                                  className={cn(
                                                    "text-xs font-bold cursor-help",
                                                    buyer.matchScore === 'A' && "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
                                                    buyer.matchScore === 'B' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                                                    buyer.matchScore === 'C' && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
                                                    buyer.matchScore === 'D' && "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
                                                    buyer.matchScore === 'Assessment Pending' && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                                  )}
                                                >
                                                  {buyer.matchScore}
                                                </Badge>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <div className="space-y-1">
                                                <p className="font-semibold">System Match Score</p>
                                                <p className="text-xs text-muted-foreground">
                                                  {buyer.matchScore === 'Assessment Pending'
                                                    ? 'Match score assessment is being evaluated. We are analyzing similarity, data quality, and signal verification to determine the match score.'
                                                    : buyer.matchScore === 'A'
                                                    ? 'Excellent match: High semantic similarity, verified signals, complete data, and high trust sources.'
                                                    : buyer.matchScore === 'B'
                                                    ? 'Good match: Good similarity, some verified signals, and decent data quality.'
                                                    : buyer.matchScore === 'C'
                                                    ? 'Moderate match: Acceptable similarity and data quality.'
                                                    : 'Low match: Limited similarity or data quality issues.'}
                                                </p>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 text-right">
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{buyer.contacts}</span>
                                    </div>
                                    {buyer.contacts === 0 && (
                                      <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 cursor-help">
                                              <Info className="h-3 w-3" />
                                              <span>Will be sourced</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="left" className="max-w-xs">
                                            <p className="text-xs">
                                              Contact information will be automatically sourced from multiple channels during campaign execution. 
                                              Our system enriches company data with verified decision-maker contacts.
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {hasContacts && (
                                <tr>
                                  <td colSpan={2} className="p-0">
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-4 py-3 bg-muted/20">
                                            <div className="space-y-2">
                                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                                Contact Details
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {buyer.contactDetails?.map((contact, contactIndex) => (
                                                  <motion.div
                                                    key={contactIndex}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: contactIndex * 0.05 }}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-background/50 border border-border/30"
                                                  >
                                                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                      <div className="text-sm font-medium truncate">
                                                        {contact.name}
                                                      </div>
                                                      {contact.title && (
                                                        <div className="text-xs text-muted-foreground truncate">
                                                          {contact.title}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </motion.div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="px-4 py-4 border-t border-border/50 bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">
                      Showing <span className="font-semibold text-foreground">{buyers.length}</span> of <span className="font-semibold text-foreground">{stats.totalBuyers.toLocaleString()}</span> matched buyers
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-semibold text-foreground">{stats.totalContacts.toLocaleString()}</span> verified contacts • <span className="font-semibold text-foreground">{stats.verifiedFields}</span> verified fields
                    </p>
                    <div className="pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Source:</span> Pitchivo Database (companies that purchased this product)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Audience Insights */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-border/30">
                  <h3 className="text-lg font-semibold mb-4">Audience Insights</h3>

                  <div className="space-y-4">
                    {/* Total Buyers */}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Total matched buyers
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {stats.totalBuyers.toLocaleString()}
                      </div>
                    </div>

                    {/* Verified Fields */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Verified fields
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.verifiedFields}
                      </div>
                    </div>

                    {/* Avg Contacts */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Avg contacts per buyer
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.avgContactsPerBuyer.toFixed(1)}
                      </div>
                    </div>

                    {/* Geographic Coverage */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Geographic coverage
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.countries} <span className="text-base font-normal text-muted-foreground">countries</span>
                      </div>
                    </div>

                    {/* Total Contacts */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Total contacts
                      </div>
                      <div className="text-2xl font-bold">
                        {stats.totalContacts.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Next Button */}
                  <div className="mt-6 pt-6 border-t border-border/30">
                    <Button
                      id="campaign-buyers-next-button-desktop"
                      aria-label="Continue to configure sending"
                      onClick={handleNext}
                      className="w-full gap-2 min-h-[44px]"
                    >
                      Next: Configure Sending
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky Bar */}
      <section className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 border-t border-border/50 lg:hidden">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
            </div>

            {/* Next Button */}
            <Button
              id="campaign-buyers-next-button-mobile"
              aria-label="Continue to configure sending"
              onClick={handleNext}
              className="gap-2 min-h-[44px]"
            >
              Next: Configure Sending
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

