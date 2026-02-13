'use server';

import { GoogleGenAI } from '@google/genai';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

const genAI = new GoogleGenAI({});

/**
 * Suggestion Category from Gemini
 */
export enum SuggestionCategory {
  GRAMMAR = 'GRAMMAR',
  TONE = 'TONE',
  STRATEGIC = 'STRATEGIC',
  CTA_ADVICE = 'CTA_ADVICE',
}

export interface ProofreadSuggestion {
  category: SuggestionCategory;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  context?: string;      // Relevant excerpt from content
  action?: string;       // How to fix it
}

export interface ProofreadResult {
  score: number;         // 0-100 quality score
  suggestions: ProofreadSuggestion[];
  summary: string;       // Overall feedback
  cta_feedback?: string; // CTA-specific feedback if enabled
}

/**
 * Context-Aware Proofreader using Gemini
 * Evaluates email content considering optional CTA
 */
export async function proofreadEmail(
  emailContent: string,
  ctaConfig?: {
    has_cta: boolean;
    cta_text?: string;
    cta_url?: string;
  },
  campaignGoal?: string
): Promise<any> {
  try {
    if (!emailContent || emailContent.trim() === '') {
      return createErrorResponse(new Error('Email content is required'));
    }

    if (!process.env.GEMINI_API_KEY) {
      return createErrorResponse(new Error('Gemini API key not configured'));
    }

    const model = 'gemini-3-flash-preview';

    // Build context-aware prompt
    let prompt = `You are a professional email copywriter and editor. Analyze this email content for quality and effectiveness.

CAMPAIGN GOAL: ${campaignGoal || 'General alumni communication'}

EMAIL CONTENT:
${emailContent}

${ctaConfig?.has_cta ? `
CTA BUTTON DETAILS:
- Button Text: "${ctaConfig.cta_text}"
- Destination: ${ctaConfig.cta_url}

Please evaluate:
1. Is the CTA clear and compelling given the email content?
2. Does the email content naturally lead to this CTA?
3. Is the CTA button text actionable?
` : `
NO CTA BUTTON configured.
- Should this email have a call-to-action?
- What action would benefit the recipient?
`}

Provide feedback in these categories:
1. GRAMMAR: Fix spelling, punctuation, syntax errors
2. TONE: Evaluate voice, clarity, professionalism
3. STRATEGIC: Content structure, persuasion, engagement
${ctaConfig?.has_cta ? '4. CTA_ADVICE: Button clarity, relevance, placement' : '4. CTA_ADVICE: Suggest if CTA would enhance this email'}

Format your response as JSON with this structure:
{
  "score": <0-100 integer>,
  "suggestions": [
    {
      "category": "GRAMMAR|TONE|STRATEGIC|CTA_ADVICE",
      "severity": "low|medium|high",
      "suggestion": "What to improve",
      "context": "Relevant excerpt (optional)",
      "action": "How to fix it"
    }
  ],
  "summary": "Overall feedback paragraph",
  "cta_feedback": "${ctaConfig?.has_cta ? 'CTA-specific insight' : 'Recommendation for CTA usage'}"
}`;

    // Call Gemini
    const result = await genAI.models.generateContent({
        model: model,
        contents: prompt
    });
    const responseText = result.text;

    // Parse JSON response
    let parsedResponse: ProofreadResult;
    try {
      // Extract JSON from response (in case Gemini adds extra text)
      const jsonMatch = responseText!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse Gemini response as JSON');
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      return createErrorResponse(new Error('Failed to parse proofreading feedback'));
    }

    // Validate response structure
    if (!parsedResponse.score || !Array.isArray(parsedResponse.suggestions)) {
      return createErrorResponse(new Error('Invalid proofreading response format'));
    }

    return createSuccessResponse(parsedResponse);
  } catch (error) {
    console.error('Error during proofreading:', error);
    return createErrorResponse(error);
  }
}

/**
 * Generate Social Media Summaries from Email Content
 * Context-aware: considers campaign goal and CTA
 */
export async function generateSocialSummaries(
  emailContent: string,
  campaignGoal: string,
  platforms: Array<'facebook' | 'whatsapp' | 'instagram' | 'twitter' | 'linkedin'> = [
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
  ]
): Promise<any> {
  try {
    if (!emailContent || emailContent.trim() === '') {
      return createErrorResponse(new Error('Email content is required'));
    }

    if (!process.env.GEMINI_API_KEY) {
      return createErrorResponse(new Error('Gemini API key not configured'));
    }

    const model = 'gemini-3-flash-preview';

    const platformRequirements = {
      facebook: { max_chars: 500, tone: 'friendly, engaging, community-focused' },
      whatsapp: { max_chars: 160, tone: 'concise, direct, conversational' },
      instagram: { max_chars: 300, tone: 'trendy, visual, hashtag-friendly' },
      twitter: { max_chars: 280, tone: 'punchy, witty, trending-aware' },
      linkedin: { max_chars: 1300, tone: 'professional, thought-leadership' },
    };

    let prompt = `Convert this email content into platform-specific social media posts.

CAMPAIGN GOAL: ${campaignGoal}
ORIGINAL EMAIL:
${emailContent}

Generate posts for these platforms:
${platforms
  .map(platform => {
    const req = platformRequirements[platform];
    return `- ${platform.toUpperCase()}: Max ${req.max_chars} characters, tone: ${req.tone}`;
  })
  .join('\n')}

Each post should:
1. Capture the key message from the email
2. Match the platform's style and audience
3. Be concise and engaging
4. Include relevant hashtags where appropriate
5. Include a call-to-action if suitable for the platform

Format as JSON:
{
  "summaries": [
    {
      "platform": "facebook|whatsapp|instagram|twitter|linkedin",
      "content": "Post content",
      "hashtags": ["tag1", "tag2"],
      "character_count": <number>,
      "optimal_posting_time": "Best time to post (optional)",
      "engagement_tip": "Strategy to boost engagement"
    }
  ]
}`;

    const result = await genAI.models.generateContent({
        model: model,
        contents: prompt
    });
    const responseText = result.text;

    let parsedResponse;
    try {
      const jsonMatch = responseText!.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse as JSON');
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse social summaries:', responseText);
      return createErrorResponse(new Error('Failed to generate social content'));
    }

    return createSuccessResponse(parsedResponse);
  } catch (error) {
    console.error('Error generating social summaries:', error);
    return createErrorResponse(error);
  }
}
