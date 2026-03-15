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
import { useNodeState } from '@/hooks/use-node-state';
import { Copy, Download } from 'lucide-react';

const minkaConfig = AGENTS.find((a) => a.id === 'minka')!;

function MinkaSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId') || '';

  const [messages, setMessages] = useState<TranscriptMessage[]>(() => [
    { id: '1', role: 'agent', content: 'Session connected. Waiting for agent...' },
  ]);
  const [isFinished, setIsFinished] = useState(false);
  const [agentState] = useState<string>('idle');
  const [currentNode] = useState<string>('');
  const [activeModel] = useState<string>('');

  const mockParticipant = {
    attributes: {
      current_node: currentNode,
      active_model: activeModel,
    },
  } as never;

  const nodeState = useNodeState(mockParticipant, minkaConfig.nodeMap);
  const visualizerColor = nodeState?.auraColor ?? minkaConfig.theme.auraColor;

  const handleDisconnect = useCallback(() => {
    setIsFinished(true);
    if (sessionId) {
      router.push(`/minka/session/${sessionId}`);
    } else {
      router.push('/minka');
    }
  }, [router, sessionId]);

  const handleSendMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: text },
    ]);
  }, []);

  const handleCopyTranscript = useCallback(async () => {
    const text = messages.map((m) => `[${m.role === 'agent' ? 'Agent' : 'You'}] ${m.content}`).join('\n\n');
    await navigator.clipboard.writeText(text);
  }, [messages]);

  const handleExportTranscript = useCallback(() => {
    const text = `# Minka Moor Session Transcript\n\n${messages.map((m) => `[${m.role === 'agent' ? 'Agent' : 'You'}] ${m.content}`).join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minka-transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      <StatusBar
        agentParticipant={mockParticipant}
        agentConfig={minkaConfig}
        isConnected={true}
        isFinished={isFinished}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-center py-6">
            <VisualizerWrapper
              color={visualizerColor}
              colorShift={minkaConfig.theme.auraColorShift}
              state={agentState}
              size="xl"
            />
          </div>

          <div className="flex-1 overflow-hidden">
            <BaseTranscript messages={messages} />
          </div>
        </div>

        <div className="w-64 border-l border-[var(--border)] flex flex-col gap-4 p-4 overflow-y-auto hidden lg:flex">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Files</h3>
            <FileUpload />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Transcript</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy transcript
              </button>
              <button
                onClick={handleExportTranscript}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export transcript
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Devices</h3>
            <AgentTrackControl trackSource="microphone" />
          </div>
        </div>
      </div>

      <ControlBar
        controls={['microphone', 'chat', 'leave']}
        onDisconnect={handleDisconnect}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default function MinkaSessionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <MinkaSessionContent />
    </Suspense>
  );
}
