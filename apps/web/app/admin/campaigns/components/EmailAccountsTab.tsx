'use client'

import { useEffect, useState } from 'react'
import { Mail, Plus, Settings, Zap, RefreshCw } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'

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

export function EmailAccountsTab() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [warmupStats, setWarmupStats] = useState<WarmupStats[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Add account form
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState(465)
  const [imapHost, setImapHost] = useState('imap.gmail.com')
  const [imapPort, setImapPort] = useState(993)
  const [maxEmailPerDay, setMaxEmailPerDay] = useState(100)
  const [warmupEnabled, setWarmupEnabled] = useState(false)

  // Warmup settings form
  const [warmupEnabledEdit, setWarmupEnabledEdit] = useState(false)
  const [totalWarmupPerDay, setTotalWarmupPerDay] = useState(35)
  const [dailyRampup, setDailyRampup] = useState(2)
  const [replyRatePercentage, setReplyRatePercentage] = useState(38)

  // Account settings form
  const [maxEmailPerDayEdit, setMaxEmailPerDayEdit] = useState(100)
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
    setMaxEmailPerDayEdit(account.message_per_day)
    setShowSettings(true)
  }

  function openWarmup(account: EmailAccount) {
    setSelectedAccount(account)
    setWarmupEnabledEdit(account.warmup_details?.status === 'ACTIVE')
    setShowWarmup(true)
    loadWarmupStats(account.id)
  }

  function openAddAccount() {
    // Reset form
    setFromName('')
    setFromEmail('')
    setUserName('')
    setPassword('')
    setSmtpHost('smtp.gmail.com')
    setSmtpPort(465)
    setImapHost('imap.gmail.com')
    setImapPort(993)
    setMaxEmailPerDay(100)
    setWarmupEnabled(false)
    setShowAddAccount(true)
  }

  async function createAccount() {
    if (!fromName || !fromEmail || !userName || !password || !smtpHost || !imapHost) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_name: fromName,
          from_email: fromEmail,
          user_name: userName,
          password: password,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          imap_host: imapHost,
          imap_port: imapPort,
          max_email_per_day: maxEmailPerDay,
          warmup_enabled: warmupEnabled,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create email account')
      }

      toast.success('Email account created successfully')
      setShowAddAccount(false)
      loadAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create email account')
    } finally {
      setIsCreating(false)
    }
  }

  async function updateAccountSettings() {
    if (!selectedAccount) return

    try {
      const response = await fetch(`/api/admin/email-accounts/${selectedAccount.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_email_per_day: maxEmailPerDayEdit,
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
          warmup_enabled: warmupEnabledEdit,
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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Accounts
          </h2>
          <p className="text-muted-foreground mt-1">
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
          <Button onClick={openAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No email accounts found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first email account to start sending campaigns
            </p>
            <Button onClick={openAddAccount}>
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
                value={maxEmailPerDayEdit}
                onChange={(e) => setMaxEmailPerDayEdit(parseInt(e.target.value))}
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
                checked={warmupEnabledEdit}
                onCheckedChange={setWarmupEnabledEdit}
              />
            </div>

            {warmupEnabledEdit && (
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

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
            <DialogDescription>
              Add a new email account to Smartlead. Make sure you have the correct SMTP/IMAP credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name *</Label>
                <Input
                  id="fromName"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="[email protected]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userName">Username/Email *</Label>
              <Input
                id="userName"
                type="email"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="[email protected]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">App Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter app-specific password"
              />
              <p className="text-xs text-muted-foreground">
                For Gmail, use an App Password. For other providers, use your account password.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host *</Label>
                <Input
                  id="smtpHost"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port *</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                  placeholder="465"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imapHost">IMAP Host *</Label>
                <Input
                  id="imapHost"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imapPort">IMAP Port *</Label>
                <Input
                  id="imapPort"
                  type="number"
                  value={imapPort}
                  onChange={(e) => setImapPort(parseInt(e.target.value))}
                  placeholder="993"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxEmailPerDayNew">Max Emails Per Day</Label>
              <Input
                id="maxEmailPerDayNew"
                type="number"
                value={maxEmailPerDay}
                onChange={(e) => setMaxEmailPerDay(parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="warmupEnabledNew">Enable Warmup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically warm up this email account
                </p>
              </div>
              <Switch
                id="warmupEnabledNew"
                checked={warmupEnabled}
                onCheckedChange={setWarmupEnabled}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={createAccount} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

