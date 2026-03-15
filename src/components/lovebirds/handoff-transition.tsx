'use client';

import { useMemo } from 'react';

type HandoffTransitionProps = {
  currentNode: string;
  onTransition: (isTijoux: boolean) => void;
  children: React.ReactNode;
};

export function HandoffTransition({ currentNode, onTransition, children }: HandoffTransitionProps) {
  const isTijoux = useMemo(() => {
    const result = currentNode === 'Tijoux (closing)';
    onTransition(result);
    return result;
  }, [currentNode, onTransition]);

  return (
    <div
      style={{
        transition: 'all 0.8s ease-in-out',
        filter: isTijoux ? 'hue-rotate(30deg)' : 'none',
      }}
    >
      {children}
    </div>
  );
}
