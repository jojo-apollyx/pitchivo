import { NextRequest } from 'next/server'
import { getDefaultIndustry } from '@/lib/industries'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * DEPRECATED: Legacy Document Extraction Route
 * 
 * This route is maintained for backward compatibility.
 * It delegates to the new industry-specific route using the default industry.
 * 
 * NEW ROUTE: POST /api/[industry_code]/documents/extract
 * 
 * @deprecated Use industry-specific routes instead: /api/{industry_code}/documents/extract
 */
export async function POST(request: NextRequest) {
  // Delegate to the new industry-specific route with default industry
  const defaultIndustry = getDefaultIndustry() // 'food_supplement'
  
  console.log(`[Legacy Route] Delegating to /api/${defaultIndustry}/documents/extract`)
  
  // Clone the request body
  const body = await request.json()
  
  // Forward to the new industry-specific route
  const baseUrl = request.nextUrl.origin
  const newUrl = `${baseUrl}/api/${defaultIndustry}/documents/extract`
  
  const response = await fetch(newUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...Object.fromEntries(request.headers.entries())
    },
    body: JSON.stringify(body)
  })
  
  // Return the response from the new route
  const data = await response.json()
  return Response.json(data, { status: response.status })
}
