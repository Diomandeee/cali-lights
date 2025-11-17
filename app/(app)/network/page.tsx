import { apiFetch } from "@/lib/api-client";
import { OrbitMap } from "@/components/network/OrbitMap";

type NetworkResponse = {
  chains: Array<{
    id: string;
    name: string;
    streak_days: number;
    dominant_hue: number | null;
  }>;
  connections: Array<{
    id: string;
    from_chain_id: string;
    to_chain_id: string;
  }>;
  bridgeEvents: Array<{
    id: string;
    chain_a_id: string;
    chain_b_id: string;
    chain_a_name: string;
    chain_b_name: string;
    shared_tags: string[] | null;
    hue_delta: number | null;
    created_at: string;
  }>;
  missions?: Array<{
    id: string;
    chain_id: string;
    prompt: string;
    state: string;
    submissions_received: number;
    submissions_required: number;
  }>;
};

export default async function NetworkPage() {
  const data = await apiFetch<NetworkResponse>("/api/network");

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="space-y-2 sm:space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/40">
          Orbit Map
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">Your constellation</h1>
        <p className="text-base sm:text-lg text-white/70 leading-relaxed">
          Chains linked by shared palettes, shared rituals, shared light.
        </p>
      </div>
      <div className="relative">
        <OrbitMap 
          chains={data.chains} 
          connections={data.connections}
          missions={data.missions}
        />
      </div>
      {data.bridgeEvents.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Recent bridge sparks</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {data.bridgeEvents.slice(0, 6).map((event) => (
              <li key={event.id} className="flex items-center justify-between">
                <span>
                  {event.chain_a_name} ↔ {event.chain_b_name}
                </span>
                <span className="text-xs text-white/40">
                  {event.shared_tags?.[0] ?? "palette"} ·{" "}
                  {Math.round(
                    (Date.now() - new Date(event.created_at).getTime()) / 60000
                  )}
                  m ago
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
