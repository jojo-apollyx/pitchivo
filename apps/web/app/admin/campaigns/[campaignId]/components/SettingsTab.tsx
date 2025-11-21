'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TimePicker } from '@/components/ui/time-picker'
import { toast } from 'sonner'

interface SettingsTabProps {
  campaign: any
  onRefresh: () => void
}

export function SettingsTab({ campaign, onRefresh }: SettingsTabProps) {
  const [saving, setSaving] = useState(false)

  // Schedule settings
  const [timezone, setTimezone] = useState(campaign.timezone || 'America/New_York')
  const [sendingDays, setSendingDays] = useState<number[]>(campaign.sending_days || [1,2,3,4,5])
  const [startHour, setStartHour] = useState(campaign.sending_hours?.start || '09:00')
  const [endHour, setEndHour] = useState(campaign.sending_hours?.end || '17:00')
  const [minTimeBetween, setMinTimeBetween] = useState(campaign.min_time_between_emails || 30)
  const [maxLeadsPerDay, setMaxLeadsPerDay] = useState(campaign.max_leads_per_day || 100)

  // Tracking settings
  const [trackOpens, setTrackOpens] = useState(campaign.track_opens ?? true)
  const [trackClicks, setTrackClicks] = useState(campaign.track_clicks ?? true)
  const [trackReplies, setTrackReplies] = useState(campaign.track_replies ?? true)

  // Behavior settings
  const [stopOnReply, setStopOnReply] = useState(campaign.stop_on_reply ?? true)
  const [stopOnClick, setStopOnClick] = useState(campaign.stop_on_click ?? false)
  const [stopOnOpen, setStopOnOpen] = useState(campaign.stop_on_open ?? false)
  const [sendPlainText, setSendPlainText] = useState(campaign.send_as_plain_text ?? false)
  const [followUpPercentage, setFollowUpPercentage] = useState(campaign.follow_up_percentage || 100)

  // Default template settings
  const [defaultTemplateName, setDefaultTemplateName] = useState(campaign.default_template_name || '')
  const [availableTemplates, setAvailableTemplates] = useState<Record<string, any[]>>({})
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ]

  async function handleSaveSchedule() {
    if (!campaign.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.campaign_id}/settings/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartlead_campaign_id: campaign.smartlead_campaign_id,
          timezone,
          days_of_the_week: sendingDays,
          start_hour: startHour,
          end_hour: endHour,
          min_time_btw_emails: minTimeBetween,
          max_new_leads_per_day: maxLeadsPerDay,
        })
      })

      if (!response.ok) throw new Error('Failed to save schedule settings')

      toast.success('Schedule settings saved')
      onRefresh()
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Failed to save schedule settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTracking() {
    if (!campaign.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    setSaving(true)
    try {
      const trackSettings = []
      if (!trackOpens) trackSettings.push('DONT_TRACK_EMAIL_OPEN')
      if (!trackClicks) trackSettings.push('DONT_TRACK_LINK_CLICK')
      if (!trackReplies) trackSettings.push('DONT_TRACK_REPLY_TO_AN_EMAIL')

      const response = await fetch(`/api/admin/campaigns/${campaign.campaign_id}/settings/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartlead_campaign_id: campaign.smartlead_campaign_id,
          track_settings: trackSettings,
        })
      })

      if (!response.ok) throw new Error('Failed to save tracking settings')

      toast.success('Tracking settings saved')
      onRefresh()
    } catch (error) {
      console.error('Error saving tracking:', error)
      toast.error('Failed to save tracking settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBehavior() {
    if (!campaign.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    setSaving(true)
    try {
      let stopLeadSetting = null
      if (stopOnReply) stopLeadSetting = 'REPLY_TO_AN_EMAIL'
      else if (stopOnClick) stopLeadSetting = 'CLICK_ON_A_LINK'
      else if (stopOnOpen) stopLeadSetting = 'OPEN_AN_EMAIL'

      const response = await fetch(`/api/admin/campaigns/${campaign.campaign_id}/settings/behavior`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartlead_campaign_id: campaign.smartlead_campaign_id,
          stop_lead_settings: stopLeadSetting,
          send_as_plain_text: sendPlainText,
          follow_up_percentage: followUpPercentage,
        })
      })

      if (!response.ok) throw new Error('Failed to save behavior settings')

      toast.success('Behavior settings saved')
      onRefresh()
    } catch (error) {
      console.error('Error saving behavior:', error)
      toast.error('Failed to save behavior settings')
    } finally {
      setSaving(false)
    }
  }

  if (!campaign.smartlead_campaign_id) {
    return (
      <Alert>
        <AlertDescription>
          Campaign not synced with Smartlead. Settings are only available for synced campaigns.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Settings</CardTitle>
          <CardDescription>
            Configure when emails should be sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sending Days</Label>
              <div className="grid grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={sendingDays.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSendingDays([...sendingDays, day.value].sort())
                        } else {
                          setSendingDays(sendingDays.filter(d => d !== day.value))
                        }
                      }}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-xs cursor-pointer">
                      {day.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TimePicker
              id="campaign-schedule-start-time"
              label="Start Time"
              value={startHour}
              onChange={setStartHour}
              placeholder="Select start time"
              aria-label="Campaign start time"
            />
            
            <TimePicker
              id="campaign-schedule-end-time"
              label="End Time"
              value={endHour}
              onChange={setEndHour}
              placeholder="Select end time"
              aria-label="Campaign end time"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min-time">Min Time Between Emails (minutes)</Label>
              <Input
                id="min-time"
                type="number"
                value={minTimeBetween}
                onChange={(e) => setMinTimeBetween(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-leads">Max New Leads Per Day</Label>
              <Input
                id="max-leads"
                type="number"
                value={maxLeadsPerDay}
                onChange={(e) => setMaxLeadsPerDay(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
          </div>

          <Button onClick={handleSaveSchedule} disabled={saving}>
            Save Schedule Settings
          </Button>
        </CardContent>
      </Card>

      {/* Tracking Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Settings</CardTitle>
          <CardDescription>
            Configure what email interactions to track
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="track-opens">Track Email Opens</Label>
              <p className="text-sm text-muted-foreground">
                Track when recipients open your emails
              </p>
            </div>
            <Switch
              id="track-opens"
              checked={trackOpens}
              onCheckedChange={setTrackOpens}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="track-clicks">Track Link Clicks</Label>
              <p className="text-sm text-muted-foreground">
                Track when recipients click links in your emails
              </p>
            </div>
            <Switch
              id="track-clicks"
              checked={trackClicks}
              onCheckedChange={setTrackClicks}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="track-replies">Track Replies</Label>
              <p className="text-sm text-muted-foreground">
                Track when recipients reply to your emails
              </p>
            </div>
            <Switch
              id="track-replies"
              checked={trackReplies}
              onCheckedChange={setTrackReplies}
            />
          </div>

          <Button onClick={handleSaveTracking} disabled={saving}>
            Save Tracking Settings
          </Button>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Behavior Settings</CardTitle>
          <CardDescription>
            Configure how the campaign behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Stop Sending When Lead...</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stop-reply"
                  checked={stopOnReply}
                  onCheckedChange={(checked) => {
                    setStopOnReply(!!checked)
                    if (checked) {
                      setStopOnClick(false)
                      setStopOnOpen(false)
                    }
                  }}
                />
                <Label htmlFor="stop-reply" className="cursor-pointer">
                  Replies to an email
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stop-click"
                  checked={stopOnClick}
                  onCheckedChange={(checked) => {
                    setStopOnClick(!!checked)
                    if (checked) {
                      setStopOnReply(false)
                      setStopOnOpen(false)
                    }
                  }}
                />
                <Label htmlFor="stop-click" className="cursor-pointer">
                  Clicks a link
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stop-open"
                  checked={stopOnOpen}
                  onCheckedChange={(checked) => {
                    setStopOnOpen(!!checked)
                    if (checked) {
                      setStopOnReply(false)
                      setStopOnClick(false)
                    }
                  }}
                />
                <Label htmlFor="stop-open" className="cursor-pointer">
                  Opens an email
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="plain-text">Send as Plain Text</Label>
              <p className="text-sm text-muted-foreground">
                Send emails as plain text instead of HTML
              </p>
            </div>
            <Switch
              id="plain-text"
              checked={sendPlainText}
              onCheckedChange={setSendPlainText}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="follow-up">Follow-up Percentage (0-100)</Label>
            <p className="text-sm text-muted-foreground">
              Percentage of leads that will receive follow-up emails
            </p>
            <Input
              id="follow-up"
              type="number"
              value={followUpPercentage}
              onChange={(e) => setFollowUpPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              min={0}
              max={100}
            />
          </div>

          <Button onClick={handleSaveBehavior} disabled={saving}>
            Save Behavior Settings
          </Button>
        </CardContent>
      </Card>

      {/* Default Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Sequence Template</CardTitle>
          <CardDescription>
            Configure which global template to use for auto-populating sequences when this campaign is created in Smartlead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-template">Default Template</Label>
            <Select 
              value={defaultTemplateName} 
              onValueChange={setDefaultTemplateName}
              disabled={loadingTemplates}
            >
              <SelectTrigger id="default-template">
                <SelectValue placeholder={loadingTemplates ? "Loading templates..." : "Select a template (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (no auto-population)</SelectItem>
                {Object.keys(availableTemplates).map((templateName) => (
                  <SelectItem key={templateName} value={templateName}>
                    {templateName} ({availableTemplates[templateName].length} sequences)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              When a new campaign is created in Smartlead, sequences from the selected template will be automatically populated.
              Leave empty to disable auto-population.
            </p>
          </div>

          {defaultTemplateName && availableTemplates[defaultTemplateName] && (
            <Alert>
              <AlertDescription>
                <p className="font-medium mb-2">Selected template contains:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {availableTemplates[defaultTemplateName].map((seq: any) => (
                    <li key={seq.template_id}>
                      Sequence {seq.seq_number} - {seq.delay_days} day{seq.delay_days !== 1 ? 's' : ''} delay
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSaveDefaultTemplate} disabled={saving}>
            Save Default Template
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

