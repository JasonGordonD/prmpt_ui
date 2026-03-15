import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('lbs_sessions')
      .select('session_summary, themes, tijoux_reflection, scorekeeper_final, duration')
      .eq('session_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({
        summary: null,
        themes: [],
        tijouxReflection: null,
        scorekeeperFinal: null,
        duration: null,
      });
    }

    return NextResponse.json({
      summary: data.session_summary,
      themes: data.themes ?? [],
      tijouxReflection: data.tijoux_reflection,
      scorekeeperFinal: data.scorekeeper_final,
      duration: data.duration,
    });
  } catch {
    return NextResponse.json({
      summary: null,
      themes: [],
      tijouxReflection: null,
      scorekeeperFinal: null,
      duration: null,
    });
  }
}
