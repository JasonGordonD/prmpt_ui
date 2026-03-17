'use client';

/* eslint-disable @next/next/no-img-element */

import { Children } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download } from 'lucide-react';

type InlineMediaType = 'none' | 'image' | 'video-file' | 'youtube' | 'vimeo';

type InlineMediaDescriptor = {
  type: InlineMediaType;
  sourceUrl?: string;
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov)$/i;

const KNOWN_IMAGE_HOST_SUFFIXES = [
  'images.unsplash.com',
  'i.imgur.com',
  'imgur.com',
  'cdn.discordapp.com',
  'media.discordapp.net',
  'pbs.twimg.com',
  'res.cloudinary.com',
  'i.postimg.cc',
  'live.staticflickr.com',
];

function tryParseAbsoluteHttpUrl(raw: string): URL | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function hasHostSuffix(hostname: string, suffixes: string[]): boolean {
  return suffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

function resolveYouTubeEmbedUrl(url: URL): string | undefined {
  const host = url.hostname.toLowerCase();

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://www.youtube.com/embed/${id}` : undefined;
  }

  if (!host.endsWith('youtube.com') && !host.endsWith('youtube-nocookie.com')) {
    return undefined;
  }

  if (url.pathname === '/watch') {
    const id = url.searchParams.get('v')?.trim();
    return id ? `https://www.youtube.com/embed/${id}` : undefined;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    return undefined;
  }

  const [kind, id] = parts;
  if ((kind === 'embed' || kind === 'shorts') && id) {
    return `https://www.youtube.com/embed/${id}`;
  }

  return undefined;
}

function resolveVimeoEmbedUrl(url: URL): string | undefined {
  const host = url.hostname.toLowerCase();
  if (!host.endsWith('vimeo.com')) {
    return undefined;
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  if (parts[0] === 'video' && parts[1]) {
    return `https://player.vimeo.com/video/${parts[1]}`;
  }

  if (/^\d+$/.test(parts[0])) {
    return `https://player.vimeo.com/video/${parts[0]}`;
  }

  return undefined;
}

export function classifyMediaUrl(raw: string): InlineMediaDescriptor {
  const parsed = tryParseAbsoluteHttpUrl(raw);
  if (!parsed) {
    return { type: 'none' };
  }

  const pathname = decodeURIComponent(parsed.pathname).toLowerCase();

  const youtubeEmbed = resolveYouTubeEmbedUrl(parsed);
  if (youtubeEmbed) {
    return { type: 'youtube', sourceUrl: youtubeEmbed };
  }

  const vimeoEmbed = resolveVimeoEmbedUrl(parsed);
  if (vimeoEmbed) {
    return { type: 'vimeo', sourceUrl: vimeoEmbed };
  }

  if (VIDEO_EXTENSIONS.test(pathname)) {
    return { type: 'video-file', sourceUrl: parsed.toString() };
  }

  if (IMAGE_EXTENSIONS.test(pathname)) {
    return { type: 'image', sourceUrl: parsed.toString() };
  }

  if (hasHostSuffix(parsed.hostname.toLowerCase(), KNOWN_IMAGE_HOST_SUFFIXES)) {
    return { type: 'image', sourceUrl: parsed.toString() };
  }

  return { type: 'none' };
}

function MediaSourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs break-all text-[var(--primary)] hover:underline"
    >
      Open full size
    </a>
  );
}

function InlineMediaContent({
  media,
  href,
  alt,
}: {
  media: InlineMediaDescriptor;
  href: string;
  alt?: string;
}) {
  if (!media.sourceUrl) {
    return null;
  }

  if (media.type === 'image') {
    return (
      <div className="my-2 space-y-1.5">
        <div className="transcript-image relative inline-block">
          <img
            src={media.sourceUrl}
            alt={alt || 'Inline image preview'}
            loading="lazy"
            className="max-h-80 w-auto max-w-full rounded-lg border border-[var(--border)] object-contain bg-black/10"
          />
          <a
            href={media.sourceUrl}
            download
            className="media-download-btn flex items-center justify-center"
            title="Download image"
          >
            <Download className="h-4 w-4 text-[var(--noir-text-muted)]" />
          </a>
        </div>
        <MediaSourceLink href={href} />
      </div>
    );
  }

  if (media.type === 'video-file') {
    return (
      <div className="my-2 space-y-1.5">
        <video
          src={media.sourceUrl}
          controls
          preload="metadata"
          className="max-h-96 w-full rounded-lg border border-[var(--border)] bg-black"
        />
        <a
          href={media.sourceUrl}
          download
          className="media-video-download-link"
        >
          Download video
        </a>
        <MediaSourceLink href={href} />
      </div>
    );
  }

  if (media.type === 'youtube' || media.type === 'vimeo') {
    return (
      <div className="my-2 space-y-1.5">
        <div className="w-full max-w-full overflow-hidden rounded-lg border border-[var(--border)] bg-black">
          <iframe
            src={media.sourceUrl}
            title={alt || `${media.type} embed`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full"
            style={{ aspectRatio: '16 / 9' }}
          />
        </div>
        <MediaSourceLink href={href} />
      </div>
    );
  }

  return null;
}

type MarkdownWithInlineMediaProps = {
  markdown: string;
};

export function MarkdownWithInlineMedia({ markdown }: MarkdownWithInlineMediaProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children, ...props }) => {
          const safeHref = typeof href === 'string' ? href : '';
          const media = classifyMediaUrl(safeHref);

          if (media.type !== 'none') {
            const label = Children.toArray(children).join('').trim();
            return (
              <InlineMediaContent
                media={media}
                href={safeHref}
                alt={label || undefined}
              />
            );
          }

          return (
            <a href={safeHref} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => {
          const safeSrc = typeof src === 'string' ? src : '';
          const media = classifyMediaUrl(safeSrc);
          const imageLikeMedia = media.type === 'none'
            ? { type: 'image' as const, sourceUrl: safeSrc }
            : media;

          return (
            <InlineMediaContent
              media={imageLikeMedia}
              href={safeSrc}
              alt={alt}
            />
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}

export function renderMarkdownWithInlineMedia(markdown: string): ReactNode {
  return <MarkdownWithInlineMedia markdown={markdown} />;
}
