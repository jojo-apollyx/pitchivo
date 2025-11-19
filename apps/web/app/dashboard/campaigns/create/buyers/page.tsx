'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, MapPin, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { MOCK_BUYERS, generateMockBuyers } from '@/lib/mock-data/buyers'
import { useEffect, useState } from 'react'
import React from 'react'

export default function MatchedBuyersPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep, prevStep } = useCampaignStore()
  const [allBuyers, setAllBuyers] = useState(MOCK_BUYERS)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    // Load full buyer list
    const buyers = generateMockBuyers(2450)
    setAllBuyers(buyers)

    // Save sample buyers with actual contact details for later steps
    const topBuyers = buyers.slice(0, 10).map(b => ({ 
      company: b.company, 
      country: b.country,
      industry: b.industry,
      website: b.website,
      contactDetails: b.contactDetails || []
    }))
    setDraft({
      sampleBuyers: topBuyers,
      buyerCount: 2450,
      totalContacts: 8932
    })
  }, [])

  function handleNext() {
    nextStep()
    router.push('/dashboard/campaigns/create/config')
  }

  function handleBack() {
    prevStep()
    router.push('/dashboard/campaigns/create/product')
  }

  // Calculate totals
  const totalBuyers = 2450
  const totalContacts = 8932
  const avgContactsPerBuyer = (totalContacts / totalBuyers).toFixed(1)

  function toggleRow(index: number) {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold">Campaign Setup</h1>
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
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                  Matched Buyers from Pitchivo Database
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  These companies have purchased or sourced this ingredient in the past.
                </p>
              </div>

              {/* Buyers Table */}
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
                      {allBuyers.slice(0, 10).map((buyer, index) => {
                        const topContacts = buyer.contactDetails?.slice(0, 5) || []
                        const isExpanded = expandedRows.has(index)
                        return (
                          <React.Fragment key={index}>
                            <tr
                              className="hover:bg-accent/5 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm font-medium">{buyer.company}</span>
                                  {buyer.country && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{buyer.country}</span>
                                    </div>
                                  )}
                                  {buyer.website && (
                                    <a
                                      href={buyer.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      <span>Website</span>
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleRow(index)}
                                  className="flex items-center justify-end gap-1 w-full text-right hover:text-primary transition-colors"
                                >
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{buyer.contacts}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && topContacts.length > 0 && (
                              <tr className="bg-muted/20">
                                <td colSpan={2} className="px-4 py-3">
                                  <div className="pl-6 space-y-2">
                                    <div className="font-semibold text-xs text-muted-foreground mb-2">
                                      Showing {topContacts.length} {topContacts.length === 1 ? 'contact' : 'contacts'} out of {buyer.contacts}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {topContacts.map((contact, idx) => (
                                        <div key={idx} className="text-xs">
                                          <div className="font-medium text-foreground">{contact.name}</div>
                                          <div className="text-muted-foreground">{contact.title || contact.role}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
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
                    Showing top 10 of <span className="font-semibold text-foreground">{totalBuyers.toLocaleString()}</span> matched buyers
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Estimated total contacts: <span className="font-semibold text-foreground">{totalContacts.toLocaleString()}</span> verified leads
                  </p>
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> Pitchivo Curated Database (auto-updated monthly based on verified sourcing records)
                    </p>
                  </div>
                </div>
              </div>
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
                        {totalBuyers.toLocaleString()}
                      </div>
                    </div>

                    {/* Avg Contacts */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Avg contacts per buyer
                      </div>
                      <div className="text-2xl font-bold">
                        {avgContactsPerBuyer}
                      </div>
                    </div>

                    {/* Geographic Coverage */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Geographic coverage
                      </div>
                      <div className="text-2xl font-bold">
                        42 <span className="text-base font-normal text-muted-foreground">countries</span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="pt-4 border-t border-border/30">
                      <div className="text-sm text-muted-foreground mb-1">
                        Last updated
                      </div>
                      <div className="text-base font-semibold">
                        Oct 2025
                      </div>
                    </div>
                  </div>

                  {/* Next Button */}
                  <div className="mt-6 pt-6 border-t border-border/30">
                    <Button
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
              onClick={handleNext}
              className="gap-2 min-h-[44px]"
            >
              Next: Configure Sending
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

