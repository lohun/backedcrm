import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SplitPaneEmailComposer from '@/components/campaigns/split-pane-email-composer';
import { getPost } from '@/app/actions/posts';

export default async function EmailComposerPage({
  searchParams,
}: {
  searchParams: Promise<{ postId?: string; mode?: string }>;
}) {
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
        <p>Organization not found. Please contact support.</p>
      </div>
    );
  }

  // Resolve searchParams
  const params = await searchParams;
  const { postId, mode } = params;

  // Fetch existing post if editing
  let initialPost = null;
  if (postId && mode === 'edit') {
    const result = await getPost(postId);
    if (result.success) {
      initialPost = result.data;
    }
  }

  return (
    <div className="h-screen w-full">
      <SplitPaneEmailComposer
        postId={initialPost?.id}
        initialTitle={initialPost?.title || ''}
        initialContent={initialPost?.content_body || ''}
        initialHasCta={initialPost?.has_cta || false}
        initialCtaText={initialPost?.cta_text || ''}
        initialCtaUrl={initialPost?.cta_url || ''}
        orgId={admin.org_id}
        adminId={user.id}
        // onPublish={(data) => {
        //   console.log('Published:', data);
        // }}
      />
    </div>
  );
}
