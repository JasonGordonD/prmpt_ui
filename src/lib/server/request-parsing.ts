import 'server-only';
import { NextRequest } from 'next/server';

type ParseResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; error: string };

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

export async function parseRequestBody(req: NextRequest): Promise<ParseResult> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData();
      return { ok: true, body: Object.fromEntries(formData.entries()) };
    } catch {
      return { ok: false, error: 'Invalid multipart body' };
    }
  }

  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch {
    return { ok: false, error: 'Invalid request body' };
  }

  if (!rawBody.trim()) {
    return { ok: true, body: {} };
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    return { ok: true, body: Object.fromEntries(params.entries()) };
  }

  try {
    const parsed = JSON.parse(rawBody);
    return { ok: true, body: toObjectRecord(parsed) };
  } catch {
    // Legacy clients sometimes send URL encoded payloads without proper content-type.
    // Retry as query-string style key/value content before failing hard.
    const params = new URLSearchParams(rawBody);
    if (Array.from(params.keys()).length > 0) {
      return { ok: true, body: Object.fromEntries(params.entries()) };
    }
    return { ok: false, error: 'Invalid JSON body' };
  }
}

export function readStringField(
  body: Record<string, unknown>,
  fieldNames: string[]
): string | undefined {
  for (const fieldName of fieldNames) {
    const value = body[fieldName];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

export function readObjectField(
  body: Record<string, unknown>,
  fieldNames: string[]
): Record<string, unknown> | undefined {
  for (const fieldName of fieldNames) {
    const value = body[fieldName];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Keep trying remaining field names.
      }
    }
  }

  return undefined;
}
