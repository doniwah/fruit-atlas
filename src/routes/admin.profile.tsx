import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/app/ProfilePage";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({ meta: [{ title: "Profile — Admin" }] }),
  component: () => <ProfilePage role="admin" />,
});
