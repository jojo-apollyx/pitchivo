'use client'

import { useState, useEffect } from 'react'
import { Palette, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ColorPicker } from './color-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { applyThemeColor, resetThemeColor } from '@/lib/theme'

interface ThemeColorSettingsProps {
  organizationId: string
  currentThemeColor?: string
}

export function ThemeColorSettings({ organizationId, currentThemeColor = '#ADEBB3' }: ThemeColorSettingsProps) {
  const [themeColor, setThemeColor] = useState(currentThemeColor)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  // Apply theme color on mount and when it changes
  useEffect(() => {
    if (themeColor) {
      applyThemeColor(themeColor)
    }
    
    return () => {
      // Reset to default when component unmounts (optional)
      // resetThemeColor()
    }
  }, [themeColor])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ theme_color: themeColor })
        .eq('id', organizationId)

      if (error) throw error

      toast.success('Theme color updated successfully!')
      applyThemeColor(themeColor)
    } catch (error) {
      console.error('Error updating theme color:', error)
      toast.error('Failed to update theme color. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Color
        </CardTitle>
        <CardDescription>
          Choose your organization's primary theme color. This will be used in your product pages and customer-facing content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ColorPicker value={themeColor} onChange={setThemeColor} />
        
        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || themeColor === currentThemeColor}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Theme Color'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

