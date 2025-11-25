/**
 * OpenAI enrichment provider using Azure OpenAI via Vercel AI SDK
 * 
 * SAFETY RULES:
 * - AI is ONLY used for classification, categorization, normalization, and inference
 * - AI NEVER generates fake emails, names, phone numbers, or other critical contact data
 * - AI can only work with existing data to add labels, tags, categories, or infer location
 * - All critical fields (email, name, phone) must come from real sources (APIs or existing data)
 */

import { createClient } from '@supabase/supabase-js';
import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';

/**
 * Enrich with Azure OpenAI
 */
export async function enrichWithOpenAI(
  apiKey: string,
  stepName: string,
  entityType: 'organization' | 'contact' | 'item',
  entityId: string,
  config: any
): Promise<any> {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get Azure OpenAI configuration from environment or config
  const resourceName = config.resourceName || process.env.AZURE_OPENAI_RESOURCE_NAME;
  const deployment = config.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
  
  if (!resourceName) {
    throw new Error('AZURE_OPENAI_RESOURCE_NAME is required. Set it in config or environment variables.');
  }

  // Initialize Azure OpenAI client
  const azure = createAzure({
    resourceName: resourceName,
    apiKey: apiKey,
  });

  const model = azure(deployment);

  // ============================================================================
  // SAFE AI OPERATIONS - Only classification, categorization, normalization
  // ============================================================================

  if (stepName === 'normalize_title') {
    // Get contact title
    const { data: contact, error } = await supabase
      .from('leads_contacts')
      .select('title')
      .eq('id', entityId)
      .single();

    if (error || !contact) {
      throw new Error('Contact not found');
    }

    if (!contact.title) {
      return { normalized_title: null };
    }

    // Use Azure OpenAI to normalize job title (SAFE - only normalizing existing data)
    const prompt = `Normalize the following job title to a standard format. Return only the normalized title, nothing else.

Examples:
- "Senior Vice President - Human Nutrition" -> "Senior Vice President, Human Nutrition"
- "Sales Manager | Bulk Sales" -> "Sales Manager"
- "CEO & Founder" -> "Chief Executive Officer"
- "VP of Engineering" -> "Vice President of Engineering"

Title to normalize: ${contact.title}

Normalized title:`;

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a job title normalization assistant. Return only the normalized title, no explanations. Never generate fake data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 50,
      });

      const normalizedTitle = text.trim() || contact.title;

      return {
        normalized_title: normalizedTitle,
        original_title: contact.title,
      };
    } catch (error: any) {
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
  }

  if (stepName === 'classify_organization') {
    // Classify organization into industry categories (SAFE - only classification)
    const { data: org, error } = await supabase
      .from('leads_organizations')
      .select('name, domain, profile_data')
      .eq('id', entityId)
      .single();

    if (error || !org) {
      throw new Error('Organization not found');
    }

    const orgInfo = {
      name: org.name,
      domain: org.domain,
      description: org.profile_data?.description || '',
      website: org.profile_data?.website || '',
    };

    const prompt = `Analyze the following company information and classify it into industry categories. 
Return ONLY a JSON object with this structure:
{
  "industry_categories": ["category1", "category2"],
  "business_type": "manufacturer" | "distributor" | "retailer" | "service_provider" | "other",
  "tags": ["tag1", "tag2", "tag3"]
}

Company information:
- Name: ${orgInfo.name}
- Domain: ${orgInfo.domain || 'N/A'}
- Description: ${orgInfo.description || 'N/A'}
- Website: ${orgInfo.website || 'N/A'}

IMPORTANT: Only use information provided. Do NOT generate fake data. Return only the JSON object.`;

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a business classification assistant. Return only valid JSON. Never generate fake company names, emails, or contact information. Only classify based on provided data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        maxTokens: 300,
      });

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const classification = JSON.parse(jsonMatch[0]);

      return {
        industry_categories: classification.industry_categories || [],
        business_type: classification.business_type || null,
        tags: classification.tags || [],
        classified_at: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
  }

  if (stepName === 'infer_location') {
    // Infer location from existing data (SAFE - only inference from existing data)
    const { data: org, error } = await supabase
      .from('leads_organizations')
      .select('name, domain, profile_data')
      .eq('id', entityId)
      .single();

    if (error || !org) {
      throw new Error('Organization not found');
    }

    // Only infer if we have some location-related data
    const existingLocation = org.profile_data?.location || org.profile_data?.address || org.profile_data?.country;
    const domain = org.domain || '';

    if (!existingLocation && !domain) {
      return { inferred_location: null };
    }

    const prompt = `Based on the following company information, infer the most likely location (city, state/province, country).
Return ONLY a JSON object with this structure:
{
  "city": "city name or null",
  "state_province": "state/province or null",
  "country": "country code (ISO 2-letter) or null",
  "confidence": "high" | "medium" | "low"
}

Company information:
- Name: ${org.name}
- Domain: ${domain}
- Existing location data: ${existingLocation || 'N/A'}

IMPORTANT: Only infer from provided data. If insufficient information, set fields to null and confidence to "low". 
Do NOT generate fake addresses or locations. Return only the JSON object.`;

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a location inference assistant. Return only valid JSON. Never generate fake addresses or locations. Only infer from provided data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        maxTokens: 200,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const location = JSON.parse(jsonMatch[0]);

      return {
        inferred_location: {
          city: location.city || null,
          state_province: location.state_province || null,
          country: location.country || null,
          confidence: location.confidence || 'low',
        },
        inferred_at: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
  }

  if (stepName === 'categorize_market_item') {
    // Categorize market items (SAFE - only categorization)
    const { data: item, error } = await supabase
      .from('leads_market_items')
      .select('name, item_type, attributes')
      .eq('id', entityId)
      .single();

    if (error || !item) {
      throw new Error('Market item not found');
    }

    const prompt = `Categorize the following market item into appropriate categories and tags.
Return ONLY a JSON object with this structure:
{
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2"],
  "subcategory": "subcategory name or null"
}

Item information:
- Name: ${item.name}
- Type: ${item.item_type || 'N/A'}
- Attributes: ${JSON.stringify(item.attributes || {})}

IMPORTANT: Only categorize based on provided data. Do NOT generate fake item names or descriptions. Return only the JSON object.`;

    try {
      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a product categorization assistant. Return only valid JSON. Never generate fake product names or descriptions. Only categorize based on provided data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        maxTokens: 200,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const categorization = JSON.parse(jsonMatch[0]);

      return {
        categories: categorization.categories || [],
        tags: categorization.tags || [],
        subcategory: categorization.subcategory || null,
        categorized_at: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Azure OpenAI API error: ${error.message}`);
    }
  }

  throw new Error(`Unknown step name: ${stepName}`);
}

