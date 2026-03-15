import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('lbs_partner_facts')
      .select('partner_name, facts')
      .eq('session_id', id);

    if (error || !data) {
      return NextResponse.json({ facts: [] });
    }

    return NextResponse.json({
      facts: data.map((d) => ({
        partner: d.partner_name,
        facts: d.facts ?? [],
      })),
    });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
