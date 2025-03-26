"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Update keyframes for right-to-left scrolling
const scrollKeyframes = `
@keyframes scroll {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
`;

interface AutoSliderProps {
  images: { src: string; alt: string }[];
  speed?: number;
  className?: string;
}

export function AutoSlider({ images, speed = 30, className }: AutoSliderProps) {
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedImages, setLoadedImages] = useState<number>(0);
  const [imageStatuses, setImageStatuses] = useState<Record<string, boolean>>(
    {}
  );
  const [usingPlaceholder, setUsingPlaceholder] = useState(false);

  // Duplicate images to create a seamless loop
  const allImages = [...images, ...images];

  useEffect(() => {
    // Log the image paths to help with debugging
    console.log(
      "Image paths:",
      images.map((img) => img.src)
    );

    // Initialize image statuses
    const initialStatuses: Record<string, boolean> = {};
    allImages.forEach((img, index) => {
      initialStatuses[`${img.src}-${index}`] = false;
    });
    setImageStatuses(initialStatuses);

    // Force set isLoaded to true after a timeout (fallback)
    const timer = setTimeout(() => {
      console.log("Forcing isLoaded to true after timeout");
      setIsLoaded(true);
    }, 3000);

    // For placeholder images, set them as loaded immediately
    let placeholder = false;
    if (
      images.length > 0 &&
      (images[0].src.includes("placeholder") ||
        images[0].src.includes("placehold.co"))
    ) {
      console.log("Using placeholder images, setting as loaded");
      placeholder = true;
    }
    setUsingPlaceholder(placeholder);

    return () => clearTimeout(timer);
  }, [images, allImages.length]);

  useEffect(() => {
    setIsLoaded(usingPlaceholder);
  }, [usingPlaceholder]);

  const handleImageLoad = (src: string, index: number) => {
    console.log("Image loaded successfully:", src);
    setImageStatuses((prev) => ({ ...prev, [`${src}-${index}`]: true }));
    setLoadedImages((prev) => {
      const newCount = prev + 1;
      // Set isLoaded to true once at least half the images are loaded
      if (newCount >= Math.ceil(allImages.length / 2)) {
        console.log("Enough images loaded, setting isLoaded to true");
        setIsLoaded(true);
      }
      return newCount;
    });
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    src: string,
    index: number
  ) => {
    console.error("Image failed to load:", src);
    // Use a placeholder image as fallback
    e.currentTarget.src = "/placeholder.svg?height=400&width=300";
    setImageStatuses((prev) => ({ ...prev, [`${src}-${index}`]: true }));
    setLoadedImages((prev) => {
      const newCount = prev + 1;
      // Set isLoaded to true once at least half the images are loaded
      if (newCount >= Math.ceil(allImages.length / 2)) {
        console.log(
          "Enough images loaded (some with errors), setting isLoaded to true"
        );
        setIsLoaded(true);
      }
      return newCount;
    });
  };

  // If no images are provided or all images failed to load
  if (images.length === 0) {
    return (
      <div
        className={cn(
          "relative rounded-xl w-full h-[400px] bg-muted flex items-center justify-center",
          className
        )}>
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No images available</p>
        </div>
      </div>
    );
  }

  // Add the keyframes to the document
  useEffect(() => {
    let styleSheet: HTMLStyleElement | null = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = scrollKeyframes;
    document.head.appendChild(styleSheet);

    return () => {
      if (styleSheet && styleSheet.parentNode) {
        document.head.removeChild(styleSheet);
      }
      styleSheet = null;
    };
  }, []);

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl w-full", className)}>
      {!isLoaded && !usingPlaceholder && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading images...</p>
        </div>
      )}

      <div
        ref={sliderRef}
        className="flex overflow-x-hidden w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}>
        <div
          className="flex gap-4 py-4"
          style={{
            width: "max-content",
            animationName: isLoaded ? "scroll" : "none",
            animationDuration: `${speed}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDirection: "normal",
            animationPlayState: isPaused ? "paused" : "running",
          }}>
          {allImages.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="flex-shrink-0 w-[220px] aspect-[3/4] rounded-lg overflow-hidden shadow-md relative group bg-muted">
              <img
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                className="w-full h-full object-cover"
                onLoad={() => handleImageLoad(image.src, index)}
                onError={(e) => handleImageError(e, image.src, index)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
