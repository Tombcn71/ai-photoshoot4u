import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
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

    // Get user profile to check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits, business_id")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: "Failed to get user profile" },
        { status: 500 }
      );
    }

    // Check if user has enough credits
    if (profile.credits < 1) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You don't have enough credits. Please purchase more credits.",
        },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const background = formData.get("background") as string;
    const outfit = formData.get("outfit") as string;

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Photo is required" },
        { status: 400 }
      );
    }

    // Upload the photo to Vercel Blob
    const filename = `${session.user.id}/${uuidv4()}-${photo.name}`;
    const { url: imageUrl } = await put(filename, photo, { access: "public" });

    // In a real implementation, you would call the AI service here
    // For now, we'll simulate the process

    // Create a job record in the database
    const { data: job, error: jobError } = await supabase
      .from("headshot_jobs")
      .insert({
        user_id: session.user.id,
        business_id: profile.business_id,
        astria_generation_id: uuidv4(), // This would be the actual ID from the AI service
        background,
        outfit,
        input_image_url: imageUrl,
        status: "processing",
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { success: false, message: "Failed to create job record" },
        { status: 500 }
      );
    }

    // Deduct one credit from the user
    const { error: creditError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", session.user.id);

    if (creditError) {
      return NextResponse.json(
        { success: false, message: "Failed to update credits" },
        { status: 500 }
      );
    }

    // Record credit usage
    await supabase.from("credit_usage").insert({
      user_id: session.user.id,
      business_id: profile.business_id,
      amount: 1,
      description: "Generated AI headshots",
    });

    return NextResponse.json({
      success: true,
      message: "Headshots generation started",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Error generating headshots:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
