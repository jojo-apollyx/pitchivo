import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdminOrImpersonating, logApiAccess } from '@/lib/impersonation'
import { getUserProfile } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    // Validate admin access
    const context = await requireAdminOrImpersonating()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    
    // Validate target user exists
    const targetProfile = await getUserProfile(userId)
    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Set the impersonate cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonate_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })
    
    // LOG IMPERSONATION START
    await logApiAccess('/api/impersonate', 'POST', 'START_IMPERSONATION', {
      admin: {
        id: context.actualUserId,
      },
      target: {
        id: targetProfile.id,
        email: targetProfile.email,
        organization: targetProfile.organizations?.name,
      },
    })
    
    console.log('🚨 [IMPERSONATION STARTED]', {
      adminId: context.actualUserId,
      targetUserId: userId,
      targetEmail: targetProfile.email,
      targetOrg: targetProfile.organizations?.name,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({ 
      success: true,
      impersonating: {
        userId: targetProfile.id,
        email: targetProfile.email,
        organization: targetProfile.organizations?.name,
      },
    })
  } catch (error: any) {
    console.error('[Impersonate API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set impersonate session' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Get context before clearing (to log who ended impersonation)
    const context = await requireAdminOrImpersonating()
    
    // Clear the impersonate cookie
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    cookieStore.delete('impersonate_user_id')
    
    // LOG IMPERSONATION END
    await logApiAccess('/api/impersonate', 'DELETE', 'END_IMPERSONATION', {
      adminId: context.actualUserId,
      wasImpersonating: impersonateUserId,
    })
    
    console.log('✅ [IMPERSONATION ENDED]', {
      adminId: context.actualUserId,
      wasImpersonating: impersonateUserId,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Impersonate API] Error ending session:', error)
    // Still try to clear the cookie even on error
    const cookieStore = await cookies()
    cookieStore.delete('impersonate_user_id')
    
    return NextResponse.json(
      { error: error.message || 'Failed to clear impersonate session' },
      { status: 500 }
    )
  }
}

