'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, ImageIcon, X } from 'lucide-react';

type FileUploadProps = {
  onFileSelect?: (file: File) => void;
  className?: string;
};

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
];

export function FileUpload({ onFileSelect, className = '' }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      setSelectedFile(file);
      setUploadProgress(0);
      onFileSelect?.(file);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(Math.min(progress, 100));
        if (progress >= 100) clearInterval(interval);
      }, 200);
    },
    [onFileSelect]
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
    setUploadProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getFileIcon = () => {
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
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
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
          {getFileIcon()}
          <span className="text-xs">
            {selectedFile ? selectedFile.name : 'Drop file or click to upload'}
          </span>
        </div>
      </div>

      {selectedFile && uploadProgress !== null && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="truncate max-w-[80%]">{selectedFile.name}</span>
            <button onClick={clearFile} className="hover:text-[var(--text)]">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
