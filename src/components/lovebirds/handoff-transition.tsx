'use client';

import { useEffect, useRef } from 'react';

type HandoffTransitionProps = {
  currentNode: string | undefined;
  onTransition: (isTijoux: boolean) => void;
  children: React.ReactNode;
};

export function HandoffTransition({ currentNode, onTransition, children }: HandoffTransitionProps) {
  const isTijoux = currentNode === 'Tijoux (closing)';
  const prevRef = useRef(false);

  useEffect(() => {
    if (isTijoux !== prevRef.current) {
      prevRef.current = isTijoux;
      onTransition(isTijoux);
    }
  }, [isTijoux, onTransition]);

  return (
    <div
      style={{
        transition: 'filter 0.8s ease-in-out',
        filter: isTijoux ? 'hue-rotate(30deg)' : 'none',
      }}
    >
      {children}
    </div>
  );
}
