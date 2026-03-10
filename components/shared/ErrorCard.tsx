export default function ErrorCard({ message = "Something went wrong. Please try again." }: { message?: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <div className="text-2xl mb-2">🏀</div>
      <p className="text-red-700 font-medium">{message}</p>
      <p className="text-red-500 text-sm mt-1">Check back soon — we&apos;ll keep trying.</p>
    </div>
  );
}
