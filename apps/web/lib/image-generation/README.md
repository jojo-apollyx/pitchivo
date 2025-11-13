# AI Product Image Generation

AI-powered product image generation using Azure Flux.1 deployment.

## Architecture

The image generation feature is structured with separation of concerns:

```
lib/image-generation/
├── service.ts           # Shared image generation service (Azure Flux.1)
└── README.md            # This file

lib/industries/{industry}/
└── image-prompts.ts     # Industry-specific prompt generation

app/api/products/
└── generate-image/
    └── route.ts         # API endpoint for image generation
```

## Features

- **AI-Powered Generation**: Uses Azure Flux.1 for high-quality product images
- **Industry-Specific Prompts**: Each industry has custom prompt templates
- **Automatic Upload**: Generated images are uploaded to Supabase storage
- **Fallback Support**: Returns base64 if storage is not configured
- **Premium Quality**: HD quality, 1024x1024 resolution, vivid style

## Usage

### From UI (Product Form)

Users can click the "AI Generate" button in the product images section. The button:
- Shows a tooltip explaining the feature
- Validates that minimum product data exists (name + details)
- Generates image based on product information
- Automatically adds it to the product images

### API Endpoint

```typescript
POST /api/products/generate-image

Body:
{
  "productData": {
    "product_name": "Ascorbic Acid 99%",
    "description": "Premium grade vitamin C...",
    "category": "Vitamins",
    "form": "Powder",
    "grade": "Food Grade",
    "appearance": "White to off-white powder",
    "applications": ["Dietary Supplements", "Functional Foods"]
  },
  "industryCode": "food_supplement"
}

Response:
{
  "success": true,
  "image": {
    "url": "https://...",
    "filename": "product-xxx.png",
    "storagePath": "user-id/products/product-xxx.png",
    "revised_prompt": "..."
  }
}
```

## Environment Variables

Required environment variables:

```env
AZURE_OPENAI_RESOURCE_NAME=your-resource-name
AZURE_OPENAI_API_KEY=your-api-key
AZURE_FLUX_DEPLOYMENT=flux-1-knotext-prod  # Optional, defaults to this
```

## Adding New Industries

To add image generation for a new industry:

1. **Create prompt template**:
```typescript
// lib/industries/{industry}/image-prompts.ts

export interface ProductImagePromptData {
  product_name: string
  // ... industry-specific fields
}

export function generate{Industry}ImagePrompt(data: ProductImagePromptData): string {
  // Build industry-specific prompt
  return `Professional product photography of ${data.product_name}...`
}

export function canGenerateProductImage(data: Partial<ProductImagePromptData>) {
  // Validate minimum required data
}
```

2. **Update API endpoint**:
```typescript
// app/api/products/generate-image/route.ts

if (industryCode === 'your_industry') {
  prompt = generateYourIndustryImagePrompt({
    // map fields
  })
}
```

3. **Add UI button** in the industry's form component

## Prompt Engineering

### Food Supplement Prompts

Food supplement prompts emphasize:
- **Purity**: Clean, pharmaceutical-grade presentation
- **Form Factor**: Powder, liquid, capsules, etc.
- **Professional**: B2B ingredient suppliers aesthetic
- **Scientific**: Trustworthy, laboratory-quality
- **Minimal**: No branding, clean backgrounds
- **High Quality**: Studio lighting, sharp focus

Example generated prompt:
```
Professional, high-quality product photography of Ascorbic Acid 99%, 
a food supplement ingredient. Fine powder in a clean glass container. 
The product has a white to off-white powder appearance. 
Emphasize pharmaceutical-grade quality. 

Professional studio lighting with clean white or light gray background. 
Sharp focus, high resolution, pharmaceutical-grade presentation.
Clean, minimal composition emphasizing product purity and quality.
No text, labels, or branding visible.
Photorealistic, commercial product photography style.
Professional, trustworthy, and scientific aesthetic.
Ideal for B2B ingredient suppliers and manufacturers.
```

## Storage

Generated images are stored in Supabase storage:
- Bucket: `product-images`
- Path: `{user_id}/products/{filename}`
- Format: PNG
- Quality: HD (high definition)
- Size: 1024x1024 (square)

If storage bucket doesn't exist, the API returns base64 data instead.

## Error Handling

The service handles various errors gracefully:
- Missing Azure configuration
- Insufficient product data
- Image generation failures
- Storage upload failures
- Network errors

All errors are logged and returned with meaningful messages.

## Performance

- Generation time: ~5-10 seconds
- File size: ~500KB-1MB (PNG)
- Resolution: 1024x1024px
- Concurrent requests: Handled by Azure

## Future Enhancements

Potential improvements:
- [ ] Multiple image variations
- [ ] Different aspect ratios (portrait, landscape)
- [ ] Style selection (minimal, detailed, lifestyle)
- [ ] Background removal option
- [ ] Batch generation for multiple products
- [ ] Image editing/refinement
- [ ] A/B testing different prompts

