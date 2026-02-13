'use server';

import { createClient } from '@/lib/supabase/server';
import { TransactionalEmailsApi } from '@getbrevo/brevo';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

const transactionApi = new TransactionalEmailsApi();
transactionApi.setApiKey(0, process.env.BREVO_API_KEY || '');

/**
 * Error Categorization for Transactional Email Operations
 */
export enum BroadcastErrorType {
  USER_ERROR = 'USER_ERROR',              // Invalid input, bad URL, etc.
  NETWORK_ERROR = 'NETWORK_ERROR',        // Connection issues - resumable
  SERVER_ERROR = 'SERVER_ERROR',          // API auth, rate limits, server errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',  // Schema/format errors
}

export interface BroadcastError {
  type: BroadcastErrorType;
  message: string;
  field?: string;                         // Which field caused the error
  action?: string;                        // Suggested action
  failedCount?: number;                   // For network errors: how many failed
  successCount?: number;                  // How many succeeded before failure
  resumeToken?: string;                   // For resumable errors
  failures?: { email: string; error: string }[]; // Optional list of failed recipients
}

/**
 * Validate CTA Configuration
 */
function validateCTA(cta: { has_cta: boolean; cta_text?: string; cta_url?: string }): BroadcastError | null {
  if (!cta.has_cta) return null; // CTA optional

  if (!cta.cta_text || cta.cta_text.trim() === '') {
    return {
      type: BroadcastErrorType.USER_ERROR,
      message: 'CTA text is required when CTA is enabled',
      field: 'cta_text',
      action: 'Fill in the CTA button label (e.g., "Donate Now")',
    };
  }

  if (!cta.cta_url || cta.cta_url.trim() === '') {
    return {
      type: BroadcastErrorType.USER_ERROR,
      message: 'CTA URL is required when CTA is enabled',
      field: 'cta_url',
      action: 'Provide a valid destination URL',
    };
  }

  // Basic URL validation
  try {
    new URL(cta.cta_url);
  } catch {
    return {
      type: BroadcastErrorType.USER_ERROR,
      message: `Invalid CTA URL: "${cta.cta_url}" is not a valid URL`,
      field: 'cta_url',
      action: 'URL must start with http:// or https://',
    };
  }

  return null;
}

/**
 * Generate Professional HTML Email Template
 * Wraps TipTap content and optionally appends CTA button
 */
