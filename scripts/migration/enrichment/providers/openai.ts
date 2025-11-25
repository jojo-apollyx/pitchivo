/**
 * OpenAI enrichment provider
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

/**
 * Enrich with OpenAI
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

  const openai = new OpenAI({
    apiKey: apiKey,
  });

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

    // Use OpenAI to normalize job title
    const model = config.model || 'gpt-4';
    const prompt = `Normalize the following job title to a standard format. Return only the normalized title, nothing else.

Examples:
- "Senior Vice President - Human Nutrition" -> "Senior Vice President, Human Nutrition"
- "Sales Manager | Bulk Sales" -> "Sales Manager"
- "CEO & Founder" -> "Chief Executive Officer"
- "VP of Engineering" -> "Vice President of Engineering"

Title to normalize: ${contact.title}

Normalized title:`;

    try {
      const completion = await openai.chat.completions.create({
        model: model,
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
        max_tokens: 50,
      });

      const normalizedTitle = completion.choices[0]?.message?.content?.trim() || contact.title;

      return {
        normalized_title: normalizedTitle,
        original_title: contact.title,
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  throw new Error(`Unknown step name: ${stepName}`);
}

