import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/network");
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black via-[#08020f] to-black p-6 text-white">
      <div className="mb-8 text-center space-y-2">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">
          Cali Lights
        </p>
        <h1 className="text-4xl font-semibold">Enter the orbit</h1>
        <p className="text-white/60 text-sm">
          Triad missions, Veo recaps, intimate daily rituals.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
