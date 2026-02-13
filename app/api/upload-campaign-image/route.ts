import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadCampaignImage } from '@/app/actions/image-upload';
import { createSuccessResponse, createErrorResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('altText') as string;

    if (!file) {
      return NextResponse.json(
        createErrorResponse(new Error('No file provided')),
        { status: 400 }
      );
    }

    // Get org_id from session (you'll need to implement this based on your auth)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        createErrorResponse(new Error('User not authenticated')),
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        createErrorResponse(new Error('Organization not found')),
        { status: 404 }
      );
    }

    const result = await uploadCampaignImage(file, admin.org_id, altText);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error in upload API route:', error);
    return NextResponse.json(
      createErrorResponse(error),
      { status: 500 }
    );
  }
}