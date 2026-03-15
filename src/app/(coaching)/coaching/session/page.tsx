'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AGENTS } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { BaseTranscript, type TranscriptMessage } from '@/components/shared/base-transcript';
import { VisualizerWrapper } from '@/components/shared/visualizer-wrapper';
import { FileUpload } from '@/components/shared/file-upload';
import { ControlBar } from '@/components/shared/control-bar';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import { SessionNotes } from '@/components/coaching/session-notes';
import { FrameworkMessageRenderer } from '@/components/coaching/framework-renderer';

const coachingConfig = AGENTS.find((a) => a.id === 'coaching')!;

function CoachingSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId') || '';

  const [messages, setMessages] = useState<TranscriptMessage[]>(() => [
    { id: '1', role: 'agent', content: 'Session connected. Your coach will be with you shortly.' },
  ]);
  const [isFinished, setIsFinished] = useState(false);
  const [agentState] = useState<string>('idle');

  const mockParticipant = {
    attributes: {
      current_node: '',
      active_model: '',
    },
  } as never;

  const handleDisconnect = useCallback(() => {
    setIsFinished(true);
    if (sessionId) {
      router.push(`/coaching/session/${sessionId}`);
    } else {
      router.push('/coaching');
    }
  }, [router, sessionId]);

  const handleSendMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text },
    ]);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <StatusBar
        agentParticipant={mockParticipant}
        agentConfig={coachingConfig}
        isConnected={true}
        isFinished={isFinished}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[3] overflow-hidden">
          <BaseTranscript
            messages={messages}
            messageRenderer={FrameworkMessageRenderer}
          />
        </div>

        <div className="flex-[1] flex flex-col items-center justify-center border-x border-[var(--border)] p-4 hidden md:flex">
          <VisualizerWrapper
            color={coachingConfig.theme.auraColor}
            colorShift={coachingConfig.theme.auraColorShift}
            state={agentState}
            size="lg"
          />
        </div>

        <div className="flex-[1] border-l border-[var(--border)] flex flex-col gap-4 p-4 overflow-y-auto hidden lg:flex">
          <SessionNotes />

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Files</h3>
            <FileUpload />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Devices</h3>
            <AgentTrackControl trackSource="microphone" />
            <AgentTrackControl trackSource="camera" />
          </div>
        </div>
      </div>

      <ControlBar
        controls={['microphone', 'chat', 'device-select', 'leave']}
        onDisconnect={handleDisconnect}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default function CoachingSessionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CoachingSessionContent />
    </Suspense>
  );
}
