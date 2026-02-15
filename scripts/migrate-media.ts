import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// NOTE: You need to get these from your Supabase Dashboard
// Settings -> API
const SUPABASE_URL = 'https://wvmkuiiktdadezifbrhv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bWt1aWlrdGRhZGV6aWZicmh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE0MzM5NiwiZXhwIjoyMDg2NzE5Mzk2fQ.mJOoXYn27Ve12UtMtXATk2dBaVf75WI3TJmtPn4tRno';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const BUCKET_NAME = 'uploads';

async function migrateMedia() {
    console.log('🚀 Starting media migration to Supabase Storage...');

    // 1. Ensure bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError);
        return;
    }

    const exists = buckets.find(b => b.name === BUCKET_NAME);
    if (!exists) {
        console.log(`📁 Creating bucket: ${BUCKET_NAME}...`);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
        });
        if (createError) {
            console.error('❌ Error creating bucket:', createError);
            return;
        }
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const files = fs.readdirSync(uploadsDir).filter(f => f !== '.gitkeep');

    console.log(`📦 Found ${files.length} files to upload.`);

    for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const fileBuffer = fs.readFileSync(filePath);

        // Determine content type
        const ext = path.extname(file).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';

        console.log(`📤 Uploading ${file}...`);
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(file, fileBuffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error(`❌ Failed to upload ${file}:`, error.message);
            continue;
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file}`;
        console.log(`✅ Uploaded! Public URL: ${publicUrl}`);
    }

    console.log('✨ Media migration completed successfully!');
}

migrateMedia()
    .catch(e => console.error('❌ Migration failed:', e));
