import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get alumni from the organization
    const { data: alumni, error } = await supabase
      .from('alumni_list')
      .select('id, full_name, email, year_group, house_hall, engagement_score')
      .eq('org_id', orgId)
      .not('email', 'is', null)
      .order('full_name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alumni || []
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
