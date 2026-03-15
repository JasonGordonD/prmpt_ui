import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('minka_sessions')
      .select('summary, duration, node_transitions, themes')
      .eq('session_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { summary: null, duration: null, nodeTransitions: [], themes: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      summary: data.summary,
      duration: data.duration,
      nodeTransitions: data.node_transitions ?? [],
      themes: data.themes ?? [],
    });
  } catch {
    return NextResponse.json(
      { summary: null, duration: null, nodeTransitions: [], themes: [] },
      { status: 200 }
    );
  }
}
