export default function Loading() {
  return (
    <div>
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl animate-pulse shadow-sm" />
        ))}
      </div>
      <div className="h-64 bg-white rounded-xl animate-pulse shadow-sm" />
    </div>
  );
}
