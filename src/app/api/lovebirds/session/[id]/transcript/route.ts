import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('lbs_transcripts')
      .select('messages')
      .eq('session_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: data.messages ?? [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
