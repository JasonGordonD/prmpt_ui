import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data: sessions, error } = await supabase
      .from('lbs_sessions')
      .select('session_id, created_at, duration, themes, tijoux_reflection, scorekeeper_final')
      .eq('couple_id', id)
      .order('created_at', { ascending: true });

    if (error || !sessions || sessions.length === 0) {
      return NextResponse.json({
        themes: [],
        escalationTrend: [],
        sessionCount: 0,
        sessions: [],
      });
    }

    const allThemes = new Set<string>();
    const escalationTrend: number[] = [];
    const pastSessions = sessions.map((s) => {
      const themes = s.themes ?? [];
      themes.forEach((t: string) => allThemes.add(t));
      const peakEscalation = s.scorekeeper_final?.peakEscalation ?? 0;
      escalationTrend.push(peakEscalation);

      return {
        id: s.session_id,
        date: new Date(s.created_at).toLocaleDateString(),
        duration: s.duration ?? 'Unknown',
        themes,
        tijouxReflectionSnippet: s.tijoux_reflection
          ? s.tijoux_reflection.substring(0, 120) + (s.tijoux_reflection.length > 120 ? '...' : '')
          : '',
      };
    });

    const narrative =
      sessions.length >= 3
        ? `Across ${sessions.length} sessions, recurring patterns include ${Array.from(allThemes).slice(0, 3).join(', ')}. Escalation has ${escalationTrend[escalationTrend.length - 1] < escalationTrend[0] ? 'decreased' : 'remained consistent'} over time.`
        : undefined;

    return NextResponse.json({
      themes: Array.from(allThemes),
      escalationTrend,
      sessionCount: sessions.length,
      sessions: pastSessions,
      narrative,
    });
  } catch {
    return NextResponse.json({
      themes: [],
      escalationTrend: [],
      sessionCount: 0,
      sessions: [],
    });
  }
}
