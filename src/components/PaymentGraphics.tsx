import React from 'react';
import { PaymentGatewayId } from '../types/store';

/**
 * Generates a deterministic, crisp 21x21 QR-style SVG matrix from any payment payload string
 * (such as NayaPay 03419347950, Easypaisa 03419347950, Binance Pay 764552613, or GoPayFast Raast).
 */
export const DynamicPaymentQR: React.FC<{
  payload: string;
  accentColor?: string;
  centerBadgeText?: string;
  size?: number;
}> = ({ payload, accentColor = '#1C1916', centerBadgeText = 'PAY', size = 164 }) => {
  const gridSize = 21;

  // Deterministic hash function from payload
  const hashBit = (row: number, col: number): boolean => {
    let h = 2166136261;
    const str = `${payload}:${row}:${col}`;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 2 === 0;
  };

  const isFinderPattern = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= gridSize - 7;
    const inBottomLeft = r >= gridSize - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const isFinderDark = (r: number, c: number) => {
    const localR = r >= gridSize - 7 ? r - (gridSize - 7) : r;
    const localC = c >= gridSize - 7 ? c - (gridSize - 7) : c;
    if (localR === 0 || localR === 6 || localC === 0 || localC === 6) return true;
    if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) return true;
    return false;
  };

  const isCenterLogoZone = (r: number, c: number) => {
    return r >= 8 && r <= 12 && c >= 8 && c <= 12;
  };

  const cells: React.ReactNode[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isCenterLogoZone(r, c)) continue;

      let dark = false;
      if (isFinderPattern(r, c)) {
        dark = isFinderDark(r, c);
      } else if (r === 6 || c === 6) {
        dark = (r + c) % 2 === 0;
      } else {
        dark = hashBit(r, c);
      }

      if (dark) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c + 2}
            y={r + 2}
            width={0.92}
            height={0.92}
            rx={0.18}
            fill={accentColor}
          />
        );
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-center p-2.5 bg-[#FAF7F2] border border-[#1C1916] shadow-[3px_3px_0px_#1C1916]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${gridSize + 4} ${gridSize + 4}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`Payment QR code for ${payload}`}
      >
        <rect width={gridSize + 4} height={gridSize + 4} fill="#FAF7F2" />
        {cells}
        {/* Center emblem */}
        <rect
          x={9.5}
          y={9.5}
          width={6}
          height={6}
          rx={0.9}
          fill="#FAF7F2"
          stroke={accentColor}
          strokeWidth={0.45}
        />
        <text
          x={12.5}
          y={13.1}
          textAnchor="middle"
          fill={accentColor}
          fontSize="1.85"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
        >
          {centerBadgeText}
        </text>
      </svg>
    </div>
  );
};

export const GatewayEmblem: React.FC<{ gateway: PaymentGatewayId; className?: string }> = ({
  gateway,
  className = 'h-7',
}) => {
  switch (gateway) {
    case 'gopayfast':
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-[#0B4F6C] text-[#FAF7F2] font-mono text-xs font-bold tracking-tighter border border-[#1C1916]">
            GPF
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-mono font-bold text-xs tracking-tight text-[#0B4F6C]">
              GoPayFast<span className="text-[#B84A27]">.com</span>
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#575047]">
              SBP Licensed • Raast & Cards
            </span>
          </div>
        </div>
      );

    case 'nayapay':
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-[#E85D04] text-white font-mono text-xs font-bold border border-[#1C1916]">
            NP
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-bold text-xs tracking-tight text-[#1C1916]">
              Naya<span className="text-[#E85D04]">Pay</span>
            </span>
            <span className="text-[9px] font-mono text-[#575047]">03419347950 • Jamal Ahmad</span>
          </div>
        </div>
      );

    case 'easypaisa':
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-[#1E7E34] text-white font-mono text-xs font-bold border border-[#1C1916]">
            ep
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-sans font-bold text-xs tracking-tight text-[#1E7E34]">
              easypaisa
            </span>
            <span className="text-[9px] font-mono text-[#575047]">03419347950 • Jamal Ahmad</span>
          </div>
        </div>
      );

    case 'binance':
      return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-sm bg-[#181A20] text-[#F0B90B] font-mono text-xs font-bold border border-[#1C1916]">
            ❖
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-mono font-bold text-xs tracking-tight text-[#1C1916]">
              BINANCE <span className="text-[#B38600]">PAY</span>
            </span>
            <span className="text-[9px] font-mono text-[#575047]">Pay ID: 764552613</span>
          </div>
        </div>
      );
  }
};

export const ArtisanWaxSeal: React.FC<{ className?: string }> = ({ className = 'w-28 h-28' }) => (
  <svg
    viewBox="0 0 140 140"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <path
        id="sealCirclePath"
        d="M 70, 70 m -48, 0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
      />
    </defs>
    <circle
      cx="70"
      cy="70"
      r="64"
      fill="#FAF7F2"
      stroke="#B84A27"
      strokeWidth="1.5"
      strokeDasharray="4 3"
    />
    <circle cx="70" cy="70" r="58" fill="none" stroke="#1C1916" strokeWidth="1" />
    <circle cx="70" cy="70" r="36" fill="none" stroke="#B84A27" strokeWidth="1" />
    <text
      fill="#1C1916"
      fontSize="8.3"
      fontFamily="JetBrains Mono, monospace"
      fontWeight="600"
      letterSpacing="2.1"
    >
      <textPath href="#sealCirclePath" startOffset="2%">
        • KĀRGHAR GUILD • HANDMADE IN PAKISTAN
      </textPath>
    </text>
    <text
      x="70"
      y="66"
      textAnchor="middle"
      fill="#B84A27"
      fontFamily="Fraunces, Georgia, serif"
      fontSize="14"
      fontWeight="700"
    >
      کارگھر
    </text>
    <text
      x="70"
      y="80"
      textAnchor="middle"
      fill="#1C1916"
      fontFamily="JetBrains Mono, monospace"
      fontSize="7.5"
      fontWeight="600"
      letterSpacing="1"
    >
      EST. MMXXVI
    </text>
  </svg>
);

export const HandDrawnUnderline: React.FC<{ className?: string }> = ({
  className = 'w-44 text-[#B84A27]',
}) => (
  <svg
    viewBox="0 0 220 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M3 9.5C52.5 3.2 134.2 2.1 217 7.8"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M24 12C82 8.2 151 7.9 201 10.5"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeOpacity="0.65"
    />
  </svg>
);
