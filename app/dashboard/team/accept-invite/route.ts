import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Invitation token is required" },
        { status: 400 }
      );
    }

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

    // Get the invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Check if the user's email matches the invitation email
    if (session.user.email !== invitation.email) {
      return NextResponse.json(
        {
          success: false,
          message: "This invitation was sent to a different email address",
        },
        { status: 400 }
      );
    }

    // Begin a transaction
    const { error: transactionError } = await supabase.rpc(
      "accept_invitation",
      {
        p_token: token,
        p_member_id: session.user.id,
        p_accepted_at: new Date().toISOString(),
      }
    );

    if (transactionError) {
      return NextResponse.json(
        { success: false, message: "Failed to accept invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
