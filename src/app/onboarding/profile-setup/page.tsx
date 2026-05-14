"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  department: string;
  year: string;
  hostel: string;
};

const DEFAULT_FORM_STATE: ProfileFormState = {
  firstName: "",
  lastName: "",
  department: "",
  year: "",
  hostel: "",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

async function createCroppedBlob(
  sourceUrl: string,
  zoom: number,
  xPercent: number,
  yPercent: number
) {
  const image = await loadImageElement(sourceUrl);
  const canvas = document.createElement("canvas");
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not initialize image editor.");
  }

  const cropWidth = image.naturalWidth / zoom;
  const cropHeight = image.naturalHeight / zoom;

  const maxX = Math.max(0, image.naturalWidth - cropWidth);
  const maxY = Math.max(0, image.naturalHeight - cropHeight);

  const sourceX = clamp((xPercent / 100) * maxX, 0, maxX);
  const sourceY = clamp((yPercent / 100) * maxY, 0, maxY);

  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to prepare cropped image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export default function ProfileSetupPage() {
  const [formState, setFormState] = useState<ProfileFormState>(DEFAULT_FORM_STATE);
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [croppedPhotoBlob, setCroppedPhotoBlob] = useState<Blob | null>(null);
  const [zoom, setZoom] = useState(1.5);
  const [xPosition, setXPosition] = useState(50);
  const [yPosition, setYPosition] = useState(50);
  const [isCropping, setIsCropping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formValid = useMemo(() => {
    return (
      formState.firstName.trim().length > 0 &&
      formState.lastName.trim().length > 0 &&
      formState.department.trim().length > 0 &&
      formState.year.length > 0 &&
      formState.hostel.trim().length > 0
    );
  }, [formState]);

  useEffect(() => {
    return () => {
      if (rawPhotoUrl) {
        URL.revokeObjectURL(rawPhotoUrl);
      }
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl, rawPhotoUrl]);

  const handleTextChange =
    (field: keyof ProfileFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState((previous) => ({ ...previous, [field]: event.target.value }));
      setErrorMessage(null);
    };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }

    if (rawPhotoUrl) {
      URL.revokeObjectURL(rawPhotoUrl);
    }
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setRawPhotoUrl(nextObjectUrl);
    setCropPreviewUrl(null);
    setCroppedPhotoBlob(null);
    setZoom(1.5);
    setXPosition(50);
    setYPosition(50);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const applyCrop = async () => {
    if (!rawPhotoUrl) {
      setErrorMessage("Please upload a photo before applying crop.");
      return;
    }

    setIsCropping(true);
    setErrorMessage(null);

    try {
      const croppedBlob = await createCroppedBlob(rawPhotoUrl, zoom, xPosition, yPosition);
      const previewUrl = URL.createObjectURL(croppedBlob);

      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }

      setCropPreviewUrl(previewUrl);
      setCroppedPhotoBlob(croppedBlob);
      setSuccessMessage("Photo crop preview is ready.");
    } catch {
      setErrorMessage("We could not crop the selected image. Please try another photo.");
    } finally {
      setIsCropping(false);
    }
  };

  const uploadProfilePhoto = async () => {
    if (!croppedPhotoBlob) {
      return null;
    }

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Please sign in again before uploading your profile photo.");
    }

    const objectPath = `${user.id}/${Date.now()}-profile.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(objectPath, croppedPhotoBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Photo upload failed. Please try again.");
    }

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(objectPath);
    return data.publicUrl || objectPath;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formValid) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (rawPhotoUrl && !croppedPhotoBlob) {
      setErrorMessage("Please apply crop to your selected profile photo before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrl = await uploadProfilePhoto();

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formState.firstName.trim(),
          last_name: formState.lastName.trim(),
          department: formState.department.trim(),
          year: Number(formState.year),
          hostel: formState.hostel.trim(),
          profile_photo_url: photoUrl,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback = "Profile setup failed. Please try again.";
        setErrorMessage(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }

      setSuccessMessage("Profile setup saved successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your profile."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-brand-card p-6 shadow-lg ring-1 ring-white/10 sm:p-7">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Profile Setup</h1>
          <p className="mt-2 text-sm text-white/75">
            Complete your profile so other students can trust your listings.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="first-name" className="text-sm font-medium text-white">
                First name
              </label>
              <Input
                id="first-name"
                value={formState.firstName}
                onChange={handleTextChange("firstName")}
                placeholder="Aarav"
                className="h-10 border-white/20 text-white placeholder:text-white/40"
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="last-name" className="text-sm font-medium text-white">
                Last name
              </label>
              <Input
                id="last-name"
                value={formState.lastName}
                onChange={handleTextChange("lastName")}
                placeholder="Sharma"
                className="h-10 border-white/20 text-white placeholder:text-white/40"
                maxLength={50}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className="text-sm font-medium text-white">
              Department
            </label>
            <Input
              id="department"
              value={formState.department}
              onChange={handleTextChange("department")}
              placeholder="Computer Science"
              className="h-10 border-white/20 text-white placeholder:text-white/40"
              maxLength={80}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium text-white">
                Year
              </label>
              <Select
                value={formState.year}
                onValueChange={(value) => {
                  setFormState((previous) => ({ ...previous, year: value }));
                  setErrorMessage(null);
                }}
              >
                <SelectTrigger id="year" className="border-white/20 text-white">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="hostel" className="text-sm font-medium text-white">
                Hostel
              </label>
              <Input
                id="hostel"
                value={formState.hostel}
                onChange={handleTextChange("hostel")}
                placeholder="Hostel A"
                className="h-10 border-white/20 text-white placeholder:text-white/40"
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/15 p-4">
            <div className="space-y-2">
              <label htmlFor="profile-photo" className="text-sm font-medium text-white">
                Profile photo (optional)
              </label>
              <Input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelection}
                className="h-10 border-white/20 file:mr-3 file:rounded-md file:border-0 file:bg-brand-yellow file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-dark"
              />
            </div>

            {rawPhotoUrl && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs text-white/70">Original</p>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/15">
                      <img
                        src={rawPhotoUrl}
                        alt="Original profile upload"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-white/70">Cropped preview</p>
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-white/15 bg-black/20">
                      {cropPreviewUrl ? (
                        <img
                          src={cropPreviewUrl}
                          alt="Cropped profile preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-xs text-white/50">
                          Apply crop to generate preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs text-white/80" htmlFor="zoom-slider">
                    Zoom
                  </label>
                  <input
                    id="zoom-slider"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full accent-[#F5A623]"
                  />

                  <label className="block text-xs text-white/80" htmlFor="horizontal-slider">
                    Horizontal crop position
                  </label>
                  <input
                    id="horizontal-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={xPosition}
                    onChange={(event) => setXPosition(Number(event.target.value))}
                    className="w-full accent-[#F5A623]"
                  />

                  <label className="block text-xs text-white/80" htmlFor="vertical-slider">
                    Vertical crop position
                  </label>
                  <input
                    id="vertical-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={yPosition}
                    onChange={(event) => setYPosition(Number(event.target.value))}
                    className="w-full accent-[#F5A623]"
                  />
                </div>

                <Button
                  type="button"
                  onClick={applyCrop}
                  className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
                  disabled={isCropping}
                >
                  {isCropping ? "Preparing Preview..." : "Apply Crop Preview"}
                </Button>
              </div>
            )}

            <p className="mt-4 text-xs text-white/70">
              Your identity stays hidden until a transaction is confirmed.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-2 text-sm text-white">
              {successMessage}
            </div>
          )}

          <Button
            type="submit"
            className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
            disabled={isSubmitting || !formValid}
          >
            {isSubmitting ? "Saving Profile..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </main>
  );
}
