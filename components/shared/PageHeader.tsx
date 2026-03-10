interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
}

export default function PageHeader({ title, subtitle, accent }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {accent && (
        <span className="text-[#B5A36A] text-xs font-semibold uppercase tracking-widest">
          {accent}
        </span>
      )}
      <h1 className="text-2xl md:text-3xl font-bold text-[#001A57] font-['Oswald',sans-serif] mt-1">
        {title}
      </h1>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}
