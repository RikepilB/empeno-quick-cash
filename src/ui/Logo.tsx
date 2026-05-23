interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return <img src="/logo.svg" alt="EMPEÑALO" width={size} height={size} className={className} />;
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-lg font-bold tracking-wider ${className}`}>EMPEÑALO</span>
  );
}
