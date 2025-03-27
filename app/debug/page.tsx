"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DebugPage() {
  const [userId, setUserId] = useState("");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
      }
    }
    getUser();
  }, [supabase]);

  const handleFetchDebugInfo = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/debug-credits?userId=${userId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error fetching debug info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!userId || !credits) return;

    setLoading(true);
    try {
      const response = await fetch("/api/update-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, credits }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(
          `Credits updated! Previous: ${data.previousCredits}, New: ${data.newCredits}`
        );
        handleFetchDebugInfo();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
        <p>Please log in to access this page.</p>
        <Button onClick={() => router.push("/login")} className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Current logged in user details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Debug User Credits</CardTitle>
          <CardDescription>
            Fetch detailed information about a user's credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleFetchDebugInfo} disabled={!userId || loading}>
            {loading ? "Loading..." : "Fetch Debug Info"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Update Credits</CardTitle>
          <CardDescription>Manually update a user's credits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Credits to Add
              </label>
              <Input
                type="number"
                value={credits}
                onChange={(e) =>
                  setCredits(Number.parseInt(e.target.value, 10))
                }
                placeholder="Enter credits amount"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleUpdateCredits}
            disabled={!userId || !credits || loading}>
            {loading ? "Updating..." : "Update Credits"}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
