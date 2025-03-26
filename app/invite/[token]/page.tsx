"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [inviter, setInviter] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    }

    async function fetchInvitation() {
      try {
        setIsLoading(true);

        // Get the invitation details
        const { data: invitation, error: invitationError } = await supabase
          .from("invitations")
          .select("*, team_lead:team_lead_id(id, full_name, email)")
          .eq("token", token)
          .single();

        if (invitationError) {
          setError("Invitation not found or has expired");
          return;
        }

        // Check if the invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          setError("This invitation has expired");
          return;
        }

        // Check if the invitation has already been accepted
        if (invitation.accepted_at) {
          setError("This invitation has already been accepted");
          return;
        }

        setInvitation(invitation);
        setInviter(invitation.team_lead);
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError("Failed to load invitation details");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
    fetchInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    try {
      setIsAccepting(true);

      // Check if the user is authenticated
      const { data: authData } = await supabase.auth.getSession();

      if (!authData.session) {
        // If not authenticated, redirect to sign in page with return URL
        router.push(`/auth/signin?returnUrl=/invite/${token}`);
        return;
      }

      // Check if the user's email matches the invitation email
      if (authData.session.user.email !== invitation.email) {
        setError(
          `This invitation was sent to ${invitation.email}. Please sign in with that email address.`
        );
        return;
      }

      // Accept the invitation
      const response = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept invitation");
      }

      toast({
        title: "Invitation accepted",
        description: `You are now part of ${
          inviter.full_name || inviter.email
        }'s team`,
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Failed to accept invitation. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading Invitation</CardTitle>
            <CardDescription>
              Please wait while we load your invitation details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>You've Been Invited</CardTitle>
          <CardDescription>
            {inviter?.full_name || inviter?.email || "Someone"} has invited you
            to join their team on AI Headshots Generator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">Invitation Details</p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">From:</span>{" "}
                {inviter?.full_name || inviter?.email || "Unknown"}
              </li>
              <li>
                <span className="text-muted-foreground">To:</span>{" "}
                {invitation?.email}
              </li>
              <li>
                <span className="text-muted-foreground">Expires:</span>{" "}
                {new Date(invitation?.expires_at).toLocaleDateString()}
              </li>
            </ul>
          </div>
          <p className="text-sm text-center">
            By accepting this invitation, you'll be able to generate AI
            headshots using credits from your team lead.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full">
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
