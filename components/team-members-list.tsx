"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, UserMinus } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface TeamMembersListProps {
  members: TeamMember[];
  currentUserId: string;
  hasEnoughCredits: boolean;
}

export default function TeamMembersList({
  members: initialMembers,
  currentUserId,
  hasEnoughCredits,
}: TeamMembersListProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isLoading, setIsLoading] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_lead_id", currentUserId)
        .eq("member_id", memberToRemove.id);

      if (error) {
        throw error;
      }

      setMembers(members.filter((member) => member.id !== memberToRemove.id));
      setMemberToRemove(null);

      toast({
        title: "Member removed",
        description: "The team member has been removed successfully",
      });
    } catch (error) {
      console.error("Error removing team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>
          Manage members of your team who can use your credits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No team members yet</p>
            <p className="text-sm mt-2">
              {hasEnoughCredits
                ? "Invite team members to let them generate headshots using your credits"
                : "You need more than 1 credit to invite team members"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.full_name || "Unnamed User"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    {format(new Date(member.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMemberToRemove(member)}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Team Member
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            {member.full_name || member.email} from your team?
                            They will no longer be able to use your credits.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleRemoveMember}
                            disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Removing...
                              </>
                            ) : (
                              "Remove"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
