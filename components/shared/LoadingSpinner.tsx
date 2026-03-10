export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizes[size]} border-4 border-gray-200 border-t-[#003087] rounded-full animate-spin`}
      />
    </div>
  );
}
