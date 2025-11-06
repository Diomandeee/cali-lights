export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Ambient glow effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cali-magenta/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cali-purple/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="text-center space-y-6 relative z-10">
        <h1 className="text-6xl md:text-7xl font-bold text-glow bg-gradient-to-r from-cali-magenta via-cali-purple to-cali-pink bg-clip-text text-transparent">
          Cali Lights
        </h1>
        <p className="text-cali-magenta text-xl font-medium">
          A living digital memento
        </p>
        <div className="mt-12 space-y-4 text-sm text-gray-400">
          <p className="text-lg">Scan the QR code to begin</p>
          <p className="text-xs opacity-60">Happy Birthday Alize ✨</p>
        </div>
      </div>
    </main>
  );
}
