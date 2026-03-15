'use client';

type Props = {
  onDisconnect?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function AgentDisconnectButton({ onDisconnect, className = '', children }: Props) {
  return (
    <button
      onClick={onDisconnect}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors ${className}`}
    >
      {children || 'Leave'}
    </button>
  );
}
