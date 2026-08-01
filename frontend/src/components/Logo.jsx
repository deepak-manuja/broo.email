import { Mail } from 'lucide-react';

export default function Logo({ size = 'md', showTag = false }) {
  const sizes = {
    sm: { iconSize: 14, iconBox: 'w-6 h-6 rounded-md', text: 'text-sm' },
    md: { iconSize: 18, iconBox: 'w-8 h-8 rounded-lg', text: 'text-lg' },
    lg: { iconSize: 22, iconBox: 'w-10 h-10 rounded-xl', text: 'text-2xl' },
    xl: { iconSize: 28, iconBox: 'w-12 h-12 rounded-2xl', text: 'text-3xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div className={`flex items-center justify-center bg-gradient-to-br from-accent to-accent-hover text-white shadow-soft ${s.iconBox} transition-transform hover:scale-105 duration-200`}>
        <Mail size={s.iconSize} strokeWidth={2.2} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`font-heading font-bold tracking-tight text-text-primary ${s.text}`}>
          broo<span className="text-accent">.email</span>
        </span>
        {showTag && (
          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-accent-light text-accent border border-accent/20">
            beta
          </span>
        )}
      </div>
    </div>
  );
}
