import { Mail } from 'lucide-react';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { iconSize: 13, iconBox: 'w-6 h-6 rounded-md', text: 'text-sm' },
    md: { iconSize: 16, iconBox: 'w-7 h-7 rounded-lg', text: 'text-base' },
    lg: { iconSize: 20, iconBox: 'w-9 h-9 rounded-xl', text: 'text-xl' },
    xl: { iconSize: 24, iconBox: 'w-11 h-11 rounded-2xl', text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <div className={`flex items-center justify-center bg-accent text-white shadow-soft ${s.iconBox}`}>
        <Mail size={s.iconSize} strokeWidth={2.2} />
      </div>
      <span className={`font-heading font-bold tracking-tight text-text-primary ${s.text}`}>
        broo<span className="text-accent">.email</span>
      </span>
    </div>
  );
}
