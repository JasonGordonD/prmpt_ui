'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Volume2, VolumeX, Maximize, ImageIcon, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IncomingByteStream } from '@/hooks/agents-ui/use-realtime-media-data';
import { ImageDownloadButton } from '@/components/agents-ui/session-export';

// ---------------------------------------------------------------------------
// Image Lightbox (portal overlay)
// ---------------------------------------------------------------------------

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Inline Image Thumbnail
// ---------------------------------------------------------------------------

export interface MediaImageProps {
  src: string;
  alt?: string;
  from: 'user' | 'assistant';
  timestamp?: number;
  stream?: IncomingByteStream;
  className?: string;
}

export function MediaImage({ src, alt = 'Image', from, timestamp, stream, className }: MediaImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString(locale, { timeStyle: 'short' })
    : undefined;

  return (
    <>
      <div
        className={cn(
          'group flex w-full max-w-[95%] flex-col gap-1',
          from === 'user' ? 'ml-auto items-end' : 'items-start',
          className,
        )}
      >
        <div className="relative">
          {stream && <ImageDownloadButton stream={stream} />}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-black/5 transition-all hover:border-border hover:shadow-lg dark:bg-white/5"
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              className="max-h-[200px] max-w-[280px] rounded-xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
              <Maximize className="h-5 w-5 text-white drop-shadow-md" />
            </div>
          </button>
        </div>
        {timeStr && (
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
        )}
      </div>
      {lightboxOpen && (
        <ImageLightbox src={src} alt={alt} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Optimistic Upload Thumbnail
// ---------------------------------------------------------------------------

export function UploadingImage({ file, className }: { file: File; className?: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div
      className={cn(
        'flex w-full max-w-[95%] flex-col gap-1 ml-auto items-end',
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-xl border border-border/40">
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-[200px] max-w-[280px] rounded-xl object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">Sending...</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video Player
// ---------------------------------------------------------------------------

export interface VideoPlayerProps extends ComponentProps<'div'> {
  src: string;
  mimeType?: string;
}

export function VideoPlayer({ src, mimeType, className, ...props }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/40 bg-black',
        className,
      )}
      {...props}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        className="w-full max-h-[300px] cursor-pointer"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      >
        {mimeType && <source src={src} type={mimeType} />}
      </video>
      <div className="flex items-center gap-2 bg-black/90 px-3 py-2 text-white/80">
        <button
          type="button"
          onClick={togglePlay}
          className="transition-colors hover:text-white"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="min-w-[36px] text-[11px] tabular-nums">{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <span className="min-w-[36px] text-right text-[11px] tabular-nums">
          {formatTime(duration)}
        </span>
        <button
          type="button"
          onClick={toggleMute}
          className="transition-colors hover:text-white"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Media Message — combines image + video rendering in transcript context
// ---------------------------------------------------------------------------

export type MediaItem = IncomingByteStream & {
  from: 'user' | 'assistant';
  receivedAt: number;
};

export function MediaMessage({ item }: { item: MediaItem }) {
  const isImage = item.mimeType.startsWith('image/');
  const isVideo = item.mimeType.startsWith('video/');

  if (isImage) {
    return (
      <MediaImage
        src={item.url}
        alt={item.name || 'Shared image'}
        from={item.from}
        timestamp={item.receivedAt}
        stream={item}
      />
    );
  }

  if (isVideo) {
    return (
      <div
        className={cn(
          'flex w-full max-w-[95%] flex-col gap-1',
          item.from === 'user' ? 'ml-auto items-end' : 'items-start',
        )}
      >
        <VideoPlayer src={item.url} mimeType={item.mimeType} className="max-w-[400px]" />
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Image Upload Button (for control bar)
// ---------------------------------------------------------------------------

const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

export interface ImageUploadButtonProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'livekit';
}

export function ImageUploadButton({
  onFileSelected,
  disabled,
  className,
  variant = 'default',
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && IMAGE_ACCEPT.includes(file.type)) {
        onFileSelected(file);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFileSelected],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT.join(',')}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label="Upload image"
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          'h-10 w-10 rounded-full border',
          'border-border bg-accent text-foreground hover:bg-foreground/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'livekit' && 'rounded-full',
          className,
        )}
      >
        <ImageIcon className="h-4 w-4" />
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Video URL Input Button (for control bar)
// ---------------------------------------------------------------------------

export interface VideoInputButtonProps {
  onVideoUrl: (url: string) => void;
  onVideoFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'livekit';
}

export function VideoInputButton({
  onVideoUrl,
  onVideoFile,
  disabled,
  className,
  variant = 'default',
}: VideoInputButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && (file.type === 'video/mp4' || file.type === 'video/webm')) {
        onVideoFile(file);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [onVideoFile],
  );

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlValue.trim();
    if (trimmed) {
      onVideoUrl(trimmed);
      setUrlValue('');
      setShowUrlInput(false);
    }
  }, [urlValue, onVideoUrl]);

  useEffect(() => {
    if (showUrlInput) urlInputRef.current?.focus();
  }, [showUrlInput]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (showUrlInput) {
              setShowUrlInput(false);
            } else {
              inputRef.current?.click();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowUrlInput(!showUrlInput);
          }}
          aria-label="Upload video (right-click to paste URL)"
          title="Click: upload video file / Right-click: paste URL"
          className={cn(
            'inline-flex items-center justify-center transition-colors',
            'h-10 w-10 rounded-full border',
            'border-border bg-accent text-foreground hover:bg-foreground/10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'livekit' && 'rounded-full',
            className,
          )}
        >
          <Film className="h-4 w-4" />
        </button>
        {showUrlInput && (
          <div className="absolute bottom-full left-1/2 mb-2 flex w-64 -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-background p-2 shadow-lg">
            <input
              ref={urlInputRef}
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="Paste video URL..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlValue.trim()}
              className="rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Go
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
