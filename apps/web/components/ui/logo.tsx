export default function Logo({ size = 32, color = "#4ade80" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="sq">
          <rect x="10" y="10" width="44" height="44" rx="12" transform="rotate(45 32 32)"/>
        </clipPath>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="12" transform="rotate(45 32 32)" fill={color}/>
      <g clipPath="url(#sq)">
        <path d="M2 26 Q14 16 26 26 T50 26 T74 26" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M2 36 Q14 26 26 36 T50 36 T74 36" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" fill="none"/>
        <path d="M2 46 Q14 36 26 46 T50 46 T74 46" stroke="#0a0a0a" strokeWidth="6" strokeLinecap="round" fill="none"/>
      </g>
    </svg>
  );
}
