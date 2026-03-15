'use client';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function AgentControlBar({ className = '', children }: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-3 px-4 py-3 bg-[var(--surface)] border-t border-[var(--border)] ${className}`}
    >
      {children}
    </div>
  );
}
