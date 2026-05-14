import { createBrowserClient } from "@supabase/ssr";

export async function uploadListingImage(
  file: File,
  userId: string
): Promise<string | null> {
  // Compress to 800px
  const compressed = await compressImage(file, 800);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const ext      = file.name.split(".").pop();
  const filename = `${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("listing-images")
    .upload(filename, compressed, {
      contentType: file.type,
      upsert:      false,
    });

  if (error) {
    console.error("Image upload failed:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

async function compressImage(file: File, maxPx: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxPx || height > maxPx) {
        if (width > height) {
          height = Math.round((height * maxPx) / width);
          width  = maxPx;
        } else {
          width  = Math.round((width * maxPx) / height);
          height = maxPx;
        }
      }

      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => resolve(blob ?? file),
        "image/jpeg",
        0.82
      );

      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
}