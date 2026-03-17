import { NextRequest, NextResponse } from 'next/server';
import {
  IngressInput,
  type CreateIngressOptions,
} from 'livekit-server-sdk';
import {
  asTrimmedString,
  getErrorMessage,
  isRecord,
  resolveAuthorizedMediaClients,
  toBoolean,
} from '@/lib/server/livekit-media-utils';

function toIngressInput(raw: unknown): IngressInput | undefined {
  const inputType = asTrimmedString(raw)?.toLowerCase();
  if (!inputType) return undefined;

  if (inputType === 'rtmp' || inputType === 'rtmp_input') {
    return IngressInput.RTMP_INPUT;
  }
  if (inputType === 'whip' || inputType === 'whip_input') {
    return IngressInput.WHIP_INPUT;
  }
  if (inputType === 'url' || inputType === 'url_input') {
    return IngressInput.URL_INPUT;
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  const clientResult = resolveAuthorizedMediaClients(
    req,
    req.nextUrl.searchParams.get('agentId')
  );
  if (!clientResult.ok) return clientResult.response;

  const roomName = asTrimmedString(req.nextUrl.searchParams.get('roomName'));
  const ingressId = asTrimmedString(req.nextUrl.searchParams.get('ingressId'));

  try {
    const ingress = await clientResult.ingressClient.listIngress({
      roomName,
      ingressId,
    });
    return NextResponse.json({ ingress });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to list ingress: ${getErrorMessage(error)}` },
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
      { error: 'Missing action (create | delete)' },
      { status: 400 }
    );
  }

  try {
    if (action === 'create') {
      const inputType = toIngressInput(body.inputType);
      const roomName = asTrimmedString(body.roomName);
      const participantIdentity = asTrimmedString(body.participantIdentity);

      if (typeof inputType === 'undefined') {
        return NextResponse.json(
          { error: 'Invalid inputType. Use rtmp, whip, or url.' },
          { status: 400 }
        );
      }
      if (!roomName || !participantIdentity) {
        return NextResponse.json(
          {
            error:
              'Missing required fields for create: roomName and participantIdentity',
          },
          { status: 400 }
        );
      }

      const opts: CreateIngressOptions = {
        roomName,
        participantIdentity,
      };

      const name = asTrimmedString(body.name);
      const participantName = asTrimmedString(body.participantName);
      const participantMetadata = asTrimmedString(body.participantMetadata);
      const url = asTrimmedString(body.url);
      const enableTranscoding = toBoolean(body.enableTranscoding);

      if (name) opts.name = name;
      if (participantName) opts.participantName = participantName;
      if (participantMetadata) opts.participantMetadata = participantMetadata;
      if (url) opts.url = url;
      if (typeof enableTranscoding === 'boolean') {
        opts.enableTranscoding = enableTranscoding;
      }

      if (inputType === IngressInput.URL_INPUT && !opts.url) {
        return NextResponse.json(
          { error: 'URL input requires a url value' },
          { status: 400 }
        );
      }

      const ingress = await clientResult.ingressClient.createIngress(
        inputType,
        opts
      );
      return NextResponse.json({ ingress }, { status: 201 });
    }

    if (action === 'delete') {
      const ingressId = asTrimmedString(body.ingressId);
      if (!ingressId) {
        return NextResponse.json(
          { error: 'Missing ingressId for delete action' },
          { status: 400 }
        );
      }

      const ingress = await clientResult.ingressClient.deleteIngress(ingressId);
      return NextResponse.json({ ingress });
    }

    return NextResponse.json(
      { error: 'Unsupported action. Use create or delete.' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Ingress operation failed: ${getErrorMessage(error)}` },
      { status: 500 }
    );
  }
}
