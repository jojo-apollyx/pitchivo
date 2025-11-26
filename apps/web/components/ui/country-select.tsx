'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactCountryFlag from 'react-country-flag'

// ISO 3166-1 alpha-2 codes for countries
const COUNTRY_CODES: Record<string, string> = {
  'China': 'CN',
  'USA': 'US',
  'India': 'IN',
  'Germany': 'DE',
  'France': 'FR',
  'Netherlands': 'NL',
  'Switzerland': 'CH',
  'Italy': 'IT',
  'Spain': 'ES',
  'UK': 'GB',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Brazil': 'BR',
  'Poland': 'PL',
  'Denmark': 'DK',
  'Belgium': 'BE',
  'Canada': 'CA',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Ireland': 'IE',
  'Sweden': 'SE',
  'Finland': 'FI',
  'Norway': 'NO',
  'Israel': 'IL',
  'Singapore': 'SG',
  'Malaysia': 'MY',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Indonesia': 'ID',
  'Mexico': 'MX',
  'Chile': 'CL',
  'Argentina': 'AR',
  'Peru': 'PE',
  'Turkey': 'TR',
  'UAE': 'AE',
  'South Africa': 'ZA',
}

interface CountrySelectProps {
  value: string
  onValueChange: (value: string) => void
  countries: readonly string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CountrySelect({
  value,
  onValueChange,
  countries,
  placeholder = 'Select country...',
  className,
  disabled = false,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const getCountryCode = (countryName: string): string => {
    return COUNTRY_CODES[countryName] || ''
  }

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'w-full h-10 px-3 rounded-md border border-border bg-background',
          'flex items-center justify-between',
          'text-sm text-foreground',
          'hover:bg-background-secondary focus:outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/15',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {value && getCountryCode(value) && (
            <ReactCountryFlag
              countryCode={getCountryCode(value)}
              svg
              style={{
                width: '1.25em',
                height: '1.25em',
              }}
            />
          )}
          {value || placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-2 rounded-lg border border-border/50 bg-background shadow-lg">
          <div className="p-2 border-b border-border/30">
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm transition-all duration-200 focus:outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No country found.
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onValueChange(country)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left',
                    'hover:bg-background-secondary hover:text-foreground',
                    'transition-colors duration-200',
                    value === country && 'bg-accent-surface text-primary-dark'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0 text-primary-dark',
                      value === country ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {getCountryCode(country) && (
                    <ReactCountryFlag
                      countryCode={getCountryCode(country)}
                      svg
                      style={{
                        width: '1.25em',
                        height: '1.25em',
                      }}
                    />
                  )}
                  <span className="truncate">{country}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
