"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase-client";
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
import { Loader2 } from "lucide-react";

interface Payment {
  id: string;
  created_at: string | null;
  amount: number;
  currency: string;
  status: string;
  credits_purchased: number;
  package_id: string;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        console.log("Fetching payments...");

        // Check if the user is authenticated
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error(`Authentication error: ${sessionError.message}`);
        }

        if (!sessionData.session) {
          console.error("No active session found");
          throw new Error("You must be logged in to view payment history");
        }

        console.log("User authenticated, fetching payments...");

        // Fetch payments for the current user
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", sessionData.session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("Payments fetched:", data?.length || 0);
        setPayments(data || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
        setError(
          error instanceof Error
            ? `Failed to load payment history: ${error.message}`
            : "Failed to load payment history. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No payment history found.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your past credit purchases</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.created_at
                    ? format(new Date(payment.created_at), "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell className="capitalize">
                  {payment.package_id}
                </TableCell>
                <TableCell>{payment.credits_purchased}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: payment.currency.toUpperCase(),
                  }).format(payment.amount)}
                </TableCell>
                <TableCell className="capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === "completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}>
                    {payment.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
