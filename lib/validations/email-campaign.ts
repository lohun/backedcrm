import { z } from 'zod';

// Email Campaign Validation Schemas
export const emailCampaignSchema = z.object({
  subject_line: z.string().min(1, 'Subject line is required').max(200, 'Subject line must be less than 200 characters'),
  preview_text: z.string().max(500, 'Preview text must be less than 500 characters').optional(),
  content_body: z.string().min(1, 'Email content is required'),
  featured_image_url: z.string().url('Invalid image URL').optional().nullable(),
  cta_button_text: z.string().min(1, 'CTA button text is required').max(50, 'CTA text must be less than 50 characters'),
  cta_button_link: z.string().url('Invalid CTA link').optional().nullable(),
  campaign_goal: z.string().min(1, 'Campaign goal is required').max(500, 'Campaign goal must be less than 500 characters'),
  project_id: z.string().uuid().optional().nullable(),
  scheduled_for: z.string().datetime().optional().nullable(),
});

export const campaignRecipientsSchema = z.object({
  alumni_ids: z.array(z.string().uuid()).min(1, 'At least one recipient must be selected'),
  filters: z.object({
    year_group: z.number().positive().optional(),
    department: z.string().optional(),
    engagement_score_min: z.number().min(0).max(100).optional(),
  }).optional(),
});

export const aiProofreaderSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  campaign_goal: z.string().min(1, 'Campaign goal is required'),
  tone: z.enum(['professional', 'casual', 'formal', 'friendly', 'urgent']).default('professional'),
  target_audience: z.string().optional(),
});

export const socialSummarySchema = z.object({
  email_content: z.string().min(1, 'Email content is required'),
  platforms: z.array(z.enum(['facebook', 'whatsapp', 'instagram', 'twitter', 'linkedin'])).min(1, 'Select at least one platform'),
  campaign_goal: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'urgent']).default('professional'),
});

export const emailTemplateSchema = z.object({
  template_name: z.string().min(1, 'Template name is required').max(100, 'Template name must be less than 100 characters'),
  template_description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  html_template: z.string().min(1, 'HTML template is required'),
  subject_template: z.string().max(200, 'Subject template must be less than 200 characters').optional(),
  preview_text_template: z.string().max(500, 'Preview text must be less than 500 characters').optional(),
  cta_button_text: z.string().max(50, 'CTA text must be less than 50 characters').default('Learn More'),
  template_category: z.enum(['fundraising', 'event', 'newsletter', 'announcement', 'general']).default('general'),
});

// File upload validation for featured images
export const imageUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024, // 5MB
    'Image size must be less than 5MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
    'Only JPEG, PNG, GIF, and WebP images are allowed'
  ),
  alt_text: z.string().max(200, 'Alt text must be less than 200 characters').optional(),
});

// Campaign analytics filters
export const campaignAnalyticsSchema = z.object({
  date_range: z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
  }).optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed']).optional(),
  campaign_goal: z.string().optional(),
});

// Types derived from schemas
export type EmailCampaignInput = z.infer<typeof emailCampaignSchema>;
export type CampaignRecipientsInput = z.infer<typeof campaignRecipientsSchema>;
export type AIProofreaderInput = z.infer<typeof aiProofreaderSchema>;
export type SocialSummaryInput = z.infer<typeof socialSummarySchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type CampaignAnalyticsInput = z.infer<typeof campaignAnalyticsSchema>;