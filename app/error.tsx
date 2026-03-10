"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-5xl mb-4">🏀</div>
      <h2 className="text-xl font-bold text-[#001A57] mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-6 max-w-sm">
        We couldn&apos;t load this page. Try refreshing or come back in a bit.
      </p>
      <button
        onClick={reset}
        className="bg-[#003087] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#001A57] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
