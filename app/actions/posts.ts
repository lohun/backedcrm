'use server';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

interface SavePostInput {
  title?: string;
  content_body: string;
  featured_image_url?: string;
  has_cta: boolean;
  cta_text?: string;
  cta_url?: string;
  admin_id: string;
  org_id: string;
  project_id?: string;
  post_id?: string; // For updates
}

/**
 * Save or update a post with CTA configuration
 * Follows the transactional email schema
 */
export async function savePost(data: SavePostInput) {
  const supabase = await createClient();

  try {
    // Validate CTA if enabled
    if (data.has_cta) {
      if (!data.cta_text || !data.cta_text.trim()) {
        return createErrorResponse(new Error('CTA text is required when CTA is enabled'));
      }
      if (!data.cta_url || !data.cta_url.trim()) {
        return createErrorResponse(new Error('CTA URL is required when CTA is enabled'));
      }

      // Basic URL validation
      try {
        new URL(data.cta_url);
      } catch {
        return createErrorResponse(new Error(`Invalid CTA URL: ${data.cta_url}`));
      }
    }

    // Validate content
    if (!data.content_body || !data.content_body.trim()) {
      return createErrorResponse(new Error('Email content is required'));
    }
    console.log(data)

    if (data.post_id) {
      // Update existing post
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          title: data.title || null,
          content_body: data.content_body,
          media_url: data.featured_image_url || null,
          has_cta: data.has_cta,
          cta_text: data.has_cta ? data.cta_text : null,
          cta_url: data.has_cta ? data.cta_url : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.post_id);

      if (updateError) {
        return createErrorResponse(updateError);
      }

      return createSuccessResponse({
        post_id: data.post_id,
        message: 'Post updated successfully',
      });
    } else {
      // Create new post
      const postId = uuidv4();

      const { error: insertError } = await supabase.from('posts').insert({
        id: postId,
        platform_id: null, // Multi-platform/transactional
        admin_id: data.admin_id,
        project_id: data.project_id || null,
        title: data.title || null,
        content_body: data.content_body,
        media_url: data.featured_image_url || null,
        post_status: 'draft',
        has_cta: data.has_cta,
        cta_text: data.has_cta ? data.cta_text : null,
        cta_url: data.has_cta ? data.cta_url : null,
      });


      if (insertError) {
        return createErrorResponse(insertError);
      }

      return createSuccessResponse({
        post_id: postId,
        message: 'Post created successfully',
      });
    }
  } catch (error) {
    console.error('Error saving post:', error);
    return createErrorResponse(error);
  }
}

/**
 * Get post details for editing
 */
export async function getPost(postId: string) {
  const supabase = await createClient();

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return createErrorResponse(new Error('Post not found'));
    }

    return createSuccessResponse(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return createErrorResponse(error);
  }
}

/**
 * Get transactional logs for a post (statistics)
 */
export async function getPostStatistics(postId: string) {
  const supabase = await createClient();

  try {
    // Get post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return createErrorResponse(new Error('Post not found'));
    }

    // Get transactional logs
    const { data: logs, error: logsError } = await supabase
      .from('transactional_logs')
      .select('*')
      .eq('post_id', postId);

    if (logsError) {
      return createErrorResponse(logsError);
    }

    // Calculate statistics
    const stats = {
      total_sent: logs?.length || 0,
      delivered: logs?.filter(l => l.status === 'delivered').length || 0,
      opened: logs?.filter(l => l.status === 'opened').length || 0,
      clicked: logs?.filter(l => l.status === 'clicked').length || 0,
      bounced: logs?.filter(l => l.status === 'bounced').length || 0,
      blocked: logs?.filter(l => l.status === 'blocked').length || 0,
      open_rate: 0,
      click_rate: 0,
      logs: logs || [],
    };

    // Calculate rates
    if (stats.total_sent > 0) {
      stats.open_rate = Math.round((stats.opened / stats.total_sent) * 100);
      stats.click_rate = Math.round((stats.clicked / stats.total_sent) * 100);
    }

    return createSuccessResponse({
      post,
      statistics: stats,
    });
  } catch (error) {
    console.error('Error fetching post statistics:', error);
    return createErrorResponse(error);
  }
}

/**
 * Get all posts for an organization with statistics
 */
export async function getOrganizationPosts(orgId: string) {
  const supabase = await createClient();

  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        transactional_logs(
          status
        )
        `
      )
      .eq('admin_id', (await supabase.auth.getUser()).data.user?.id)
      // Filter by org_id through admin relation
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse(error);
    }

    // Enrich with statistics
    const enrichedPosts = (posts || []).map((post: any) => {
      const logs = post.transactional_logs || [];
      return {
        ...post,
        stats: {
          total: logs.length,
          delivered: logs.filter((l: any) => l.status === 'delivered').length,
          opened: logs.filter((l: any) => l.status === 'opened').length,
          clicked: logs.filter((l: any) => l.status === 'clicked').length,
        },
      };
    });

    return createSuccessResponse(enrichedPosts);
  } catch (error) {
    console.error('Error fetching organization posts:', error);
    return createErrorResponse(error);
  }
}
