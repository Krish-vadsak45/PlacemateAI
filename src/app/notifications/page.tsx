import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "In-App Notifications Hub | PlaceMate AI",
  description: "Real-time alerts for impending placement deadlines, newly extracted drives, and status updates.",
};

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl">
        <NotificationsClient />
      </div>
    </div>
  );
}

