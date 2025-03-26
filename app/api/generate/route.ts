import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { uploadImageToBlob, submitAstriaGeneration } from "@/lib/astria";

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

    // Parse the form data
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const background = formData.get("background") as string;
    const outfit = formData.get("outfit") as string;
    const useTeamLeadCredits = formData.get("useTeamLeadCredits") === "true";

    if (!photo) {
      return NextResponse.json(
        { success: false, message: "Photo is required" },
        { status: 400 }
      );
    }

    // Get user profile to check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, message: "Failed to get user profile" },
        { status: 500 }
      );
    }

    let creditUserId = session.user.id;
    let hasEnoughCredits = profile.credits >= 1;

    // If the user wants to use team lead credits and doesn't have enough credits
    if (useTeamLeadCredits && !hasEnoughCredits) {
      // Get the user's team leads
      const { data: teamLeads } = await supabase
        .from("team_members")
        .select("team_lead_id")
        .eq("member_id", session.user.id);

      if (!teamLeads || teamLeads.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "You don't have any team leads to use credits from",
          },
          { status: 400 }
        );
      }

      // Find a team lead with enough credits
      let teamLeadWithCredits = null;
      for (const tl of teamLeads) {
        const { data: teamLeadProfile } = await supabase
          .from("profiles")
          .select("id, credits")
          .eq("id", tl.team_lead_id)
          .single();

        if (teamLeadProfile && teamLeadProfile.credits >= 1) {
          teamLeadWithCredits = teamLeadProfile;
          break;
        }
      }

      if (!teamLeadWithCredits) {
        return NextResponse.json(
          {
            success: false,
            message: "None of your team leads have enough credits",
          },
          { status: 400 }
        );
      }

      // Use the team lead's credits
      creditUserId = teamLeadWithCredits.id;
      hasEnoughCredits = true;
    }

    // Final check if user has enough credits
    if (!hasEnoughCredits) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You don't have enough credits. Please purchase more credits.",
        },
        { status: 400 }
      );
    }

    // Upload the photo to Vercel Blob
    const imageUrl = await uploadImageToBlob(photo, session.user.id);

    // Submit the generation request to Astria
    const generation = await submitAstriaGeneration(
      imageUrl,
      background,
      outfit
    );

    // Store the generation job in the database
    const { data: job, error: jobError } = await supabase
      .from("headshot_jobs")
      .insert({
        user_id: session.user.id,
        team_lead_id: creditUserId !== session.user.id ? creditUserId : null,
        input_image_url: imageUrl,
        background,
        outfit,
        status: "processing",
        astria_generation_id: generation.id,
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json(
        { success: false, message: "Failed to create job record" },
        { status: 500 }
      );
    }

    // Deduct one credit from the credit user (either the user or their team lead)
    const { data: creditUser, error: creditUserError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", creditUserId)
      .single();

    if (creditUserError) {
      return NextResponse.json(
        { success: false, message: "Failed to get credit user" },
        { status: 500 }
      );
    }

    const { error: creditError } = await supabase
      .from("profiles")
      .update({ credits: creditUser.credits - 1 })
      .eq("id", creditUserId);

    if (creditError) {
      return NextResponse.json(
        { success: false, message: "Failed to update credits" },
        { status: 500 }
      );
    }

    // Record credit usage
    await supabase.from("credit_usage").insert({
      user_id: session.user.id,
      team_lead_id: creditUserId !== session.user.id ? creditUserId : null,
      amount: 1,
      description: "Generated AI headshots",
    });

    return NextResponse.json({
      success: true,
      message: "Headshots generation started",
      jobId: job.id,
      astriaGenerationId: generation.id,
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
