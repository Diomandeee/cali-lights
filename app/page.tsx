export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-glow">
          Cali Lights
        </h1>
        <p className="text-cali-gold text-lg">
          A living digital memento
        </p>
        <div className="mt-8 space-y-4 text-sm text-gray-400">
          <p>Scan the QR code to begin</p>
        </div>
      </div>
    </main>
  );
}
