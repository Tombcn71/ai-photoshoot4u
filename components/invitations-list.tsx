"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
// Update the import to use the client version
import { supabase } from "@/lib/supabase-client";
import InviteMemberDialog from "@/components/invite-member-dialog";

interface Invitation {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
}

interface InvitationsListProps {
  invitations: Invitation[];
  hasEnoughCredits: boolean;
}

export default function InvitationsList({
  invitations: initialInvitations,
  hasEnoughCredits,
}: InvitationsListProps) {
  const [invitations, setInvitations] =
    useState<Invitation[]>(initialInvitations);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) {
        throw error;
      }

      setInvitations(invitations.filter((inv) => inv.id !== invitationId));

      toast({
        title: "Invitation canceled",
        description: "The invitation has been canceled successfully",
      });
    } catch (error) {
      console.error("Error canceling invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleInviteSent = () => {
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Manage invitations to your team</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <InviteMemberDialog
            hasEnoughCredits={hasEnoughCredits}
            onInviteSent={handleInviteSent}
          />
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No pending invitations</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    {format(new Date(invitation.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invitation.expires_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
