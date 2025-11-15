'use client'

import { Mail, Briefcase } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface TeamMember {
  email: string
  fullName: string | null
  orgRole: string | null
  userId: string
}

interface TeamMembersListProps {
  members: TeamMember[]
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

function formatRole(role: string | null): string {
  if (!role) return 'No role'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No team members found
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0 divide-y divide-border/30">
      {members.map((member) => (
        <div
          key={member.userId}
          className="px-4 py-4 hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(member.fullName, member.email)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-base font-medium truncate">
                  {member.fullName || member.email}
                </p>
                {member.fullName && (
                  <span className="text-sm text-muted-foreground truncate">
                    ({member.email})
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{member.email}</span>
                </div>
                
                {member.orgRole && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {formatRole(member.orgRole)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

