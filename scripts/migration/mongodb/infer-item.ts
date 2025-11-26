/**
 * Infer market item details from ingredient name using AI
 */

import { normalizeName } from '../shared/utils';
import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';


/**
 * Create a market item from ingredient name with AI-inferred details
 */
export async function createInferredMarketItem(
  ingredientName: string,
  purchaseDoc?: any
): Promise<any> {
  // Extract info from purchase document if available
  const form = purchaseDoc?.form || null;
  const concentration = purchaseDoc?.concentration || null;
  const processingMethod = purchaseDoc?.processing_method || null;
  const grade = purchaseDoc?.grade || null;
  const categories = purchaseDoc?.categories || [];
  const applications = purchaseDoc?.applications || [];
  const endUses = purchaseDoc?.end_uses || [];
  const productName = purchaseDoc?.product_name || null;
  const productDescription = purchaseDoc?.product_description || null;
  
  // Use AI to infer details if Azure OpenAI is configured
  let aiInferred: any = {};
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
  
  if (resourceName && apiKey) {
    try {
      const azure = createAzure({
        resourceName: resourceName,
        apiKey: apiKey,
      });
      const model = azure(deployment);
      
      const prompt = `Analyze the following ingredient/product name and infer appropriate details. Return ONLY a JSON object with this structure:
{
  "category": "category name or null",
  "item_type": "ingredient" or "product",
  "description": "brief description based on ingredient knowledge (2-3 sentences)",
  "aliases": ["common alias 1", "common alias 2"],
  "applications": ["application 1", "application 2"],
  "end_uses": ["end use 1", "end use 2"],
  "form": "Powder" or "Liquid" or "Extract" or "Capsule" or null,
  "category_hint": "additional category context"
}

Ingredient/Product Name: "${ingredientName}"
${productName ? `Full Product Name: "${productName}"` : ''}
${productDescription ? `Product Description: "${productDescription}"` : ''}
${form ? `Form (from purchase data): "${form}"` : ''}
${concentration ? `Concentration (from purchase data): "${concentration}"` : ''}
${processingMethod ? `Processing Method (from purchase data): "${processingMethod}"` : ''}
${categories.length > 0 ? `Categories (from purchase data): ${JSON.stringify(categories)}` : ''}
${applications.length > 0 ? `Applications (from purchase data): ${applications.join(', ')}` : ''}

IMPORTANT:
- Use your knowledge of ingredients, supplements, and food products
- Infer category based on ingredient type (e.g., "Garlic Extract" -> "Botanical Extracts", "Vitamin C" -> "Vitamins")
- Infer applications based on common uses (e.g., dietary supplements, food fortification, functional foods)
- Only include aliases that are commonly used for this ingredient
- Description should be factual and based on ingredient knowledge, not generic
- Return ONLY valid JSON, no markdown, no code blocks`;

      const { text } = await generateText({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an ingredient and product classification assistant. Return only valid JSON. Use your knowledge of ingredients, supplements, and food products to infer appropriate details. Never generate fake data - only use real knowledge about ingredients.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      } as any);
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiInferred = JSON.parse(jsonMatch[0]);
      }
    } catch (error: any) {
      console.warn(`    ⚠️  AI inference failed for "${ingredientName}": ${error.message}`);
      // Continue with empty aiInferred - will use purchase document data only
      aiInferred = {};
    }
  }
  // If AI not configured, aiInferred remains empty - will use purchase document data only
  
  // Merge AI-inferred data with purchase document data (purchase data takes precedence)
  const finalCategory = categories[0] || aiInferred.category || null;
  const finalItemType = aiInferred.item_type || 'ingredient'; // Default to ingredient if not inferred
  const finalForm = form || aiInferred.form || null;
  const finalDescription = productDescription || aiInferred.description || null;
  const finalAliases = aiInferred.aliases || [];
  const finalApplications = applications.length > 0 ? applications : (aiInferred.applications || []);
  const finalEndUses = endUses.length > 0 ? endUses : (aiInferred.end_uses || []);
  
  return {
    name: ingredientName,
    normalized_name: normalizeName(ingredientName),
    category: finalCategory,
    item_type: finalItemType,
    aliases: finalAliases,
    description: finalDescription,
    is_standard_ingredient: false,
    logo_url: null,
    attributes: {
      form: finalForm,
      grade: grade,
      concentration: concentration,
      processing_method: processingMethod,
      categories: categories.length > 0 ? categories : (finalCategory ? [finalCategory] : []),
      applications: finalApplications,
      end_uses: finalEndUses,
      specifications: {},
      certifications: [],
      inferred_from_purchase: true,
      source_ingredient_name: ingredientName,
      ai_inferred: !!resourceName && !!apiKey,
    },
  };
}

