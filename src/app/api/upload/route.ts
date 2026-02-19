import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}

import { verifyJwt } from '@/lib/jwt';

async function getSession(request: NextRequest) {
  // 1. Try Mobile Bearer Token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwt(token);
    if (decoded) {
      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name,
        }
      };
    }
  }
  // 2. Fallback to standard cookie session
  return await auth();
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  };

  try {
    const session = await getSession(request);
    const isDev = process.env.NODE_ENV === 'development';

    if (!session && !isDev) {
      console.error('[Upload] Unauthorized attempt - No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      console.error('[Upload] No file found in form data');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400, headers: corsHeaders });
    }

    // Cast to File-like if size/name exist
    const fileObj = file as any;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileObj.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400, headers: corsHeaders });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const originalName = fileObj.name || 'document';
    const extension = originalName.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Ensure BUCKET exists
    const BUCKET_NAME = 'uploads';
    const { data: buckets, error: bucketCheckError } = await supabase.storage.listBuckets();

    if (!bucketCheckError) {
      const exists = buckets.find(b => b.name === BUCKET_NAME);
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 10485760,
        });
      }
    }

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('[Upload] Supabase error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500, headers: corsHeaders });
    }

    // Generate Public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;

    return NextResponse.json({ url, filename }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('[Upload] Critical Error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500, headers: corsHeaders });
  }
}

