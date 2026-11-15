// Upload hero image to Supabase store-assets bucket
// Run: node scripts/upload-hero-image.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcnrarmkuyzyycpuvtec.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.')
  console.error('   Copy .env.scripts.example → .env.scripts, fill in the key, then run:')
  console.error('   node -r dotenv/config --env-file=.env.scripts scripts/upload-hero-image.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Path to the uploaded hero image
const imagePath = resolve(
  'C:/Users/yaswa/.gemini/antigravity/brain/30015534-fdad-4f57-bb78-49c3bc64940f/.user_uploaded/media_1794739088803_a7afb34b.jpg'
)

async function uploadHeroImage() {
  console.log('Uploading hero image to store-assets...')

  const imageBuffer = readFileSync(imagePath)

  const { data, error } = await supabase.storage
    .from('store-assets')
    .upload('hero/hero-main.jpg', imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) {
    console.error('❌ Upload failed:', error.message)
    process.exit(1)
  }

  const { data: urlData } = supabase.storage
    .from('store-assets')
    .getPublicUrl('hero/hero-main.jpg')

  console.log('✅ Hero image uploaded successfully!')
  console.log('Public URL:', urlData.publicUrl)
  console.log()
  console.log('The homepage will now use this image automatically.')
}

uploadHeroImage()
