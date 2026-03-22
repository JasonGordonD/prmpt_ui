import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const image = typeof body?.image === 'string' ? body.image : '';

  if (!image) {
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ImgBB API key not configured' }, { status: 500 });
  }

  const formData = new FormData();
  formData.append('image', image);

  const res = await fetch(
    `https://api.imgbb.com/1/upload?key=${apiKey}`,
    { method: 'POST', body: formData },
  );

  const data = await res.json();

  if (!data.success) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ url: data.data.image.url });
}