function generateEmailTemplate(
  tiptapContent: string,
  ctaConfig: { has_cta: boolean; cta_text?: string; cta_url?: string },
  author?: string
): string {
  const ctaButton = ctaConfig.has_cta
    ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${ctaConfig.cta_url}" 
           style="display: inline-block; padding: 14px 32px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          ${ctaConfig.cta_text}
        </a>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; font-size: 24px; color: #000; }
    .content { margin: 30px 0; line-height: 1.8; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
    .footer p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      ${tiptapContent}
    </div>
    
    ${ctaButton}
    
    <div class="footer">
      <p>This email was sent to you by Alumni Relations System</p>
      <p>${author ? `Message from: ${author}` : ''}</p>
      <p><a href="{unsubscribe_url}" style="color: #007bff; text-decoration: none;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Broadcast Post to All Alumni via Transactional Email
 * Uses Brevo's `sendTransacEmail` API with rate limiting awareness
 */
export async function broadcastPost(
  postId: string,
  adminId: string,
  orgId: string,
  options?: {
    dryRun?: boolean;  // Don't actually send
    delayMs?: number;  // Delay between requests (for rate limiting)
  }
) {
  const supabase = await createClient();
  const { dryRun = false, delayMs = 100 } = options || {};

  try {
    // 1. Fetch post with CTA config
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return createErrorResponse({
        type: BroadcastErrorType.USER_ERROR,
        message: 'Post not found',
        action: 'Verify the post ID and try again',
      } as BroadcastError);
    }

    // 2. Validate CTA if enabled
    const ctaValidationError = validateCTA({
      has_cta: post.has_cta,
      cta_text: post.cta_text,
      cta_url: post.cta_url,
    });

    if (ctaValidationError) {
      return createErrorResponse(ctaValidationError);
    }

    // 3. Fetch all alumni with emails
    const { data: alumni, error: alumniError } = await supabase
      .from('alumni_list')
      .select('id, full_name, email')
      .eq('org_id', orgId)
      .not('email', 'is', null);

    if (alumniError || !alumni || alumni.length === 0) {
      return createErrorResponse({
        type: BroadcastErrorType.USER_ERROR,
        message: 'No alumni with email addresses found in this organization',
        action: 'Add email addresses to alumni records in the database',
      } as BroadcastError);
    }

    // 4. Generate email template
    const admin = await supabase.from('admins').select('full_name').eq('id', adminId).single();
    const senderName = admin.data?.full_name || 'Alumni Admin';

    const htmlContent = generateEmailTemplate(
      post.content_body,
      {
        has_cta: post.has_cta,
        cta_text: post.cta_text,
        cta_url: post.cta_url,
      },
      senderName
    );

    if (dryRun) {
      return createSuccessResponse({
        message: 'Dry run successful',
        recipient_count: alumni.length,
        preview_html: htmlContent.substring(0, 500),
      });
    }

    // 5. Send to all alumni with rate limiting
    let successCount = 0;
    let failureCount = 0;
    const failures: { email: string; error: string }[] = [];

    for (let i = 0; i < alumni.length; i++) {
      const alum = alumni[i];

      try {
        // Send transactional email
        const result = await transactionApi.sendTransacEmail({
          sender: {
            name: senderName,
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@alumni.edu',
          },
          to: [
            {
              email: alum.email!,
              name: alum.full_name || 'Alumnus',
            },
          ],
          subject: post.title || 'Alumni Communication',
          htmlContent,
          replyTo: {
            email: process.env.BREVO_REPLY_EMAIL || 'noreply@alumni.edu',
          },
        });


        const messageId = result?.body?.messageId;

        // Log successful send
        await supabase.from('transactional_logs').insert({
          id: uuidv4(),
          post_id: postId,
          alumni_id: alum.id,
          recipient_email: alum.email,
          status: 'sent',
          sent_at: new Date().toISOString(),
          brevo_message_id: messageId,
        });

        successCount++;

        // Rate limiting delay
        if (delayMs > 0 && i < alumni.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        failureCount++;
        failures.push({
          email: alum.email!,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Try to log failed attempt
        const { error: logError } = await supabase.from('transactional_logs').insert({
          id: uuidv4(),
          post_id: postId,
          alumni_id: alum.id,
          recipient_email: alum.email,
          status: 'bounced',
          bounced_at: new Date().toISOString(),
          bounce_reason: error instanceof Error ? error.message : 'Unknown error',
        });

        if (logError) {
          console.error('Failed to log broadcast error:', logError);
        }
      }
    }

    // 6. Determine overall result
    if (successCount === 0) {
      return createErrorResponse({
        type: BroadcastErrorType.SERVER_ERROR,
        message: `Failed to send to any alumni (${failureCount} attempts failed)`,
        action: 'Check API key configuration and Brevo account status',
        successCount: 0,
        failedCount: failureCount,
      } as BroadcastError);
    }

    // 7. Partial success (some sent, some failed)
    if (failureCount > 0) {
      return createSuccessResponse({
        type: BroadcastErrorType.NETWORK_ERROR,
        message: `Broadcast partially successful: ${successCount} sent, ${failureCount} failed`,
        successCount,
        failedCount: failureCount,
        failures: failures.slice(0, 10), // Return first 10 failures
        action: `${failureCount > 0 ? 'Retry sending to failed recipients?' : ''}`,
        resumeToken: postId, // Allow retry
      });
    }

    await supabase
          .from('posts')
          .update({ status: 'sent' })
          .eq('id', postId)

    // 8. Full success
    return createSuccessResponse({
      message: `Successfully broadcast to ${successCount} alumni`,
      recipient_count: successCount,
      post_id: postId,
    });
  } catch (error) {
    console.error('Error broadcasting post:', error);

    // Categorize caught errors
    let errorType = BroadcastErrorType.SERVER_ERROR;
    let message = 'An unexpected error occurred during broadcast';

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorType = BroadcastErrorType.SERVER_ERROR;
        message = 'Brevo API key is invalid or expired';
      } else if (error.message.includes('429') || error.message.includes('rate')) {
        errorType = BroadcastErrorType.NETWORK_ERROR;
        message = 'Rate limit exceeded. Please try again in a few moments';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        errorType = BroadcastErrorType.NETWORK_ERROR;
        message = 'Connection to Brevo failed. Please check your network';
      }
    }

    return createErrorResponse({
      type: errorType,
      message,
      action: 'Check configuration and try again',
    } as BroadcastError);
  }
}

/**
 * Retry broadcast to specific failed emails
 * Used when there were partial failures
 */
export async function retryBroadcast(postId: string, failedEmails: string[]) {
  const supabase = await createClient();

  try {
    // Fetch post
    const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single();
    if (!post) throw new Error('Post not found');

    // Fetch specific alumni by email
    const { data: alumni } = await supabase
      .from('alumni_list')
      .select('id, full_name, email')
      .in('email', failedEmails);

    if (!alumni || alumni.length === 0) {
      return createErrorResponse({
        type: BroadcastErrorType.USER_ERROR,
        message: 'No valid recipients found for retry',
      } as BroadcastError);
    }

    let successCount = 0;
    const failures: { email: string; error: string }[] = [];

    for (const alum of alumni) {
      try {
        await transactionApi.sendTransacEmail({
          sender: {
            name: 'Alumni Admin',
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@alumni.edu',
          },
          to: [{ email: alum.email!, name: alum.full_name }],
          subject: post.title,
          htmlContent: generateEmailTemplate(
            post.content_body,
            { has_cta: post.has_cta, cta_text: post.cta_text, cta_url: post.cta_url }
          ),
        });

        // Update log status
        await supabase
          .from('transactional_logs')
          .update({ status: 'sent' })
          .eq('post_id', postId)
          .eq('recipient_email', alum.email);

        successCount++;
      } catch (error) {
        failures.push({
          email: alum.email!,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return createSuccessResponse({
      message: `Retry completed: ${successCount} sent, ${failures.length} failed`,
      successCount,
      failedCount: failures.length,
      failures,
    });
  } catch (error) {
    console.error('Error during retry:', error);
    return createErrorResponse({
      type: BroadcastErrorType.SERVER_ERROR,
      message: 'Retry operation failed',
    } as BroadcastError);
  }
}
