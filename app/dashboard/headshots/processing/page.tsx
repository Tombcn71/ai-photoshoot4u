import { redirect } from "next/navigation";

export default function ProcessingIndexPage() {
  // Redirect to the dashboard if someone navigates directly to this route
  redirect("/dashboard");
}
