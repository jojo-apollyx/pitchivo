import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pitchivo.com'
  const currentDate = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Fetch all published products for dynamic sitemap
  let productPages: MetadataRoute.Sitemap = []
  
  try {
    // Create Supabase client with service role key for sitemap generation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all published products
    const { data: products, error } = await supabase
      .from('products')
      .select('product_id, updated_at, product_name, product_data')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching products for sitemap:', error)
    } else if (products && products.length > 0) {
      console.log(`✅ Adding ${products.length} published products to sitemap`)
      
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.product_id}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8, // High priority for product pages
      }))
    }
  } catch (error) {
    console.error('Error generating product sitemap entries:', error)
  }

  // Combine static and dynamic pages
  return [...staticPages, ...productPages]
}

