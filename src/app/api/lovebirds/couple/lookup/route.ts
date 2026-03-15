import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const partner_a = req.nextUrl.searchParams.get('partner_a');
  const partner_b = req.nextUrl.searchParams.get('partner_b');

  if (!partner_a || !partner_b) {
    return NextResponse.json({ found: false, sessionCount: 0, lastSessionDate: null, coupleId: null });
  }

  try {
    const { data, error } = await supabase
      .from('lbs_sessions')
      .select('id, couple_id, created_at')
      .or(
        `and(partner_a.ilike.${partner_a},partner_b.ilike.${partner_b}),and(partner_a.ilike.${partner_b},partner_b.ilike.${partner_a})`
      )
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ found: false, sessionCount: 0, lastSessionDate: null, coupleId: null });
    }

    return NextResponse.json({
      found: true,
      sessionCount: data.length,
      lastSessionDate: new Date(data[0].created_at).toLocaleDateString(),
      coupleId: data[0].couple_id ?? data[0].id,
    });
  } catch {
    return NextResponse.json({ found: false, sessionCount: 0, lastSessionDate: null, coupleId: null });
  }
}
