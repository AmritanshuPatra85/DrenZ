import { createClient } from "@/lib/supabase/client";

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
        'image/jpeg',
        0.82
      )
    }

    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

export async function uploadListingImage(file: File, sellerId: string): Promise<string> {
  const supabase = createClient()
  const compressed = await compressImage(file)
  const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

  const { error } = await supabase.storage
    .from('listing-images')
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

  if (error) throw error

  const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadListingImages(files: File[], userId: string): Promise<string[]> {
  if (files.length > 4) throw new Error('Max 4 images allowed')
  return Promise.all(files.map(f => uploadListingImage(f, userId)))
}

export async function deleteListingImage(publicUrl: string): Promise<void> {
  const supabase = createClient()
  const url = new URL(publicUrl)
  const path = url.pathname.split('/listing-images/')[1]
  if (!path) return
  await supabase.storage.from('listing-images').remove([path])
}
