'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AGENTS } from '@/lib/agents';
import { StatusBar } from '@/components/shared/status-bar';
import { BaseTranscript, type TranscriptMessage } from '@/components/shared/base-transcript';
import { VisualizerWrapper } from '@/components/shared/visualizer-wrapper';
import { ControlBar } from '@/components/shared/control-bar';
import { Scorekeeper } from '@/components/lovebirds/scorekeeper';
import { SentimentBar } from '@/components/lovebirds/sentiment-bar';
import { IceCreamIndicator } from '@/components/lovebirds/ice-cream-indicator';
import { DiarizedMessageRenderer } from '@/components/lovebirds/diarized-transcript';
import { HandoffTransition } from '@/components/lovebirds/handoff-transition';
import { useNodeState } from '@/hooks/use-node-state';
import { useSentiment } from '@/hooks/use-sentiment';
import { useScorekeeper } from '@/hooks/use-scorekeeper';

const lovebirdsConfig = AGENTS.find((a) => a.id === 'lovebirds')!;

function LovebirdsSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId') || '';

  const [messages, setMessages] = useState<TranscriptMessage[]>(() => [
    { id: '1', role: 'agent', content: '[Raven] Welcome to your session. I am Raven, and I will be guiding you both through this conversation.' },
  ]);
  const [isFinished, setIsFinished] = useState(false);
  const [currentNode] = useState<string>('');
  const [isTijoux, setIsTijoux] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [reconnecting] = useState(false);

  useEffect(() => {
    if (!isFinished) {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isFinished]);

  const mockParticipant = {
    attributes: {
      current_node: currentNode,
      active_model: isTijoux ? 'Claude Sonnet 4.6' : 'Gemini 3 Flash',
      sentiment_data: '',
      scorekeeper_state: '',
      ice_cream_phase: '',
    },
  } as never;

  const nodeState = useNodeState(mockParticipant, lovebirdsConfig.nodeMap);
  const sentiment = useSentiment(mockParticipant);
  const scorekeeper = useScorekeeper(mockParticipant);
  const visualizerColor = isTijoux
    ? '#6b5b8d'
    : nodeState?.auraColor ?? lovebirdsConfig.theme.auraColor;

  const handleDisconnect = useCallback(() => {
    setIsFinished(true);
    if (sessionId) {
      router.push(`/lovebirds/session/${sessionId}`);
    } else {
      router.push('/lovebirds');
    }
  }, [router, sessionId]);

  const handleSendMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text },
    ]);
  }, []);

  const handleTransition = useCallback((isTijouxNow: boolean) => {
    setIsTijoux(isTijouxNow);
    if (isTijouxNow) {
      setMessages((prev) => [
        ...prev,
        { id: `divider-${Date.now()}`, role: 'agent', content: '[Dr. Tijoux] Thank you, Raven. I will take it from here for the clinical closing.' },
      ]);
    }
  }, []);

  if (reconnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Connection lost -- reconnecting...</p>
        </div>
      </div>
    );
  }

  return (
    <HandoffTransition currentNode={currentNode} onTransition={handleTransition}>
      <div className="flex flex-col h-screen">
        <StatusBar
          agentParticipant={mockParticipant}
          agentConfig={lovebirdsConfig}
          isConnected={true}
          isFinished={isFinished}
        />

        <SentimentBar data={sentiment} />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-[var(--border)] overflow-y-auto hidden lg:block">
            <Scorekeeper data={scorekeeper} isPaused={isTijoux} />
          </div>

          <div className="flex-1 overflow-hidden">
            <BaseTranscript
              messages={messages}
              messageRenderer={DiarizedMessageRenderer}
            />
          </div>

          <div className="w-64 border-l border-[var(--border)] flex flex-col items-center justify-center gap-4 p-4 hidden md:flex">
            <VisualizerWrapper
              color={visualizerColor}
              colorShift={lovebirdsConfig.theme.auraColorShift}
              state="idle"
              size="lg"
            />
          </div>
        </div>

        <IceCreamIndicator
          currentPhase={isTijoux ? 'Tijoux' : undefined}
          timerSeconds={timerSeconds}
        />

        <ControlBar
          controls={['microphone', 'chat', 'leave']}
          onDisconnect={handleDisconnect}
          onSendMessage={handleSendMessage}
        />
      </div>
    </HandoffTransition>
  );
}

export default function LovebirdsSessionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <LovebirdsSessionContent />
    </Suspense>
  );
}
