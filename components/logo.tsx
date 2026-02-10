import React from 'react';

export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512" 
      className={className}
    >
      <rect width="512" height="512" fill="#0F1C2E" />
      <rect x="40" y="40" width="432" height="432" fill="none" stroke="#B89B5E" strokeWidth="8" />
      <text 
        x="50%" 
        y="55%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        className="font-logo"
        fontSize="280" 
        fill="#B89B5E"
        style={{ fontFamily: '"Gwen Morgan", "Playfair Display", serif' }}
      >
        ER
      </text>
    </svg>
  );
}
