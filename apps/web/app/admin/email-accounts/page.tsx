'use client'

import { useEffect, useState } from 'react'
import { Mail, Plus, Settings, Zap, TrendingUp, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface EmailAccount {
  id: number
  from_name: string
  from_email: string
  smtp_host: string
  smtp_port: number
  message_per_day: number
  type: string
  daily_sent_count: number
  is_smtp_success: boolean
  warmup_details?: {
    status: string
    warmup_reputation: string
  }
}

interface WarmupStats {
  date: string
  sent: number
  inbox: number
  spam: number
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [warmupStats, setWarmupStats] = useState<WarmupStats[]>([])

  // Warmup settings form
  const [warmupEnabled, setWarmupEnabled] = useState(false)
  const [totalWarmupPerDay, setTotalWarmupPerDay] = useState(35)
  const [dailyRampup, setDailyRampup] = useState(2)
  const [replyRatePercentage, setReplyRatePercentage] = useState(38)

  // Account settings form
  const [maxEmailPerDay, setMaxEmailPerDay] = useState(100)
  const [signature, setSignature] = useState('')
  const [bcc, setBcc] = useState('')
  const [timeToWait, setTimeToWait] = useState(3)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/email-accounts')
      if (!response.ok) throw new Error('Failed to load email accounts')
      
      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error loading email accounts:', error)
      toast.error('Failed to load email accounts')
    } finally {
      setLoading(false)
    }
  }

  async function loadWarmupStats(accountId: number) {
    try {
      const response = await fetch(`/api/admin/email-accounts/${accountId}/warmup-stats`)
      if (!response.ok) throw new Error('Failed to load warmup stats')
      
      const data = await response.json()
      setWarmupStats(data.stats || [])
    } catch (error) {
      console.error('Error loading warmup stats:', error)
      toast.error('Failed to load warmup stats')
    }
  }

  function openSettings(account: EmailAccount) {
    setSelectedAccount(account)
    setMaxEmailPerDay(account.message_per_day)
    setShowSettings(true)
  }

  function openWarmup(account: EmailAccount) {
    setSelectedAccount(account)
    setWarmupEnabled(account.warmup_details?.status === 'ACTIVE')
    setShowWarmup(true)
    loadWarmupStats(account.id)
  }

  async function updateAccountSettings() {
    if (!selectedAccount) return

    try {
      const response = await fetch(`/api/admin/email-accounts/${selectedAccount.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_email_per_day: maxEmailPerDay,
          signature,
          bcc,
          time_to_wait_in_mins: timeToWait,
        }),
      })

      if (!response.ok) throw new Error('Failed to update settings')

      toast.success('Account settings updated')
      setShowSettings(false)
      loadAccounts()
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    }
  }

  async function updateWarmupSettings() {
    if (!selectedAccount) return

    try {
      const response = await fetch(`/api/admin/email-accounts/${selectedAccount.id}/warmup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warmup_enabled: warmupEnabled,
          total_warmup_per_day: totalWarmupPerDay,
          daily_rampup: dailyRampup,
          reply_rate_percentage: replyRatePercentage,
        }),
      })

      if (!response.ok) throw new Error('Failed to update warmup settings')

      toast.success('Warmup settings updated')
      setShowWarmup(false)
      loadAccounts()
    } catch (error) {
      console.error('Error updating warmup:', error)
      toast.error('Failed to update warmup settings')
    }
  }

  async function reconnectFailedAccounts() {
    try {
      const response = await fetch('/api/admin/email-accounts/reconnect', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to reconnect accounts')

      toast.success('Reconnection initiated')
      setTimeout(loadAccounts, 2000) // Reload after 2 seconds
    } catch (error) {
      console.error('Error reconnecting accounts:', error)
      toast.error('Failed to reconnect accounts')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading email accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Mail className="h-8 w-8" />
                Email Accounts
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage email sending accounts and warmup settings
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={reconnectFailedAccounts}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reconnect Failed
              </Button>
              <Button onClick={() => toast.info('Add account feature coming soon')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No email accounts found</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first email account to start sending campaigns
              </p>
              <Button onClick={() => toast.info('Add account feature coming soon')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Email Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{account.from_name}</CardTitle>
                      <CardDescription className="mt-1">{account.from_email}</CardDescription>
                    </div>
                    <Badge
                      variant={account.is_smtp_success ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {account.is_smtp_success ? 'Connected' : 'Failed'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Limit</p>
                      <p className="text-lg font-semibold">{account.message_per_day}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sent Today</p>
                      <p className="text-lg font-semibold">{account.daily_sent_count}</p>
                    </div>
                  </div>

                  {/* Warmup Status */}
                  {account.warmup_details && (
                    <div className="bg-accent/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Warmup Status</span>
                        <Badge variant={account.warmup_details.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {account.warmup_details.status}
                        </Badge>
                      </div>
                      {account.warmup_details.warmup_reputation && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Reputation: </span>
                          <span className="font-medium">{account.warmup_details.warmup_reputation}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Server Info */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{account.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">SMTP:</span>
                      <span className="font-mono text-xs">{account.smtp_host}:{account.smtp_port}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openSettings(account)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openWarmup(account)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Warmup
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Configure settings for {selectedAccount?.from_email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="maxEmailPerDay">Max Emails Per Day</Label>
              <Input
                id="maxEmailPerDay"
                type="number"
                value={maxEmailPerDay}
                onChange={(e) => setMaxEmailPerDay(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeToWait">Time to Wait (minutes)</Label>
              <Input
                id="timeToWait"
                type="number"
                value={timeToWait}
                onChange={(e) => setTimeToWait(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bcc">BCC Email</Label>
              <Input
                id="bcc"
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="[email protected]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Email Signature</Label>
              <textarea
                id="signature"
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Best regards,&#10;Your Name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={updateAccountSettings}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warmup Dialog */}
      <Dialog open={showWarmup} onOpenChange={setShowWarmup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Warmup Settings</DialogTitle>
            <DialogDescription>
              Configure email warmup for {selectedAccount?.from_email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="warmupEnabled">Enable Warmup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically warm up this email account
                </p>
              </div>
              <Switch
                id="warmupEnabled"
                checked={warmupEnabled}
                onCheckedChange={setWarmupEnabled}
              />
            </div>

            {warmupEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalWarmupPerDay">Warmup Emails Per Day</Label>
                    <Input
                      id="totalWarmupPerDay"
                      type="number"
                      value={totalWarmupPerDay}
                      onChange={(e) => setTotalWarmupPerDay(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dailyRampup">Daily Ramp Up</Label>
                    <Input
                      id="dailyRampup"
                      type="number"
                      value={dailyRampup}
                      onChange={(e) => setDailyRampup(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="replyRatePercentage">Reply Rate (%)</Label>
                  <Input
                    id="replyRatePercentage"
                    type="number"
                    value={replyRatePercentage}
                    onChange={(e) => setReplyRatePercentage(parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              </>
            )}

            {/* Warmup Stats */}
            {warmupStats.length > 0 && (
              <div className="space-y-2">
                <Label>Last 7 Days Performance</Label>
                <div className="bg-accent/30 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {warmupStats.reduce((acc, s) => acc + s.sent, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {warmupStats.reduce((acc, s) => acc + s.inbox, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Inbox</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {warmupStats.reduce((acc, s) => acc + s.spam, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Spam</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarmup(false)}>
              Cancel
            </Button>
            <Button onClick={updateWarmupSettings}>
              <Zap className="h-4 w-4 mr-2" />
              Save Warmup Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

