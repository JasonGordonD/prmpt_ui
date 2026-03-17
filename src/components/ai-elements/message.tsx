'use client';

import { cn } from '@/lib/utils';

type MessageProps = React.ComponentProps<'div'> & {
  from?: 'user' | 'assistant';
};

export function Message({ from = 'assistant', className, children, ...props }: MessageProps) {
  const isUser = from === 'user';
  return (
    <div
      className={cn('group animate-fade-in', isUser ? 'flex justify-end is-user' : 'flex justify-start', className)}
      {...props}
    >
      <div className={cn(isUser ? 'max-w-[75%]' : 'max-w-[80%]')}>{children}</div>
    </div>
  );
}

export function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('space-y-1', className)} {...props} />;
}

export function MessageResponse({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('agent-message', className)} {...props}>
      {children}
    </div>
  );
}
