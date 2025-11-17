import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function RootRedirect() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/home");
  }
  redirect("/login");
}
