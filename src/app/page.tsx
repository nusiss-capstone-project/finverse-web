import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();
  const role = (user?.publicMetadata as Record<string, unknown> | undefined)
    ?.role;

  redirect(role === "admin" ? "/admin/campaigns" : "/wallet");
}
