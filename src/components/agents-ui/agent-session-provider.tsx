'use client';

import { useEffect } from 'react';
import type { UseSessionReturn } from '@livekit/components-react';

type AgentSessionProviderProps = {
  session: UseSessionReturn;
  children: React.ReactNode;
};

export function AgentSessionProvider({ session, children }: AgentSessionProviderProps) {
  useEffect(() => {
    if (!session.room) return;
    const room = session.room;
    const handleTrackSubscribed = () => {
      room.remoteParticipants.forEach((p) => {
        p.audioTrackPublications.forEach((pub) => {
          if (pub.track && !pub.track.mediaStreamTrack) return;
        });
      });
    };
    room.on('trackSubscribed', handleTrackSubscribed);
    return () => {
      room.off('trackSubscribed', handleTrackSubscribed);
    };
  }, [session.room]);

  return <>{children}</>;
}
