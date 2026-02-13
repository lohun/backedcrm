'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Eye } from 'lucide-react';

interface PostStats {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
}

interface Post {
  id: string;
  title: string | null;
  content_body: string;
  post_status: 'draft' | 'published' | 'sent';
  created_at: string;
  updated_at: string;
  has_cta: boolean;
  stats?: PostStats;
}

interface PostsDataTableProps {
  initialPosts: Post[];
}

export default function PostsDataTable({ initialPosts }: PostsDataTableProps) {
  const router = useRouter();
  const [posts] = useState<Post[]>(initialPosts);

  const handleCreatePost = () => {
    router.push('/dashboard/email-composer?mode=create');
  };

  const handleEditPost = (postId: string) => {
    router.push(`/dashboard/email-composer?postId=${postId}&mode=edit`);
  };

  const handleViewPost = (postId: string) => {
    router.push(`/dashboard/posts/${postId}/view`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100">Draft</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Published</Badge>;
      case 'sent':
        return <Badge className="bg-green-600">Sent</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, length: number = 50) => {
    return content.length > length ? `${content.substring(0, length)}...` : content;
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts & Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage all your email posts and campaigns</p>
        </div>
        <Button
          onClick={handleCreatePost}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No posts yet. Create your first post to get started.</p>
              <Button
                onClick={handleCreatePost}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Title</TableHead>
                    <TableHead className="w-2/5">Preview</TableHead>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead className="w-20">CTA</TableHead>
                    <TableHead className="w-24">Created</TableHead>
                    <TableHead className="w-32">Stats</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {post.title || 'Untitled'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {truncateContent(post.content_body, 60)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.post_status)}
                      </TableCell>
                      <TableCell>
                        {post.has_cta ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(post.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {post.stats && (
                          <div className="space-y-1">
                            <div className="text-gray-600">
                              <span className="font-semibold">{post.stats.total}</span> sent
                            </div>
                            {post.stats.total > 0 && (
                              <div className="text-xs text-gray-500">
                                <span className="font-semibold">{post.stats.opened}</span> opened,{' '}
                                <span className="font-semibold">{post.stats.clicked}</span> clicked
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post.id)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                          title="Edit post"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPost(post.id)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          title="View post"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
