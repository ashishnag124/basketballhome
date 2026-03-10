export default function Loading() {
  return (
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl animate-pulse shadow-sm" />
        ))}
      </div>
    </div>
  );
}
