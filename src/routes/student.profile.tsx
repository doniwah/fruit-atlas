import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/app/ProfilePage";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "Profile — Student" }] }),
  component: () => <ProfilePage role="student" />,
});
