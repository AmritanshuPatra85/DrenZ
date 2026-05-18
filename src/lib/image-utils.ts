import { createBrowserClient } from "@supabase/ssr";

export async function uploadListingImage(
  file: File,
  userId: string
): Promise<{ url: string | null; blocked: boolean }> {
  const compressed = await compressImage(file, 800);

  // Moderate before upload
  const isSafe = await moderateImage(compressed);
  if (!isSafe) {
    return { url: null, blocked: true };
  }

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
    return { url: null, blocked: false };
  }

  const { data: urlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, blocked: false };
}

async function moderateImage(blob: Blob): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("media", blob, "image.jpg");
    formData.append("models", "nudity-2.0,offensive,gore");
    formData.append("api_user", process.env.NEXT_PUBLIC_SIGHTENGINE_USER!);
    formData.append("api_secret", process.env.NEXT_PUBLIC_SIGHTENGINE_SECRET!);

    const res  = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body:   formData,
    });

    const data = await res.json();

    const nudityScore   = data.nudity?.sexual_activity ?? 0;
    const offensiveScore = data.offensive?.prob ?? 0;
    const goreScore     = data.gore?.prob ?? 0;

    // Block if any score > 0.5
    if (nudityScore > 0.5 || offensiveScore > 0.5 || goreScore > 0.5) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Moderation check failed:", err);
    return true; // Allow on moderation API failure
  }
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