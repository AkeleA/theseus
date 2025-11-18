"use client";
import { useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [alias, setAlias] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate a real QR code for a URL
  const generateQR = async (url: string): Promise<string> => {
    return QRCode.toDataURL(url, {
      margin: 1,
      scale: 6,
    });
  };

  const handleSubmit = async () => {
    if (!input || loading) return;

    setLoading(true);
    setErr(null);
    setResult(null);
    setQr(null);
    setCopied(false);

    try {
      const body: { long_url: string; custom_alias?: string } = {
        long_url: input,
      };
      if (alias.trim()) {
        body.custom_alias = alias.trim();
      }

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data: { short_url?: string; code?: string; error?: string } =
        await res.json();

      if (!res.ok || !data.short_url) {
        throw new Error(data.error || "Failed to shorten URL");
      }

      setResult(data.short_url);
      const qrCode = await generateQR(data.short_url);
      setQr(qrCode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      void handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* Header - Brutalist Typography */}
      <header className="border-b-4 border-lime-400 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-lime-400 leading-none mb-2">
                HERMES
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-zinc-400 tracking-wide">
                ↓ SPEEDY URL COMPRESSION TERMINAL ↓
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-zinc-500 mb-1">STATUS</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 animate-pulse" />
                <span className="text-lime-400 font-bold">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
        {/* Info Banner */}
        <div className="border-2 border-zinc-700 bg-zinc-900 p-3 sm:p-4 mb-6 sm:mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-lime-400" />
          <div className="pl-3 sm:pl-4">
            <div className="text-xs text-zinc-500 mb-1">SYSTEM INFO</div>
            <p className="text-xs sm:text-sm text-zinc-300">
              Edge-cached 301 redirects · Base62 encoding · 9-character codes
            </p>
          </div>
        </div>

        {/* Main Input Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="border-2 border-zinc-700 bg-zinc-900">
            <div className="p-3 sm:p-4">
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wider">
                Long URL
              </label>
              <input
                className="w-full bg-black border-2 border-zinc-700 text-zinc-100 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-lime-400 transition-colors font-mono"
                placeholder="https://example.com/very/long/path"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          <div className="border-2 border-zinc-700 bg-zinc-900">
            <div className="p-3 sm:p-4">
              <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wider">
                Custom Alias
              </label>
              <input
                className="w-full bg-black border-2 border-zinc-700 text-zinc-100 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                placeholder="my-custom-shortcode"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !input}
            className="w-full bg-lime-400 text-black font-bold py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm uppercase tracking-widest hover:bg-lime-300 disabled:bg-zinc-700 disabled:text-zinc-500 transition-all border-2 border-black hover:border-lime-500 relative overflow-hidden group"
          >
            <span className={loading ? "opacity-0" : ""}>
              → Execute Compression
            </span>
            {loading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="animate-pulse">PROCESSING...</span>
              </span>
            )}
          </button>
        </div>

        {/* Error Display */}
        {err && (
          <div className="border-2 border-red-500 bg-red-950/30 p-3 sm:p-4 w-full mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-red-500 font-bold text-base sm:text-lg">
                ⚠
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-red-400 mb-1">ERROR</div>
                <p className="text-xs sm:text-sm text-red-300 wrap-break-word">
                  {err}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="rounded-lg shadow-2xs bg-black w-full flex flex-col items-center justify-center">
            <div className="w-full bg-lime-400 text-black px-3 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm uppercase tracking-wider text-center">
              ✓ Compression Complete
            </div>

            <div className="w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* URL Display */}
              <div>
                <div className="text-xs text-zinc-500 mb-2 uppercase">
                  Output URL
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 bg-zinc-900 border-2 border-zinc-700 text-lime-400 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-mono min-w-0"
                    readOnly
                    value={result}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-zinc-900 border-2 border-zinc-700 hover:border-lime-400 hover:text-lime-400 transition-all text-xs sm:text-sm font-bold uppercase whitespace-nowrap"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              {/* QR Code */}
              {qr && (
                <div className="w-full flex flex-col items-center justify-center space-y-3 sm:space-y-4 pt-4 border-t-2 border-zinc-800">
                  <div className="text-xs sm:text-sm text-white uppercase">
                    QR Matrix
                  </div>
                  <div className="border-2 border-zinc-700 bg-white p-2 sm:p-3">
                    <Image
                      src={qr}
                      alt="QR code"
                      width={200}
                      height={200}
                      className="w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-lime-400">
              301
            </div>
            <div className="text-xs text-zinc-500 uppercase">Redirect Type</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-lime-400">
              BASE62
            </div>
            <div className="text-xs text-zinc-500 uppercase">Encoding</div>
          </div>
          <div className="border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-lime-400">
              9-CHAR
            </div>
            <div className="text-xs text-zinc-500 uppercase">Code Length</div>
          </div>
        </div>
      </main>
    </div>
  );
}
