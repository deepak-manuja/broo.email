export default function Logo({ size = 'md' }) {
  const s = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size] || 'text-base';

  return (
    <span className={`font-mono font-medium tracking-tight text-text-primary select-none ${s}`}>
      broo<span className="text-pop">.email</span>
    </span>
  );
}
