import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

// Astria API client for AI headshot generation
export interface AstriaGenerationOptions {
  prompt: string
  negative_prompt?: string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
}

export interface AstriaGenerationRequest {
  input_image: string // URL to the input image
  prompt: string
  negative_prompt?: string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
}

export interface AstriaGenerationResponse {
  id: string
  status: "processing" | "completed" | "failed"
  output_images?: string[]
  error?: string
}

export interface HeadshotStyle {
  id: string
  name: string
  prompt: string
  negative_prompt?: string
  preview_image?: string
}

export interface HeadshotBackground {
  id: string
  name: string
  description: string
  prompt_addition: string
  preview_image?: string
}

export interface HeadshotOutfit {
  id: string
  name: string
  description: string
  prompt_addition: string
  preview_image?: string
}

// Available headshot backgrounds
export const HEADSHOT_BACKGROUNDS: HeadshotBackground[] = [
  {
    id: "office",
    name: "Office",
    description: "Professional office environment with soft lighting",
    prompt_addition: "professional headshot with neutral office background, soft professional lighting",
    preview_image: "/backgrounds/office.jpg",
  },
  {
    id: "studio",
    name: "Studio",
    description: "Clean studio background with professional lighting",
    prompt_addition: "professional studio headshot with clean background, professional studio lighting",
    preview_image: "/backgrounds/studio.jpg",
  },
  {
    id: "gradient",
    name: "Gradient",
    description: "Smooth color gradient background",
    prompt_addition: "professional headshot with smooth gradient background, professional lighting",
    preview_image: "/backgrounds/gradient.jpg",
  },
  {
    id: "outdoor",
    name: "Outdoor",
    description: "Natural outdoor setting with soft bokeh",
    prompt_addition: "professional headshot in outdoor setting with natural bokeh background, soft natural lighting",
    preview_image: "/backgrounds/outdoor.jpg",
  },
  {
    id: "abstract",
    name: "Abstract",
    description: "Modern abstract background with subtle colors",
    prompt_addition: "professional headshot with modern abstract background, professional lighting",
    preview_image: "/backgrounds/abstract.jpg",
  },
]

// Available headshot outfits
export const HEADSHOT_OUTFITS: HeadshotOutfit[] = [
  {
    id: "business",
    name: "Business Suit",
    description: "Professional business suit",
    prompt_addition: "wearing a professional business suit, formal business attire",
    preview_image: "/outfits/business.jpg",
  },
  {
    id: "casual",
    name: "Smart Casual",
    description: "Smart casual professional attire",
    prompt_addition: "wearing smart casual professional attire, business casual",
    preview_image: "/outfits/casual.jpg",
  },
  {
    id: "creative",
    name: "Creative Professional",
    description: "Stylish outfit for creative professionals",
    prompt_addition: "wearing stylish creative professional attire, modern creative outfit",
    preview_image: "/outfits/creative.jpg",
  },
  {
    id: "tech",
    name: "Tech Professional",
    description: "Modern tech industry attire",
    prompt_addition: "wearing modern tech industry attire, tech professional outfit",
    preview_image: "/outfits/tech.jpg",
  },
  {
    id: "formal",
    name: "Formal Attire",
    description: "Elegant formal attire",
    prompt_addition: "wearing elegant formal attire, high-end formal outfit",
    preview_image: "/outfits/formal.jpg",
  },
]

// Base prompt for professional headshots
const BASE_PROMPT =
  "professional headshot portrait of subject, high quality, high resolution, photorealistic, 8k, detailed"

// Negative prompt to avoid common issues
const BASE_NEGATIVE_PROMPT =
  "cartoon, illustration, drawing, painting, sketch, anime, 3d render, deformed, distorted, disfigured, mutation, extra limbs, extra fingers, fewer fingers, bad anatomy"

/**
 * Uploads an image to Vercel Blob and returns the URL
 */
export async function uploadImageToBlob(file: File, userId: string): Promise<string> {
  const filename = `${userId}/${uuidv4()}-${file.name}`
  const { url } = await put(filename, file, { access: "public" })
  return url
}

/**
 * Builds a complete prompt for Astria API based on selected background and outfit
 */
export function buildAstriaPrompt(backgroundId: string, outfitId: string): string {
  const background = HEADSHOT_BACKGROUNDS.find((bg) => bg.id === backgroundId) || HEADSHOT_BACKGROUNDS[0]
  const outfit = HEADSHOT_OUTFITS.find((o) => o.id === outfitId) || HEADSHOT_OUTFITS[0]

  return `${BASE_PROMPT}, ${background.prompt_addition}, ${outfit.prompt_addition}`
}

/**
 * Submits a generation request to Astria API
 */
export async function submitAstriaGeneration(
  imageUrl: string,
  backgroundId: string,
  outfitId: string,
): Promise<AstriaGenerationResponse> {
  const prompt = buildAstriaPrompt(backgroundId, outfitId)

  const response = await fetch("https://api.astria.ai/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ASTRIA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_image: imageUrl,
      prompt: prompt,
      negative_prompt: BASE_NEGATIVE_PROMPT,
      num_inference_steps: 50,
      guidance_scale: 7.5,
    } as AstriaGenerationRequest),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Astria API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * Checks the status of a generation request
 */
export async function checkAstriaGenerationStatus(generationId: string): Promise<AstriaGenerationResponse> {
  const response = await fetch(`https://api.astria.ai/generations/${generationId}`, {
    headers: {
      Authorization: `Bearer ${process.env.ASTRIA_API_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Astria API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

/**
 * Downloads generated images from Astria and uploads them to Vercel Blob
 */
export async function saveGeneratedHeadshots(generationId: string, userId: string): Promise<string[]> {
  // Get the generation result
  const generation = await checkAstriaGenerationStatus(generationId)

  if (generation.status !== "completed" || !generation.output_images || generation.output_images.length === 0) {
    throw new Error("Generation not completed or no images available")
  }

  // Download each image and upload to Blob
  const blobUrls: string[] = []

  for (let i = 0; i < generation.output_images.length; i++) {
    const imageUrl = generation.output_images[i]
    const response = await fetch(imageUrl)
    const imageBlob = await response.blob()
    const file = new File([imageBlob], `headshot-${i}.jpg`, { type: "image/jpeg" })

    const blobUrl = await uploadImageToBlob(file, `${userId}/generated/${generationId}`)
    blobUrls.push(blobUrl)
  }

  return blobUrls
}

