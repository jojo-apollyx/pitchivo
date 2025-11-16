'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { CalendarDays, Upload, Zap } from 'lucide-react'

interface BatchSchedulerProps {
  campaignId: string
  onScheduleComplete?: () => void
}

export function BatchEmailScheduler({ campaignId, onScheduleComplete }: BatchSchedulerProps) {
  const [recipients, setRecipients] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduleResult, setScheduleResult] = useState<any>(null)
  const [confirmScheduleOpen, setConfirmScheduleOpen] = useState(false)
  const [recipientListToSchedule, setRecipientListToSchedule] = useState<any[]>([])
  
  // Settings
  const [dailyLimit, setDailyLimit] = useState('50')
  const [emailsPerHour, setEmailsPerHour] = useState('10')
  const [sendingHours, setSendingHours] = useState('9,10,11,14,15,16')

  function handleAutoScheduleClick() {
    if (!recipients.trim()) {
      toast.error('Please enter recipient emails')
      return
    }

    // Parse recipients (one per line or comma-separated)
    const lines = recipients.split('\n').filter(line => line.trim())
    const recipientList = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        email: parts[0],
        company: parts[1] || undefined,
        name: parts[2] || undefined
      }
    }).filter(r => r.email && r.email.includes('@'))

    if (recipientList.length === 0) {
      toast.error('No valid email addresses found')
      return
    }

    setRecipientListToSchedule(recipientList)
    setConfirmScheduleOpen(true)
  }

  async function handleAutoSchedule() {
    setConfirmScheduleOpen(false)
    setScheduling(true)
    try {
      const response = await fetch('/api/admin/campaigns/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          recipients: recipientListToSchedule,
          dailyLimit: parseInt(dailyLimit) || 50,
          emailsPerHour: parseInt(emailsPerHour) || 10,
          sendingHours: sendingHours.split(',').map(h => parseInt(h.trim())).filter(h => h >= 0 && h <= 23)
        })
      })

      if (!response.ok) throw new Error('Failed to schedule emails')

      const result = await response.json()
      setScheduleResult(result)
      toast.success(`Successfully scheduled ${result.totalScheduled} emails!`)
      setRecipients('')
      
      if (onScheduleComplete) {
        onScheduleComplete()
      }
    } catch (error) {
      console.error('Error scheduling emails:', error)
      toast.error('Failed to schedule emails')
    } finally {
      setScheduling(false)
      setRecipientListToSchedule([])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Auto-Schedule Batch Emails
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Automatically distribute emails across safe time slots
        </p>
      </div>

      <div className="bg-card/50 rounded-xl p-4 border border-border/30 space-y-4">
        <div>
          <Label htmlFor="recipients">
            Recipients (one per line: email, company, name)
          </Label>
          <textarea
            id="recipients"
            className="w-full min-h-[150px] rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder={`buyer1@company1.com, Company 1, John Doe
buyer2@company2.com, Company 2
buyer3@company3.com`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: email, company (optional), name (optional)
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dailyLimit">Daily Limit</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              min="1"
              max="500"
            />
          </div>

          <div>
            <Label htmlFor="emailsPerHour">Emails/Hour</Label>
            <Input
              id="emailsPerHour"
              type="number"
              value={emailsPerHour}
              onChange={(e) => setEmailsPerHour(e.target.value)}
              min="1"
              max="100"
            />
          </div>

          <div>
            <Label htmlFor="sendingHours">Sending Hours</Label>
            <Input
              id="sendingHours"
              value={sendingHours}
              onChange={(e) => setSendingHours(e.target.value)}
              placeholder="9,10,11,14,15,16"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hours: 0-23
            </p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <p className="text-xs font-semibold text-primary mb-2">📊 Smart Scheduling Features:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Skips weekends automatically</li>
            <li>• Distributes emails evenly across preferred hours</li>
            <li>• Randomizes minutes to appear natural</li>
            <li>• Respects daily and hourly limits</li>
            <li>• Maximizes inbox placement probability</li>
          </ul>
        </div>

        <Button
          onClick={handleAutoScheduleClick}
          disabled={scheduling || !recipients.trim()}
          className="w-full gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          {scheduling ? 'Scheduling...' : 'Auto-Schedule Emails'}
        </Button>
      </div>

      {scheduleResult && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <h4 className="font-semibold text-green-900 mb-2">✓ Schedule Created</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p>Total Emails: {scheduleResult.totalScheduled}</p>
            <p>Start Date: {scheduleResult.stats?.startDate}</p>
            <p>End Date: {scheduleResult.stats?.endDate}</p>
            <p>Total Days: {scheduleResult.stats?.totalDays}</p>
            <p>Avg/Day: {scheduleResult.stats?.avgPerDay}</p>
          </div>
        </div>
      )}

      {/* Schedule Confirmation Dialog */}
      <AlertDialog open={confirmScheduleOpen} onOpenChange={setConfirmScheduleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schedule Emails?</AlertDialogTitle>
            <AlertDialogDescription>
              Schedule emails for {recipientListToSchedule.length} recipients? 
              The system will automatically distribute them across safe time slots based on your settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAutoSchedule}>Schedule Emails</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

