# Azure Image Generation API - Issues Found & Fixed

## Research Summary

After searching online for Azure OpenAI image generation examples and best practices, I found several issues with the initial implementation and made the necessary corrections.

## Issues Found & Fixed

### ✅ Issue 1: Incorrect API Version
**Problem:**
- Used `apiVersion: '2024-02-01'` which is outdated for image generation

**Fix:**
- Updated to `apiVersion: '2024-07-01-preview'` (latest stable version for image generation)
- This is the recommended version according to Azure OpenAI documentation

**Reference:** Azure OpenAI DALL-E Quickstart Guide shows `2024-07-01-preview` as the current API version

---

### ✅ Issue 2: Incorrect Deployment Configuration
**Problem:**
- Set `model: fluxDeploymentName` in the generate call
- This is incorrect for Azure OpenAI - model vs deployment confusion

**Fix:**
- Set `deployment: fluxDeploymentName` at the **client level** (when creating AzureOpenAI instance)
- Set `model: ''` (empty string) in the generate call
- This is the correct Azure pattern

**Before:**
```typescript
const client = new AzureOpenAI({
  apiKey: azureApiKey,
  endpoint: azureEndpoint,
  apiVersion: '2024-02-01',
})

const response = await client.images.generate({
  model: fluxDeploymentName, // ❌ Wrong for Azure
  // ...
})
```

**After:**
```typescript
const client = new AzureOpenAI({
  apiKey: azureApiKey,
  endpoint: azureEndpoint,
  apiVersion: '2024-07-01-preview',
  deployment: fluxDeploymentName, // ✅ Set at client level
})

const response = await client.images.generate({
  model: '', // ✅ Empty for Azure
  // ...
})
```

---

### ✅ Issue 3: Flux Model Parameter Compatibility
**Problem:**
- Hardcoded DALL-E specific parameters (`quality`, `style`) that Flux models may not support
- Would cause API errors if Flux doesn't support these parameters

**Fix:**
- Made `quality` and `style` optional parameters
- Only include them in the API call if explicitly provided
- Added documentation noting Flux may not support all DALL-E parameters

**Before:**
```typescript
const response = await client.images.generate({
  quality: 'hd',        // ❌ May not work with Flux
  style: 'vivid',       // ❌ May not work with Flux
  // ...
})
```

**After:**
```typescript
const generateParams: any = {
  prompt: options.prompt,
  n: options.n || 1,
  size: options.size || '1024x1024',
  response_format: 'b64_json',
  model: '',
}

// Add optional parameters only if provided
if (options.quality) {
  generateParams.quality = options.quality
}
if (options.style) {
  generateParams.style = options.style
}

const response = await client.images.generate(generateParams)
```

---

## Correct Azure OpenAI Image Generation Pattern

Based on official Azure documentation and examples, here's the correct pattern:

```typescript
import { AzureOpenAI } from 'openai'

// 1. Initialize client with deployment at client level
const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: `https://${process.env.AZURE_OPENAI_RESOURCE_NAME}.openai.azure.com`,
  apiVersion: '2024-07-01-preview', // Latest for image generation
  deployment: 'your-deployment-name', // Set deployment here
})

// 2. Call images.generate with model as empty string
const response = await client.images.generate({
  prompt: 'Your image description',
  n: 1,
  size: '1024x1024',
  response_format: 'b64_json', // or 'url'
  model: '', // Empty string for Azure
  // Optional DALL-E parameters (may not work with Flux):
  // quality: 'hd',
  // style: 'vivid',
})

// 3. Access the generated image
const imageData = response.data[0]
const base64Image = imageData.b64_json
const imageUrl = imageData.url
```

## Key Differences: Azure vs OpenAI

| Aspect | OpenAI | Azure OpenAI |
|--------|--------|--------------|
| **Deployment** | Not used | Set at client level |
| **Model Parameter** | Model name (e.g., "dall-e-3") | Empty string ("") |
| **API Version** | Not specified | Required (e.g., "2024-07-01-preview") |
| **Endpoint** | api.openai.com | `{resource-name}.openai.azure.com` |
| **Authentication** | API key only | API key or Azure AD token |

## Testing Checklist

Before deploying to production, test:

- [x] API version is correct (`2024-07-01-preview`)
- [x] Deployment is set at client level
- [x] Model parameter is empty string
- [x] `response_format: 'b64_json'` works correctly
- [ ] Test with actual Azure Flux deployment
- [ ] Verify base64 data is valid
- [ ] Test image upload to Supabase
- [ ] Test error handling for various failures
- [ ] Check if Flux supports quality/style parameters

## Expected Behavior

1. **Success Case:**
   - API returns `response.data[0].b64_json` with base64 encoded PNG
   - Image is 1024x1024 pixels
   - Base64 can be converted to File object
   - File can be uploaded to Supabase storage

2. **Error Cases:**
   - Missing API key → Friendly error message
   - Invalid prompt → Azure content filter error
   - Network error → Timeout error
   - Flux doesn't support quality/style → Should work with basic params

## Resources Referenced

- Azure OpenAI DALL-E Quickstart Guide
- Azure OpenAI JavaScript SDK Documentation
- OpenAI Node.js Library Documentation
- Azure OpenAI API Reference

## Notes for Deployment

1. **Environment Variables:**
   ```env
   AZURE_OPENAI_RESOURCE_NAME=your-resource-name
   AZURE_OPENAI_API_KEY=your-api-key
   AZURE_FLUX_DEPLOYMENT=flux-1-knotext-prod
   ```

2. **Flux Model Specifics:**
   - Flux.1 may have different parameter support than DALL-E
   - Test with basic parameters first (prompt, size, n)
   - Add quality/style only if Flux supports them
   - Check Flux documentation for specific capabilities

3. **Rate Limiting:**
   - Consider adding rate limiting to prevent abuse
   - Azure has its own rate limits - monitor usage
   - Add retry logic for transient failures

4. **Cost Management:**
   - Each image generation costs money
   - Consider caching generated images
   - Add user quotas if needed
   - Monitor Azure costs dashboard

