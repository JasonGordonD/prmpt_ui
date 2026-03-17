import { NextRequest, NextResponse } from 'next/server';
import type {
  EncodedFileOutput,
  EncodedOutputs,
  RoomCompositeOptions,
  SegmentedFileOutput,
  StreamOutput,
} from 'livekit-server-sdk';
import {
  asTrimmedString,
  getErrorMessage,
  isRecord,
  resolveAuthorizedMediaClients,
  toBoolean,
  toStringArray,
} from '@/lib/server/livekit-media-utils';

type RoomCompositeOutput =
  | EncodedOutputs
  | EncodedFileOutput
  | StreamOutput
  | SegmentedFileOutput;

export async function GET(req: NextRequest) {
  const clientResult = resolveAuthorizedMediaClients(
    req,
    req.nextUrl.searchParams.get('agentId')
  );
  if (!clientResult.ok) return clientResult.response;

  const roomName = asTrimmedString(req.nextUrl.searchParams.get('roomName'));
  const activeParam = req.nextUrl.searchParams.get('active');
  const active =
    activeParam === null
      ? undefined
      : activeParam === 'true'
        ? true
        : activeParam === 'false'
          ? false
          : undefined;

  if (activeParam !== null && typeof active === 'undefined') {
    return NextResponse.json(
      { error: 'Invalid active filter, use true or false' },
      { status: 400 }
    );
  }

  try {
    const egress = await clientResult.egressClient.listEgress({
      roomName,
      active,
    });
    return NextResponse.json({ egress });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to list egress: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const clientResult = resolveAuthorizedMediaClients(req, body.agentId);
  if (!clientResult.ok) return clientResult.response;

  const action = asTrimmedString(body.action);
  if (!action) {
    return NextResponse.json(
      { error: 'Missing action (start_room_composite | stop)' },
      { status: 400 }
    );
  }

  try {
    if (action === 'start_room_composite') {
      const roomName = asTrimmedString(body.roomName);
      if (!roomName) {
        return NextResponse.json(
          { error: 'Missing roomName for start_room_composite' },
          { status: 400 }
        );
      }

      if (!isRecord(body.output)) {
        return NextResponse.json(
          { error: 'Missing output object for start_room_composite' },
          { status: 400 }
        );
      }

      const output = body.output as RoomCompositeOutput;
      const opts: RoomCompositeOptions = {};
      const layout = asTrimmedString(body.layout);
      const customBaseUrl = asTrimmedString(body.customBaseUrl);
      const audioOnly = toBoolean(body.audioOnly);
      const videoOnly = toBoolean(body.videoOnly);

      if (layout) opts.layout = layout;
      if (customBaseUrl) opts.customBaseUrl = customBaseUrl;
      if (typeof audioOnly === 'boolean') opts.audioOnly = audioOnly;
      if (typeof videoOnly === 'boolean') opts.videoOnly = videoOnly;

      const egress = await clientResult.egressClient.startRoomCompositeEgress(
        roomName,
        output,
        opts
      );
      return NextResponse.json({ egress }, { status: 201 });
    }

    if (action === 'stop') {
      const egressId = asTrimmedString(body.egressId);
      if (!egressId) {
        return NextResponse.json(
          { error: 'Missing egressId for stop' },
          { status: 400 }
        );
      }

      const egress = await clientResult.egressClient.stopEgress(egressId);
      return NextResponse.json({ egress });
    }

    if (action === 'update_stream') {
      const egressId = asTrimmedString(body.egressId);
      if (!egressId) {
        return NextResponse.json(
          { error: 'Missing egressId for update_stream' },
          { status: 400 }
        );
      }

      const addOutputUrls = toStringArray(body.addOutputUrls);
      const removeOutputUrls = toStringArray(body.removeOutputUrls);
      if (!addOutputUrls && !removeOutputUrls) {
        return NextResponse.json(
          { error: 'Missing addOutputUrls/removeOutputUrls for update_stream' },
          { status: 400 }
        );
      }

      const egress = await clientResult.egressClient.updateStream(
        egressId,
        addOutputUrls,
        removeOutputUrls
      );
      return NextResponse.json({ egress });
    }

    return NextResponse.json(
      {
        error:
          'Unsupported action. Use start_room_composite, stop, or update_stream.',
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Egress operation failed: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
