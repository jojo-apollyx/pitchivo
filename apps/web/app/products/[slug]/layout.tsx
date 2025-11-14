import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  try {
    // Get product data
    const { data: product } = await supabase
      .from('products')
      .select('product_name, product_data, org_id, status')
      .eq('product_id', slug)
      .eq('status', 'published')
      .single()

    if (!product) {
      return {
        title: 'Product Not Found | Pitchivo',
        description: 'The requested product could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    // Parse product data
    const productData = typeof product.product_data === 'string'
      ? JSON.parse(product.product_data)
      : product.product_data || {}

    // Get organization info
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, domain')
      .eq('id', product.org_id)
      .single()

    const productName = product.product_name || 'Product'
    const manufacturer = productData.manufacturer_name || organization?.name || ''
    const category = productData.category || ''
    const originCountry = productData.origin_country || ''
    const form = productData.form || ''
    const grade = productData.grade || ''
    const casNumber = productData.cas_number || ''
    
    // Build comprehensive description for SEO/AEO (optimized for answer engines)
    const descriptionParts = [
      productName,
      category && `(${category})`,
      manufacturer && `manufactured by ${manufacturer}`,
      originCountry && `from ${originCountry}`,
      form && `available in ${form} form`,
      grade && `${grade} grade`,
      casNumber && `CAS Number: ${casNumber}`,
    ].filter(Boolean)
    
    // AEO-optimized description: Clear, factual, structured
    const description = productData.description || 
      `${descriptionParts.join(', ')}. High-quality ingredient supplier product${productData.applications && Array.isArray(productData.applications) && productData.applications.length > 0 ? ` suitable for ${productData.applications.slice(0, 3).join(', ')}` : ''}. Request a quote for pricing, minimum order quantity (MOQ), and lead times.`

    // Build SEO-optimized title (max 60 chars for best results)
    const titleParts = [
      productName,
      category && category.length < 20 ? category : null,
      manufacturer && manufacturer.length < 15 ? manufacturer : null,
    ].filter(Boolean)
    
    const title = titleParts.length > 1
      ? `${titleParts.join(' - ')} | Pitchivo`
      : `${productName} | Pitchivo`

    // Build SEO-optimized description (150-160 chars optimal)
    const metaDescription = description.length > 160
      ? description.substring(0, 157) + '...'
      : description

    // Build comprehensive keywords for SEO
    const keywords = [
      productName,
      category,
      manufacturer,
      originCountry,
      form,
      grade,
      casNumber,
      productData.botanical_name,
      ...(productData.applications || []),
      'ingredient supplier',
      'B2B product',
      'wholesale',
      'export',
      'bulk order',
      'MOQ',
      'lead time',
      'food ingredient',
      'supplement ingredient',
      'chemical raw material',
    ].filter(Boolean)

    // Get product image if available
    const productImages = productData.product_images || []
    const ogImage = productImages.length > 0 && typeof productImages[0] === 'string'
      ? productImages[0]
      : '/og-image.png'

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
    const productUrl = `${baseUrl}/products/${slug}`

    return {
      title,
      description: metaDescription,
      keywords: keywords.slice(0, 10), // Limit to 10 keywords
      authors: manufacturer ? [{ name: manufacturer }] : undefined,
      openGraph: {
        type: 'website',
        url: productUrl,
        title,
        description: metaDescription,
        siteName: 'Pitchivo',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${productName}${manufacturer ? ` by ${manufacturer}` : ''}`,
          },
        ],
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: metaDescription,
        images: [ogImage],
        creator: '@pitchivo',
      },
      alternates: {
        canonical: productUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
      other: {
        // Additional meta tags for AEO
        'product:name': productName,
        'product:category': category || '',
        'product:manufacturer': manufacturer || '',
        'product:country': originCountry || '',
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Product | Pitchivo',
      description: 'View product details on Pitchivo.',
    }
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

