/**
 * OpenAI enrichment provider using Azure OpenAI via Vercel AI SDK
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

    // Use Azure OpenAI to normalize job title
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
            content: 'You are a job title normalization assistant. Return only the normalized title, no explanations.',
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

  throw new Error(`Unknown step name: ${stepName}`);
}

