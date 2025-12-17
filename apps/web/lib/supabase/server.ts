import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from './config'

export async function createClient() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()

  // Log cookie information for debugging
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies.filter(c => 
    c.name.includes('sb-') || 
    c.name.includes('supabase') || 
    c.name.includes('auth')
  )
  
  console.log('[Server Supabase Client] 🍪 COOKIES_CHECK', {
    timestamp: new Date().toISOString(),
    total_cookies: allCookies.length,
    auth_cookies_found: authCookies.length,
    auth_cookie_names: authCookies.map(c => c.name),
    supabase_config: {
      url: config.url,
      is_production: config.isProduction,
      key_length: config.anonKey.length
    }
  })

  return createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          if (name.includes('sb-') || name.includes('auth')) {
            console.log('[Server Supabase Client] 🍪 GET_COOKIE', {
              timestamp: new Date().toISOString(),
              name,
              has_value: !!value,
              value_length: value?.length || 0,
              value_preview: value ? value.substring(0, 20) + '...' : 'none'
            })
          }
          return value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
            if (name.includes('sb-') || name.includes('auth')) {
              console.log('[Server Supabase Client] 🍪 SET_COOKIE', {
                timestamp: new Date().toISOString(),
                name,
                value_length: value.length,
                options
              })
            }
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('[Server Supabase Client] ⚠️ SET_COOKIE_FAILED', {
              timestamp: new Date().toISOString(),
              name,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
            if (name.includes('sb-') || name.includes('auth')) {
              console.log('[Server Supabase Client] 🍪 REMOVE_COOKIE', {
                timestamp: new Date().toISOString(),
                name
              })
            }
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('[Server Supabase Client] ⚠️ REMOVE_COOKIE_FAILED', {
              timestamp: new Date().toISOString(),
              name,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        },
      },
    }
  )
}

