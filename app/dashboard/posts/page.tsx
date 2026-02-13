import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import PostsDataTable from '@/components/posts/posts-datatable';

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: admin } = await supabase
    .from('admins')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!admin) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Organization not found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch posts from Supabase
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
      .eq('admin_id', user.id)

    if (error) {
      return (
        <div className="container mx-auto py-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">Failed to load posts: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Enrich posts with statistics
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

    return <PostsDataTable initialPosts={enrichedPosts} />;
  } catch (error) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              {error instanceof Error ? error.message : 'An error occurred while loading posts'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
