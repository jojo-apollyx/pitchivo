'use client'

import { useMemo } from 'react'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'

interface ProductStructuredDataProps {
  productId: string
  productName: string
  productData: FoodSupplementProductData
  organizationName?: string | null
  organizationDomain?: string | null
}

export function ProductStructuredData({
  productId,
  productName,
  productData,
  organizationName,
  organizationDomain,
}: ProductStructuredDataProps) {
  const structuredData = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pitchivo.com'
    const productUrl = `${baseUrl}/products/${productId}`

    // Build offers array from price_lead_time
    const offers: any[] = []
    if (productData.price_lead_time && Array.isArray(productData.price_lead_time)) {
      productData.price_lead_time.forEach((tier: any) => {
        if (tier.price) {
          offers.push({
            '@type': 'Offer',
            price: tier.price,
            priceCurrency: 'USD', // Default, could be extracted from product data
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            moq: tier.moq || undefined,
            leadTime: tier.lead_time || undefined,
          })
        }
      })
    }

    // Build aggregate offer if multiple pricing tiers
    const aggregateOffer = offers.length > 0 ? {
      '@type': 'AggregateOffer',
      offerCount: offers.length.toString(),
      lowPrice: offers[0]?.price || '',
      highPrice: offers[offers.length - 1]?.price || '',
      priceCurrency: 'USD',
    } : undefined

    // Build comprehensive product schema for SEO/AEO
    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      name: productName,
      description: productData.description || `${productName} - High-quality ingredient supplier product${productData.category ? ` in the ${productData.category} category` : ''}${productData.manufacturer_name ? ` by ${productData.manufacturer_name}` : ''}${productData.origin_country ? ` from ${productData.origin_country}` : ''}.`,
      url: productUrl,
      image: productData.product_images && Array.isArray(productData.product_images) && productData.product_images.length > 0
        ? productData.product_images.map((img: any) => typeof img === 'string' ? img : img?.url || img)
        : undefined,
      brand: productData.manufacturer_name ? {
        '@type': 'Brand',
        name: productData.manufacturer_name,
      } : undefined,
      manufacturer: productData.manufacturer_name ? {
        '@type': 'Organization',
        name: productData.manufacturer_name,
      } : undefined,
      category: productData.category || undefined,
      sku: productData.cas_number || productId,
      mpn: productData.cas_number || undefined,
      gtin: productData.cas_number ? `CAS:${productData.cas_number}` : undefined,
      identifier: productData.cas_number ? {
        '@type': 'PropertyValue',
        name: 'CAS Number',
        value: productData.cas_number,
      } : undefined,
      countryOfOrigin: productData.origin_country ? {
        '@type': 'Country',
        name: productData.origin_country,
      } : undefined,
    }

    // Add offers
    if (offers.length === 1) {
      productSchema.offers = offers[0]
    } else if (aggregateOffer) {
      productSchema.offers = aggregateOffer
    }

    // Add additional properties for AEO (Answer Engine Optimization)
    const additionalProperties: any[] = []

    if (productData.origin_country) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Origin Country',
        value: productData.origin_country,
      })
    }

    if (productData.form) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Form',
        value: productData.form,
      })
    }

    if (productData.grade) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Grade',
        value: productData.grade,
      })
    }

    if (productData.applications && Array.isArray(productData.applications) && productData.applications.length > 0) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Applications',
        value: productData.applications.join(', '),
      })
      // Add as keywords for SEO
      productSchema.keywords = productData.applications.join(', ')
    }

    if (productData.assay) {
      additionalProperties.push({
        '@type': 'PropertyValue',
        name: 'Assay/Purity',
        value: productData.assay,
      })
    }

    if (additionalProperties.length > 0) {
      productSchema.additionalProperty = additionalProperties
    }

    // Add organization/seller info
    if (organizationName) {
      productSchema.seller = {
        '@type': 'Organization',
        name: organizationName,
        url: organizationDomain ? `https://${organizationDomain}` : undefined,
      }
    }

    // Add breadcrumb
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: `${baseUrl}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: productName,
          item: productUrl,
        },
      ],
    }

    // Add comprehensive FAQ schema for AEO (Answer Engine Optimization)
    const faqQuestions: any[] = [
      {
        '@type': 'Question',
        name: `What is ${productName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: productData.description || `${productName} is a high-quality ingredient product${productData.category ? ` in the ${productData.category} category` : ''}${productData.manufacturer_name ? ` manufactured by ${productData.manufacturer_name}` : ''}${productData.origin_country ? ` from ${productData.origin_country}` : ''}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Where is ${productName} manufactured?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: productData.origin_country
            ? `${productName} is manufactured in ${productData.origin_country}${productData.manufacturer_name ? ` by ${productData.manufacturer_name}` : ''}.`
            : `Manufacturing location information is available upon request.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the CAS number for ${productName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: productData.cas_number
            ? `The CAS number for ${productName} is ${productData.cas_number}.`
            : `CAS number information is available upon request.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the applications of ${productName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: productData.applications && Array.isArray(productData.applications) && productData.applications.length > 0
            ? `${productName} is used in: ${productData.applications.join(', ')}.`
            : `Application details are available upon request.`,
        },
      },
      {
        '@type': 'Question',
        name: `How can I request a quote for ${productName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `You can request a quote for ${productName} by clicking the "Request for Quotation (RFQ)" button on this page. Fill out the form with your requirements including quantity, target delivery date, and any specific specifications. We'll respond within 24 hours with pricing, MOQ (Minimum Order Quantity), and lead time information.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the price of ${productName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: productData.price_lead_time && Array.isArray(productData.price_lead_time) && productData.price_lead_time.length > 0
            ? `Pricing for ${productName} varies based on quantity (MOQ). Please request a quote for specific pricing information.`
            : `Pricing information is available upon request. Please use the RFQ form to get a customized quote based on your quantity requirements.`,
        },
      },
    ]

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqQuestions,
    }

    return {
      product: productSchema,
      breadcrumb: breadcrumbSchema,
      faq: faqSchema,
    }
  }, [productId, productName, productData, organizationName, organizationDomain])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData.faq) }}
      />
    </>
  )
}

