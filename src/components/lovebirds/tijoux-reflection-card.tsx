'use client';

type TijouxReflectionCardProps = {
  reflection: string;
  className?: string;
};

export function TijouxReflectionCard({ reflection, className = '' }: TijouxReflectionCardProps) {
  return (
    <div
      className={`rounded-lg p-5 space-y-3 border-t-2 ${className}`}
      style={{
        backgroundColor: '#3a3050',
        borderTopColor: '#6b5b8d',
        borderColor: '#4a3d60',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#6b5b8d' }} />
        <h3 className="text-sm font-semibold" style={{ color: '#d0c8e0' }}>
          Clinical Reflection
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#6b5b8d20', color: '#6b5b8d' }}>
          Dr. Tijoux
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: '#c0b8d8' }}>
        {reflection}
      </p>
    </div>
  );
}
