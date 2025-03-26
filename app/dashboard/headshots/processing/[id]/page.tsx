"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardHeader from "@/components/dashboard-header";
import DashboardShell from "@/components/dashboard-shell";
import { useToast } from "@/hooks/use-toast";

interface ProcessingPageProps {
  params: {
    id: string;
  };
}

export default function ProcessingPage({ params }: ProcessingPageProps) {
  const { id } = params;
  const [status, setStatus] = useState<"processing" | "completed" | "failed">(
    "processing"
  );
  const [progress, setProgress] = useState(0);
  const [headshots, setHeadshots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    // Function to check the status of the generation
    async function checkStatus() {
      try {
        const response = await fetch(`/api/headshots/status/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus("failed");
          setError(data.message || "Something went wrong. Please try again.");
          clearInterval(interval);
          clearInterval(progressInterval);
          return;
        }

        if (data.status === "completed") {
          setStatus("completed");
          setHeadshots(data.headshots || []);
          setProgress(100);
          clearInterval(interval);
          clearInterval(progressInterval);

          toast({
            title: "Success",
            description: "Your headshots have been generated successfully!",
          });
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.message || "Generation failed. Please try again.");
          clearInterval(interval);
          clearInterval(progressInterval);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    }

    // Check status immediately
    checkStatus();

    // Then check every 10 seconds
    interval = setInterval(checkStatus, 10000);

    // Simulate progress for better UX
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Max progress during processing is 90%
        if (prev < 90) {
          return prev + Math.random() * 5;
        }
        return prev;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [id, toast]);

  const handleViewResults = () => {
    router.push(`/dashboard/gallery`);
  };

  const handleTryAgain = () => {
    router.push("/dashboard/generate");
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Processing Headshots"
        text="Your AI headshots are being generated">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </DashboardHeader>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {status === "processing" && "Generating Your Headshots"}
            {status === "completed" && "Headshots Generated Successfully!"}
            {status === "failed" && "Generation Failed"}
          </CardTitle>
          <CardDescription>
            {status === "processing" &&
              "This may take a few minutes. Please don't close this page."}
            {status === "completed" &&
              "Your professional AI headshots are ready to view."}
            {status === "failed" &&
              (error || "Something went wrong. Please try again.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "processing" && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-center text-muted-foreground">
                We're using AI to transform your photo into professional
                headshots with your selected background and outfit.
              </p>
            </div>
          )}

          {status === "completed" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-center">
                All 40 headshots have been generated successfully. You can now
                view and download them from your gallery.
              </p>
              {headshots.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  {headshots.slice(0, 6).map((url, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md overflow-hidden border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Headshot preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error ||
                    "We encountered an error while generating your headshots. Please try again."}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === "processing" && (
            <p className="text-sm text-muted-foreground">
              This typically takes 3-5 minutes. You'll be notified when it's
              complete.
            </p>
          )}

          {status === "completed" && (
            <Button onClick={handleViewResults}>View All Headshots</Button>
          )}

          {status === "failed" && (
            <Button onClick={handleTryAgain}>Try Again</Button>
          )}
        </CardFooter>
      </Card>
    </DashboardShell>
  );
}
