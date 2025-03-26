import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { saveGeneratedHeadshots } from "@/lib/astria";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;

    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the job from the database
    const { data: job, error: jobError } = await supabase
      .from("headshot_jobs")
      .select("*")
      .eq("id", jobId)
      .eq("user_id", session.user.id)
      .single();

    if (jobError) {
      return NextResponse.json(
        { success: false, message: "Job not found" },
        { status: 404 }
      );
    }

    // If job is already completed, return the results
    if (job.status === "completed") {
      return NextResponse.json({
        success: true,
        status: "completed",
        headshots: job.output_image_urls,
      });
    }

    // If job is failed, return the error
    if (job.status === "failed") {
      return NextResponse.json(
        {
          success: false,
          status: "failed",
          message: job.error_message || "Generation failed",
        },
        { status: 500 }
      );
    }

    // For demo purposes, let's simulate the AI processing
    // In a real implementation, you would check the status with the AI service

    // Randomly complete the job after a few requests (for demo purposes)
    const shouldComplete = Math.random() > 0.7;

    if (shouldComplete) {
      // Generate headshot URLs
      const outputUrls = await saveGeneratedHeadshots(
        job.astria_generation_id,
        session.user.id
      );

      // Update the job with the output image URLs
      await supabase
        .from("headshot_jobs")
        .update({
          status: "completed",
          output_image_urls: outputUrls,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return NextResponse.json({
        success: true,
        status: "completed",
        headshots: outputUrls,
      });
    }

    // If still processing, return the status
    return NextResponse.json({
      success: true,
      status: "processing",
    });
  } catch (error) {
    console.error("Error checking headshot status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
