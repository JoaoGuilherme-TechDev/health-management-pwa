import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { authAdapter } from '@/lib/auth-local';

export async function POST(request: Request) {
  try {
    const { data: userData } = await authAdapter.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const pathArg = formData.get('path') as string;

    if (!file || !bucket || !pathArg) {
      return NextResponse.json({ error: 'Missing file, bucket or path' }, { status: 400 });
    }

    // Basic path validation to prevent traversal
    if (pathArg.includes('..')) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const { data, error } = await storage.upload(bucket, pathArg, file);

    if (error) {
      return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: 'Upload failed with no data' }, { status: 500 });
    }

    const { data: urlData } = storage.getPublicUrl(bucket, data.path);
    
    return NextResponse.json({ 
        path: data.path,
        publicUrl: urlData.publicUrl 
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
