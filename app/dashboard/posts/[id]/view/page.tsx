import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPost, getPostStatistics } from '@/app/actions/posts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Edit2, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function PostViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch post details
  const postResult = await getPost(id);
  if (!postResult.success || !postResult.data) {
    return (
      <div className="container mx-auto py-6">
        <Link href="/dashboard/posts">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
        <p className="text-red-600">Post not found</p>
      </div>
    );
  }

  const post = postResult.data;

  // Fetch statistics
  const statsResult = await getPostStatistics(id);
  const stats = statsResult.success ? statsResult.data?.statistics : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/posts">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/dashboard/email-composer?postId=${id}&mode=edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Post Content */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{post.title || 'Untitled Post'}</CardTitle>
                  <p className="text-sm text-gray-500 mt-2">
                    Created on {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(post.post_status)}>
                  {post.post_status.charAt(0).toUpperCase() + post.post_status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Email Content</h3>
                <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap text-sm text-gray-700">
                  {post.content_body}
                </div>
              </div>

              {/* CTA Information */}
              {post.has_cta && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Call to Action</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">CTA Text</p>
                      <p className="font-medium text-blue-900">{post.cta_text}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">CTA URL</p>
                      <a
                        href={post.cta_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {post.cta_url}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with Statistics */}
        <div className="col-span-1 space-y-4">
          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats ? (
                <>
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-gray-600">Total Sent</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total_sent}</p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-gray-600">Delivered</p>
                    <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                    {stats.total_sent > 0 && (
                      <p className="text-xs text-green-700 mt-1">
                        {Math.round((stats.delivered / stats.total_sent) * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-600">Opened</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.opened}</p>
                    {stats.total_sent > 0 && (
                      <p className="text-xs text-purple-700 mt-1">
                        {Math.round((stats.opened / stats.total_sent) * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-orange-50 rounded p-3">
                    <p className="text-xs text-gray-600">Clicked</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.clicked}</p>
                    {stats.total_sent > 0 && (
                      <p className="text-xs text-orange-700 mt-1">
                        {Math.round((stats.clicked / stats.total_sent) * 100)}%
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No statistics yet</p>
              )}
            </CardContent>
          </Card>

          {/* Post Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <Badge className={getStatusColor(post.post_status)}>
                  {post.post_status.charAt(0).toUpperCase() + post.post_status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">Has CTA</p>
                <p className="text-sm">{post.has_cta ? '✓ Yes' : '✗ No'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Created</p>
                <p className="text-sm">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Last Updated</p>
                <p className="text-sm">
                  {new Date(post.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
