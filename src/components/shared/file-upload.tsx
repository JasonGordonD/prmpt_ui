'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, ImageIcon, X, Check } from 'lucide-react';
import type { Room } from 'livekit-client';

type FileUploadProps = {
  room?: Room;
  className?: string;
};

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];

function getUploadTopic(file: File) {
  if (file.type.startsWith('image/')) {
    return 'images';
  }
  return 'files';
}

export function FileUpload({ room, className = '' }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      setSelectedFile(file);

      if (!room) {
        // No room available — just show file selected
        setStatus('idle');
        return;
      }

      setStatus('sending');
      try {
        await room.localParticipant.sendFile(file, {
          mimeType: file.type,
          topic: getUploadTopic(file),
        });
        setStatus('sent');
        setTimeout(() => {
          setStatus('idle');
          setSelectedFile(null);
        }, 3000);
      } catch (err) {
        console.error('File send failed:', err);
        setStatus('error');
        setTimeout(() => {
          setStatus('idle');
          setSelectedFile(null);
        }, 3000);
      }
    },
    [room]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setStatus('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const getIcon = () => {
    if (status === 'sent') return <Check className="w-5 h-5 text-green-400" />;
    if (!selectedFile) return <Upload className="w-5 h-5" />;
    if (selectedFile.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer btn-interactive ${
          dragOver
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--text-muted)]'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
          {status === 'sending' ? (
            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
          ) : (
            getIcon()
          )}
          <span className="text-xs">
            {status === 'sent'
              ? `${selectedFile?.name} sent`
              : status === 'sending'
                ? 'Sending...'
                : selectedFile
                  ? selectedFile.name
                  : 'Drop file or click to upload'}
          </span>
        </div>
      </div>

      {selectedFile && status === 'idle' && (
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="truncate max-w-[80%]">{selectedFile.name}</span>
          <button onClick={clearFile} className="hover:text-[var(--text)] btn-interactive p-1 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
