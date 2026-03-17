'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTopic } from '@livekit/components-core';
import { useDataChannel, useLocalParticipant, useParticipants, useRoomContext, useTextStream } from '@livekit/components-react';

export type IncomingByteStream = {
  id: string;
  name: string;
  topic: string;
  mimeType: string;
  fromIdentity: string;
  url: string;
  size?: number;
};

type UseRealtimeMediaDataOptions = {
  chatOpen?: boolean;
};

export function useRealtimeMediaData({ chatOpen = true }: UseRealtimeMediaDataOptions = {}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [incomingByteStreams, setIncomingByteStreams] = useState<IncomingByteStream[]>([]);
  const [lastRpcResponse, setLastRpcResponse] = useState<string>('');
  const [lastRpcError, setLastRpcError] = useState<string>('');
  const objectUrlsRef = useRef<string[]>([]);

  const { textStreams: transcriptionStreams } = useTextStream(DataTopic.TRANSCRIPTION);

  const { message: latestDataPacket } = useDataChannel((message) => {
    try {
      const decoded = new TextDecoder().decode(message.payload);
      if (decoded) {
        // Keep lightweight data-packet visibility for troubleshooting integrations.
        // eslint-disable-next-line no-console
        console.info('[media-data] packet', message.topic ?? 'no-topic', decoded.slice(0, 240));
      }
    } catch {
      // eslint-disable-next-line no-console
      console.info('[media-data] binary packet', message.topic ?? 'no-topic', message.payload.byteLength);
    }
  });

  useEffect(() => {
    const processByteStream = async (
      reader: {
        info: { id: string; name: string; topic: string; mimeType: string; size?: number };
        readAll: () => Promise<Array<Uint8Array>>;
      },
      participantInfo: { identity: string },
    ) => {
      try {
        const chunks = await reader.readAll();
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const merged = new Uint8Array(totalSize);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.byteLength;
        }
        const blob = new Blob([merged.buffer], { type: reader.info.mimeType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        objectUrlsRef.current.push(url);

        setIncomingByteStreams((prev) => [
          ...prev.slice(-15),
          {
            id: reader.info.id,
            name: reader.info.name,
            topic: reader.info.topic,
            mimeType: reader.info.mimeType,
            fromIdentity: participantInfo.identity,
            url,
            size: reader.info.size,
          },
        ]);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[media-data] failed to read byte stream', error);
      }
    };

    room.registerByteStreamHandler('images', processByteStream);
    room.registerByteStreamHandler('files', processByteStream);
    room.registerByteStreamHandler('uploads', processByteStream);

    return () => {
      room.unregisterByteStreamHandler('images');
      room.unregisterByteStreamHandler('files');
      room.unregisterByteStreamHandler('uploads');
    };
  }, [room]);

  useEffect(() => {
    room.registerRpcMethod('frontend.health', async (invocation) => {
      return JSON.stringify({
        ok: true,
        ts: Date.now(),
        caller: invocation.callerIdentity,
      });
    });

    return () => {
      room.unregisterRpcMethod('frontend.health');
    };
  }, [room]);

  const pingAgentRpc = useCallback(async () => {
    const remote = participants.find((p) => p.identity !== localParticipant.identity);
    if (!remote) return;

    try {
      const payload = JSON.stringify({ kind: 'healthcheck', ts: Date.now() });
      const response = await localParticipant.performRpc({
        destinationIdentity: remote.identity,
        method: 'agent.health',
        payload,
        responseTimeout: 3000,
      });
      setLastRpcError('');
      setLastRpcResponse(response);
    } catch (error) {
      setLastRpcResponse('');
      setLastRpcError(error instanceof Error ? error.message : 'RPC failed');
    }
  }, [localParticipant, participants]);

  useEffect(() => {
    void pingAgentRpc();
  }, [pingAgentRpc]);

  useEffect(() => {
    void localParticipant.setAttributes({
      ui_mode: 'session',
      ui_chat_open: String(chatOpen),
      ui_transport: 'media-data-v1',
    }).catch(() => {});
  }, [chatOpen, localParticipant]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  return useMemo(
    () => ({
      incomingByteStreams,
      transcriptionStreams,
      latestDataPacket,
      lastRpcResponse,
      lastRpcError,
    }),
    [incomingByteStreams, transcriptionStreams, latestDataPacket, lastRpcResponse, lastRpcError],
  );
}
