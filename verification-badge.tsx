interface VerificationBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function VerificationBadge({ className = "", size = "md" }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size]} ${className}`}
      title="Doğrulanmış Hesap"
      style={{ 
        backgroundColor: "#E30A17",
        boxShadow: "0 2px 8px rgba(227, 10, 23, 0.4)",
      }}
    >
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
      >
        {/* Hilal - Ortalanmış */}
        <g transform="translate(80, 100)">
          {/* Dış daire */}
          <circle cx="0" cy="0" r="42" fill="white" />
          {/* İç daire - hilal için */}
          <circle cx="8" cy="0" r="34" fill="#E30A17" />
        </g>
        
        {/* Beş Köşeli Yıldız - Ortalanmış */}
        <g transform="translate(130, 100)">
          <polygon
            points="0,-28 8.3,-8.7 28.8,-8.7 11.9,5.3 20,24.6 0,10.6 -20,24.6 -11.9,5.3 -28.8,-8.7 -8.3,-8.7"
            fill="white"
          />
        </g>
      </svg>
    </span>
  );
}
