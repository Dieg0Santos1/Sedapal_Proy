interface SedapalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SedapalLogo({ className = '', size = 'md' }: SedapalLogoProps) {
  const heights = { sm: 'h-8', md: 'h-12', lg: 'h-24' };
  return (
    <div className={`${heights[size]} flex items-center ${className}`}>
      <img src="/assets/Logo_Sedapal.png" alt="SEDAPAL" className="h-full w-auto object-contain" />
    </div>
  );
}
