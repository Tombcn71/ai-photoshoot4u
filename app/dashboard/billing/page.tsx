import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CreditCard, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardShell from "@/components/dashboard-shell";
import DashboardHeader from "@/components/dashboard-header";
import BillingForm from "@/components/billing-form";
import PaymentHistory from "@/components/payment-history";
import Link from "next/link";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Get user profile with credits information
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  // Check for success or canceled payment
  const success = searchParams.success === "true";
  const canceled = searchParams.canceled === "true";

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Billing & Credits"
        text="Manage your credits and view payment history">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </DashboardHeader>

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg">
          <p className="font-medium">Payment successful!</p>
          <p className="text-sm">
            Your credits have been added to your account.
          </p>
        </div>
      )}

      {canceled && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
          <p className="font-medium">Payment canceled</p>
          <p className="text-sm">
            Your payment was canceled. No credits were added to your account.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Credits
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.credits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Credits available for generating headshots
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Purchase Credits</h2>
            <BillingForm />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Payment History</h2>
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }>
              <ErrorBoundary
                fallback={
                  <div className="text-center py-8 text-muted-foreground">
                    <p>
                      Failed to load payment history. Please try again later.
                    </p>
                  </div>
                }>
                <PaymentHistory />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
