interface SedapalLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SedapalLogo({ className = '', size = 'md' }: SedapalLogoProps) {
  const heights = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-24'
  };

  return (
    <div className={`${heights[size]} flex items-center ${className}`}>
      <svg viewBox="0 0 300 100" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Texto SEDAPAL */}
        <text x="10" y="55" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="bold" fill="#0369A1">
          sedapal
        </text>
        
        {/* Olas decorativas */}
        <path d="M 10 70 Q 30 65, 50 70 T 90 70" stroke="#06B6D4" strokeWidth="3" fill="none" />
        <path d="M 10 78 Q 30 73, 50 78 T 90 78" stroke="#0EA5E9" strokeWidth="3" fill="none" />
        <path d="M 10 86 Q 30 81, 50 86 T 90 86" stroke="#7DD3FC" strokeWidth="2" fill="none" />
        
        <path d="M 120 70 Q 140 65, 160 70 T 200 70" stroke="#06B6D4" strokeWidth="3" fill="none" />
        <path d="M 120 78 Q 140 73, 160 78 T 200 78" stroke="#0EA5E9" strokeWidth="3" fill="none" />
        <path d="M 120 86 Q 140 81, 160 86 T 200 86" stroke="#7DD3FC" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
