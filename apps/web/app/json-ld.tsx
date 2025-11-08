// Structured Data for SEO/AEO
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://pitchivo.com/#website",
      url: "https://pitchivo.com/",
      name: "Pitchivo",
      description:
        "AI-powered B2B outreach platform for ingredient suppliers",
      publisher: {
        "@id": "https://pitchivo.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://pitchivo.com/faq?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://pitchivo.com/#organization",
      name: "Pitchivo",
      url: "https://pitchivo.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://pitchivo.com/logo.png",
      },
      sameAs: ["https://twitter.com/pitchivo", "https://linkedin.com/company/pitchivo"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@pitchivo.com",
        contactType: "Customer Service",
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Pitchivo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "999",
        priceCurrency: "USD",
        offerCount: "4",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: "3",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "AI-Generated Product Pages",
        "Built-in Buyer Databases",
        "Smart Cold Email Campaigns",
        "Precision Tracking",
        "Access Control",
        "Multi-link & QR Code Friendly",
        "Real-time Notifications",
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://pitchivo.com/",
        },
      ],
    },
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

