import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('summary, themes, duration, framework, insights')
      .eq('session_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { summary: null, themes: [], duration: null, framework: null, insights: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      summary: data.summary,
      themes: data.themes ?? [],
      duration: data.duration,
      framework: data.framework,
      insights: data.insights ?? [],
    });
  } catch {
    return NextResponse.json(
      { summary: null, themes: [], duration: null, framework: null, insights: [] },
      { status: 200 }
    );
  }
}
