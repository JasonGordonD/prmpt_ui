'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function Conversation({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('relative h-full w-full', className)} {...props}>
      {children}
    </div>
  );
}

export function ConversationContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onScroll = () => {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
      setShowScrollButton(distance > 120);
    };
    onScroll();
    element.addEventListener('scroll', onScroll);
    return () => element.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      data-conversation-content="true"
      data-show-scroll-button={showScrollButton ? 'true' : 'false'}
      className={cn('h-full overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ConversationScrollButton({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const handleClick = () => {
    const element = document.querySelector('[data-conversation-content="true"]') as HTMLDivElement | null;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('new-message-pill', className)}
      {...props}
    >
      ↓ latest
    </button>
  );
}
