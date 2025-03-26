import type { Metadata } from "next"
import GalleryClientPage from "./GalleryClientPage"

export const metadata: Metadata = {
  title: "Gallery - AI Headshots",
  description: "View and download your AI-generated headshots",
}

export default function GalleryPage() {
  return <GalleryClientPage />
}

