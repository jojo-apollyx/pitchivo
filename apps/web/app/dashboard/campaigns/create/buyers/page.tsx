'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, MapPin, ExternalLink, Briefcase, ChevronDown, ChevronUp, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { useEffect, useState } from 'react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { LoadingIllustration } from '@/components/ui/loading-illustration'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
}

interface BuyerStats {
  totalBuyers: number
  totalContacts: number
  verifiedFields: number
  countries: number
  avgContactsPerBuyer: number
}

export default function MatchedBuyersPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep, prevStep } = useCampaignStore()
  const [buyers, setBuyers] = useState<Buyer[]>([])
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

              {/* Buyers Table */}
              {loading ? (
                <div className="bg-card/50 rounded-xl p-12 sm:p-16 flex items-center justify-center">
                  <LoadingIllustration size="lg" progress={progress} />
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
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1 text-right">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{buyer.contacts}</span>
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

