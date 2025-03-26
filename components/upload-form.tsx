"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { HEADSHOT_BACKGROUNDS, HEADSHOT_OUTFITS } from "@/lib/astria";
import { supabase } from "@/lib/supabase";

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState("office");
  const [selectedOutfit, setSelectedOutfit] = useState("business");
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTeamLeads, setHasTeamLeads] = useState(false);
  const [useTeamLeadCredits, setUseTeamLeadCredits] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user credits and team lead status on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        // Get user credits
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        setCredits(profile.credits);

        // Check if user has team leads
        const { data: teamLeads, error: teamLeadsError } = await supabase
          .from("team_members")
          .select("team_lead_id")
          .eq("member_id", session.user.id);

        if (teamLeadsError) throw teamLeadsError;
        setHasTeamLeads(teamLeads && teamLeads.length > 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(
          "Failed to fetch your available credits. Please refresh the page."
        );
      }
    }

    fetchUserData();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/heic"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or HEIC image.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Please upload an image smaller than 10MB.");
      return;
    }

    setError(null);
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/heic"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a JPG, PNG, or HEIC image.");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Please upload an image smaller than 10MB.");
        return;
      }

      setError(null);
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPhoto) {
      setError("Please upload a photo first.");
      return;
    }

    const hasEnoughCredits = credits !== null && credits >= 1;
    const canUseTeamLeadCredits = hasTeamLeads && useTeamLeadCredits;

    if (!hasEnoughCredits && !canUseTeamLeadCredits) {
      setError(
        "You don't have enough credits. Please purchase more credits or use your team lead's credits."
      );
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append("photo", selectedPhoto);
      formData.append("background", selectedBackground);
      formData.append("outfit", selectedOutfit);
      formData.append(
        "useTeamLeadCredits",
        canUseTeamLeadCredits ? "true" : "false"
      );

      // Submit the form to the API
      const response = await fetch("/api/headshots/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate headshots");
      }

      toast({
        title: "Success",
        description:
          "Your headshots are being generated. You'll be notified when they're ready.",
      });

      // Redirect to the processing page
      router.push(`/dashboard/headshots/processing/${data.jobId}`);
    } catch (error) {
      console.error("Error generating headshots:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Photo</CardTitle>
            <CardDescription>
              Upload a clear photo of your face. For best results, use a
              well-lit photo with a neutral expression.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col items-center justify-center gap-4">
                <div
                  className={`relative flex aspect-square w-full max-w-[300px] flex-col items-center justify-center rounded-lg border-2 ${
                    photoPreview ? "border-muted" : "border-dashed border-muted"
                  } p-4`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}>
                  {photoPreview ? (
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Drag and drop your photo here or click to browse
                      </p>
                    </>
                  )}
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="photo">Upload Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, or HEIC. Max 10MB.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose Your Style</CardTitle>
            <CardDescription>
              Select backgrounds and outfits for your professional headshots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="backgrounds" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
                <TabsTrigger value="outfits">Outfits</TabsTrigger>
              </TabsList>
              <TabsContent value="backgrounds" className="space-y-4 mt-4">
                <RadioGroup
                  value={selectedBackground}
                  onValueChange={setSelectedBackground}
                  className="grid grid-cols-1 gap-4">
                  {HEADSHOT_BACKGROUNDS.map((background) => (
                    <div
                      key={background.id}
                      className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={background.id}
                        id={`background-${background.id}`}
                      />
                      <Label
                        htmlFor={`background-${background.id}`}
                        className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded bg-muted"></div>
                        <div>
                          <p>{background.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {background.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </TabsContent>
              <TabsContent value="outfits" className="space-y-4 mt-4">
                <RadioGroup
                  value={selectedOutfit}
                  onValueChange={setSelectedOutfit}
                  className="grid grid-cols-1 gap-4">
                  {HEADSHOT_OUTFITS.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={outfit.id}
                        id={`outfit-${outfit.id}`}
                      />
                      <Label
                        htmlFor={`outfit-${outfit.id}`}
                        className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded bg-muted"></div>
                        <div>
                          <p>{outfit.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {outfit.description}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {hasTeamLeads && (credits === null || credits < 1) && (
              <div className="flex items-center space-x-2 mb-2 w-full">
                <Checkbox
                  id="use-team-lead-credits"
                  checked={useTeamLeadCredits}
                  onCheckedChange={(checked) =>
                    setUseTeamLeadCredits(checked as boolean)
                  }
                />
                <Label htmlFor="use-team-lead-credits">
                  Use my team lead's credits
                </Label>
              </div>
            )}
            <p className="text-sm text-muted-foreground w-full">
              This will use 1 credit to generate 40 professional headshots.
              {credits !== null && (
                <span>
                  {" "}
                  You have{" "}
                  <strong>
                    {credits} credit{credits !== 1 ? "s" : ""}
                  </strong>{" "}
                  available.
                </span>
              )}
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={
                isUploading ||
                !selectedPhoto ||
                ((credits === null || credits < 1) &&
                  (!hasTeamLeads || !useTeamLeadCredits))
              }>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Generate Headshots"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}
