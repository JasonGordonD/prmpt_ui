'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  FileJson,
  Image as ImageIcon,
  Package,
  ChevronDown,
} from 'lucide-react';
import JSZip from 'jszip';
import type { ReceivedMessage } from '@livekit/components-core';
import type { IncomingByteStream } from '@/hooks/agents-ui/use-realtime-media-data';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

export type SessionExportProps = {
  messages: ReceivedMessage[];
  mediaStreams?: IncomingByteStream[];
  agentName?: string;
  disabled?: boolean;
  variant?: 'control-bar' | 'post-session';
  className?: string;
};

/* ─── Helpers ─── */

function getMessageText(msg: ReceivedMessage): string {
  if ('message' in msg && typeof msg.message === 'string') return msg.message;
  return '';
}

function getMessageSpeaker(msg: ReceivedMessage, agentName?: string): string {
  if (msg.type === 'agentTranscript') return agentName || 'Agent';
  if (msg.type === 'userTranscript') return 'You';
  if (msg.from?.name) return msg.from.name;
  return 'Chat';
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function sessionFilenameBase(agentName?: string): string {
  const name = (agentName || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  return `session_${name}_${date}_${time}`;
}

function serializePlainText(messages: ReceivedMessage[], agentName?: string): string {
  return messages
    .map((m) => {
      const time = formatTimestamp(m.timestamp);
      const speaker = getMessageSpeaker(m, agentName);
      const text = getMessageText(m);
      return `[${time}] ${speaker}: ${text}`;
    })
    .join('\n\n');
}

function serializeJson(messages: ReceivedMessage[], agentName?: string): string {
  const entries = messages.map((m) => ({
    timestamp: m.timestamp,
    time: formatTimestamp(m.timestamp),
    type: m.type,
    speaker: getMessageSpeaker(m, agentName),
    content: getMessageText(m),
    ...(m.from?.name ? { participantName: m.from.name } : {}),
  }));
  return JSON.stringify({ agentName: agentName || null, messageCount: entries.length, messages: entries }, null, 2);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchBlobFromUrl(url: string): Promise<Blob> {
  const res = await fetch(url);
  return res.blob();
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return map[mimeType] || mimeType.split('/')[1] || 'bin';
}

/* ─── Component ─── */

export function SessionExport({
  messages,
  mediaStreams = [],
  agentName,
  disabled = false,
  variant = 'control-bar',
  className,
}: SessionExportProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const imageStreams = mediaStreams.filter((s) => s.mimeType.startsWith('image/'));
  const hasMessages = messages.length > 0;
  const hasImages = imageStreams.length > 0;
  const hasContent = hasMessages || hasImages;

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleCopyTranscript = useCallback(async () => {
    const text = serializePlainText(messages, agentName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages, agentName]);

  const handleExportTxt = useCallback(() => {
    setExporting('txt');
    const text = serializePlainText(messages, agentName);
    const blob = new Blob([text], { type: 'text/plain' });
    triggerDownload(blob, `${sessionFilenameBase(agentName)}.txt`);
    setExporting(null);
  }, [messages, agentName]);

  const handleExportJson = useCallback(() => {
    setExporting('json');
    const json = serializeJson(messages, agentName);
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `${sessionFilenameBase(agentName)}.json`);
    setExporting(null);
  }, [messages, agentName]);

  const handleExportImages = useCallback(async () => {
    if (imageStreams.length === 0) return;

    if (imageStreams.length === 1) {
      const s = imageStreams[0]!;
      const blob = await fetchBlobFromUrl(s.url);
      triggerDownload(blob, s.name || `image.${mimeToExt(s.mimeType)}`);
      return;
    }

    setExporting('images');
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder('images')!;
      await Promise.all(
        imageStreams.map(async (s, i) => {
          const blob = await fetchBlobFromUrl(s.url);
          const ext = mimeToExt(s.mimeType);
          const name = s.name || `image_${String(i + 1).padStart(3, '0')}.${ext}`;
          imgFolder.file(name, blob);
        }),
      );
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${sessionFilenameBase(agentName)}_images.zip`);
    } finally {
      setExporting(null);
    }
  }, [imageStreams, agentName]);

  const handleExportAll = useCallback(async () => {
    setExporting('all');
    try {
      const zip = new JSZip();
      // Transcript as txt + json
      if (hasMessages) {
        zip.file('transcript.txt', serializePlainText(messages, agentName));
        zip.file('transcript.json', serializeJson(messages, agentName));
      }
      // Images
      if (hasImages) {
        const imgFolder = zip.folder('images')!;
        await Promise.all(
          imageStreams.map(async (s, i) => {
            const blob = await fetchBlobFromUrl(s.url);
            const ext = mimeToExt(s.mimeType);
            const name = s.name || `image_${String(i + 1).padStart(3, '0')}.${ext}`;
            imgFolder.file(name, blob);
          }),
        );
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `${sessionFilenameBase(agentName)}.zip`);
    } finally {
      setExporting(null);
    }
  }, [messages, agentName, imageStreams, hasMessages, hasImages]);

  if (!hasContent && variant === 'control-bar') return null;

  const isPostSession = variant === 'post-session';

  // Post-session: render flat button row instead of dropdown
  if (isPostSession) {
    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
        {hasMessages && (
          <>
            <button
              onClick={handleCopyTranscript}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px] disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Transcript'}
            </button>
            <button
              onClick={handleExportTxt}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px] disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Download .txt
            </button>
            <button
              onClick={handleExportJson}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px] disabled:opacity-50"
            >
              <FileJson className="w-4 h-4" />
              Download .json
            </button>
          </>
        )}
        {hasImages && (
          <button
            onClick={handleExportImages}
            disabled={disabled || exporting === 'images'}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px] disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            {exporting === 'images' ? 'Zipping...' : `Images (${imageStreams.length})`}
          </button>
        )}
        {(hasMessages || hasImages) && (
          <button
            onClick={handleExportAll}
            disabled={disabled || exporting === 'all'}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--text)] text-sm btn-interactive min-h-[48px] disabled:opacity-50"
          >
            <Package className="w-4 h-4" />
            {exporting === 'all' ? 'Exporting...' : 'Export All (.zip)'}
          </button>
        )}
      </div>
    );
  }

  // Control-bar variant: compact dropdown
  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled || !hasContent}
        onClick={() => setOpen((v) => !v)}
        aria-label="Export session"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center gap-1 transition-colors',
          'h-10 rounded-full border px-3',
          'border-border bg-accent text-foreground hover:bg-foreground/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Download className="h-4 w-4" />
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 z-[100] min-w-[200px] rounded-lg border border-[var(--noir-border,var(--border))] bg-[var(--noir-bg-card,var(--background))] p-1 shadow-xl backdrop-blur-md animate-fade-in">
          {hasMessages && (
            <>
              <DropdownItem
                icon={<Copy className="h-3.5 w-3.5" />}
                label={copied ? 'Copied!' : 'Copy transcript'}
                onClick={handleCopyTranscript}
              />
              <DropdownItem
                icon={<FileText className="h-3.5 w-3.5" />}
                label="Export .txt"
                onClick={handleExportTxt}
              />
              <DropdownItem
                icon={<FileJson className="h-3.5 w-3.5" />}
                label="Export .json"
                onClick={handleExportJson}
              />
            </>
          )}
          {hasImages && (
            <>
              {hasMessages && <div className="my-1 border-t border-[var(--noir-border,var(--border))]/50" />}
              <DropdownItem
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                label={exporting === 'images' ? 'Zipping...' : `Export images (${imageStreams.length})`}
                onClick={handleExportImages}
                disabled={exporting === 'images'}
              />
            </>
          )}
          <div className="my-1 border-t border-[var(--noir-border,var(--border))]/50" />
          <DropdownItem
            icon={<Package className="h-3.5 w-3.5" />}
            label={exporting === 'all' ? 'Exporting...' : 'Export all (.zip)'}
            onClick={handleExportAll}
            disabled={exporting === 'all'}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Dropdown Item ─── */

function DropdownItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-[var(--noir-text,var(--foreground))] transition-colors hover:bg-[var(--noir-bg-elevated,var(--accent))] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="text-[var(--noir-text-muted,var(--muted-foreground))]">{icon}</span>
      {label}
    </button>
  );
}

/* ─── Individual Image Download Button (overlay on each image bubble) ─── */

export function ImageDownloadButton({
  stream,
  className,
}: {
  stream: IncomingByteStream;
  className?: string;
}) {
  const handleDownload = useCallback(async () => {
    const blob = await fetchBlobFromUrl(stream.url);
    const ext = mimeToExt(stream.mimeType);
    triggerDownload(blob, stream.name || `image.${ext}`);
  }, [stream]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void handleDownload();
      }}
      className={cn(
        'absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white/70 opacity-0 transition-all hover:bg-black/70 hover:text-white group-hover:opacity-100',
        className,
      )}
      aria-label="Download image"
    >
      <Download className="h-3.5 w-3.5" />
    </button>
  );
}
