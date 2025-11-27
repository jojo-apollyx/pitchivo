'use client'

import { useEffect, useState } from 'react'
import { DashboardIntroTutorial, useShouldShowDashboardIntro } from './DashboardIntroTutorial'

interface DashboardIntroWrapperProps {
  children: React.ReactNode
}

export function DashboardIntroWrapper({ children }: DashboardIntroWrapperProps) {
  const shouldShowIntro = useShouldShowDashboardIntro()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    // Only show tutorial if user hasn't completed it
    if (shouldShowIntro) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setShowTutorial(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [shouldShowIntro])

  return (
    <>
      <DashboardIntroTutorial
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
      {children}
    </>
  )
}

