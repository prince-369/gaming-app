// src/components/CafeList.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Cafe } from "@/types/cafe";
import {
  MapPin,
  Star,
  Clock,
  Gamepad2,
  Monitor,
  DollarSign,
  Car,
  Telescope,
  Target,
  MonitorPlay,
  Zap,
  ChevronRight,
  Award,
  Sparkles,
  Users,
  Crown,
  Coffee,
  Wifi,
  Music,
  Shield,
  CheckCircle
} from "lucide-react";

type Props = {
  cafes: Cafe[];
};

export default function CafeList({ cafes }: Props) {
  if (!cafes || cafes.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <>
      <style jsx global>{`
        .cafe-card {
          background: linear-gradient(
            145deg,
            rgba(16, 16, 22, 0.9) 0%,
            rgba(10, 10, 15, 0.9) 100%
          );
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cafe-card:hover {
          border-color: rgba(255, 7, 58, 0.4);
          transform: translateY(-8px);
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 7, 58, 0.2),
            0 0 60px rgba(255, 7, 58, 0.1);
        }

        .cafe-card:active {
          transform: translateY(-4px);
        }

        .image-shimmer {
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 7, 58, 0.3),
                        inset 0 0 10px rgba(255, 7, 58, 0.1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 7, 58, 0.5),
                        inset 0 0 20px rgba(255, 7, 58, 0.2);
          }
        }

        .badge-open {
          background: linear-gradient(135deg, 
            rgba(34, 197, 94, 0.2) 0%,
            rgba(34, 197, 94, 0.1) 100%);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
        }

        .badge-closed {
          background: linear-gradient(135deg, 
            rgba(239, 68, 68, 0.2) 0%,
            rgba(239, 68, 68, 0.1) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }

        .badge-inactive {
          background: linear-gradient(135deg, 
            rgba(251, 191, 36, 0.2) 0%,
            rgba(251, 191, 36, 0.1) 100%);
          border: 1px solid rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }

        .console-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }

        .console-chip:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 7, 58, 0.4);
          transform: translateY(-2px);
        }

        .price-tag {
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 0.2) 0%,
            rgba(255, 7, 58, 0.1) 100%);
          border: 1px solid rgba(255, 7, 58, 0.3);
          position: relative;
          overflow: hidden;
        }

        .price-tag::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .price-tag:hover::before {
          opacity: 1;
        }

        .book-btn {
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 1) 0%, 
            rgba(204, 5, 48, 1) 100%);
          box-shadow: 
            0 8px 32px rgba(255, 7, 58, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .book-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: 0.5s;
        }

        .book-btn:hover::before {
          left: 100%;
        }

        .book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(255, 7, 58, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .rating-star {
          filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.6));
        }

        .premium-badge {
          background: linear-gradient(135deg, 
            rgba(255, 215, 0, 0.2) 0%,
            rgba(255, 215, 0, 0.1) 100%);
          border: 1px solid rgba(255, 215, 0, 0.3);
          color: #ffd700;
        }

        .feature-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }

        .feature-chip:hover {
          background: rgba(255, 7, 58, 0.1);
          border-color: rgba(255, 7, 58, 0.3);
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {cafes.map((cafe, index) => (
          <Link
            key={cafe.id}
            href={`/cafes/${cafe.slug || cafe.id}`}
            className="cafe-card rounded-3xl overflow-hidden group relative"
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {/* Premium Crown Badge */}
            {(cafe as any).is_premium && (
              <div className="absolute top-4 right-4 z-20 premium-badge px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Crown className="w-3.5 h-3.5" />
                <span className="text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  PREMIUM
                </span>
              </div>
            )}

            {/* Image Section */}
            <div className="relative h-64 lg:h-72 overflow-hidden">
              {cafe.cover_url ? (
                <>
                  <Image
                    src={cafe.cover_url}
                    alt={cafe.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    loading={index === 0 ? "eager" : "lazy"}
                    priority={index === 0}
                    quality={index === 0 ? 90 : index < 3 ? 80 : 70}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ff073a]/10 via-transparent to-[#00f0ff]/10 opacity-30" />
                  
                  {/* Top Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <OpeningBadge
                      openingHours={cafe.opening_hours}
                      isActive={cafe.is_active !== false}
                    />
                    
                    {(cafe as any).is_verified && (
                      <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
                        <span className="text-xs font-medium text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 
                          className="text-xl font-bold text-white mb-1"
                          style={{ fontFamily: 'Orbitron, sans-serif' }}
                        >
                          {cafe.name}
                        </h2>
                        <div className="flex items-center gap-1 text-zinc-300">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {cafe.city || 'Location'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Rating */}
                      {(cafe as any).rating && (
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 rating-star" />
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {(cafe as any).rating}
                            </span>
                            <span className="text-[10px] text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Rating
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Placeholder when no image
                <div className="relative h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                  <div className="relative">
                    <Gamepad2 className="w-16 h-16 text-zinc-700 opacity-50" />
                    <div className="absolute inset-0 image-shimmer" />
                  </div>
                  
                  {/* Status badge for no-image cards */}
                  <div className="absolute top-4 left-4">
                    <OpeningBadge
                      openingHours={cafe.opening_hours}
                      isActive={cafe.is_active !== false}
                    />
                  </div>
                  
                  {/* Title on placeholder */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 
                      className="text-xl font-bold text-white mb-1"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {cafe.name}
                    </h2>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {cafe.address ? `${cafe.address.substring(0, 30)}...` : 'Location not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Features Row */}
              <div className="flex flex-wrap gap-2 mb-4">
                <FeatureChip icon={<Coffee className="w-3.5 h-3.5" />} label="Café" />
                <FeatureChip icon={<Wifi className="w-3.5 h-3.5" />} label="High-Speed WiFi" />
                <FeatureChip icon={<Users className="w-3.5 h-3.5" />} label="Tournaments" />
                <FeatureChip icon={<Music className="w-3.5 h-3.5" />} label="Ambience" />
              </div>

              {/* Console Equipment Grid */}
              <ConsoleIconsRow cafe={cafe} />

              {/* Additional Info */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Distance */}
                  {(cafe as any).distance && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#00f0ff]" />
                      <span className="text-sm text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {(cafe as any).distance} km
                      </span>
                    </div>
                  )}
                  
                  {/* Popularity */}
                  {(cafe as any).popularity && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#ff073a]" />
                      <span className="text-sm text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {(cafe as any).popularity}+ playing now
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Book Row */}
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                {/* Price */}
                <div className="price-tag rounded-2xl px-5 py-3">
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="text-2xl font-bold text-white"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      ₹{cafe.hourly_price ?? 0}
                    </span>
                    <span 
                      className="text-sm text-zinc-400"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      / hour
                    </span>
                  </div>
                  <div 
                    className="text-xs text-zinc-500 mt-1"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Starting price
                  </div>
                </div>

                {/* Book Button */}
                <button 
                  className="book-btn rounded-2xl px-6 py-3.5 flex items-center gap-2 group"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle booking logic here
                    window.location.href = `/cafes/${cafe.slug || cafe.id}`;
                  }}
                >
                  <span 
                    className="text-sm font-bold text-white flex items-center gap-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                    Book Now
                  </span>
                  <ChevronRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Hover Effect Indicator */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#ff073a]/20 rounded-3xl transition-all duration-300 pointer-events-none" />
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------- Opening hours badge ---------- */

function OpeningBadge({
  openingHours,
  isActive,
}: {
  openingHours?: string | null;
  isActive: boolean;
}) {
  // If café is manually turned off
  if (!isActive) {
    return (
      <div className="badge-inactive inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
        <div className="relative">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
        </div>
        <span className="text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          Temporarily Closed
        </span>
      </div>
    );
  }

  const range = parseOpeningRange(openingHours ?? undefined);

  // If we couldn't parse times
  if (!range) {
    return (
      <div className="badge-open inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
        <CheckCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          {openingHours && openingHours.trim().length > 0
            ? openingHours.trim()
            : "Open"}
        </span>
      </div>
    );
  }

  const now = new Date();
  const isOpen = now >= range.open && now <= range.close;

  if (isOpen) {
    return (
      <div className="badge-open inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm animate-pulse-glow">
        <div className="relative">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          Open Now
        </span>
      </div>
    );
  }

  return (
    <div className="badge-closed inline-flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm">
      <Clock className="w-3.5 h-3.5" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
          Closed
        </span>
        <span className="text-[10px] opacity-80">
          Opens {range.label.split('–')[0].trim()}
        </span>
      </div>
    </div>
  );
}

/* ---------- Feature Chip ---------- */

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="feature-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
      {icon}
      <span className="text-xs font-medium text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  );
}

// Parse strings like "10:00 AM – 11:00 PM"
function parseOpeningRange(
  openingHours?: string
): { open: Date; close: Date; label: string } | null {
  if (!openingHours) return null;

  const match = openingHours.match(
    /(\d{1,2}:\d{2}\s*(AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(AM|PM))/i
  );
  if (!match) return null;

  const startStr = match[1];
  const endStr = match[3];
  const today = new Date();

  const open = parseTimeForToday(startStr, today);
  const close = parseTimeForToday(endStr, today);

  if (!open || !close) return null;

  return {
    open,
    close,
    label: `${startStr} – ${endStr}`,
  };
}

function parseTimeForToday(timeStr: string, baseDate: Date): Date | null {
  const trimmed = timeStr.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;

  const [timePart, ampmRaw] = parts;
  const [hStr, mStr] = timePart.split(":");
  const hourNum = Number(hStr);
  const minNum = Number(mStr);
  if (Number.isNaN(hourNum) || Number.isNaN(minNum)) return null;

  const ampm = ampmRaw.toUpperCase();
  let hour24 = hourNum % 12;
  if (ampm === "PM") hour24 += 12;

  const d = new Date(baseDate);
  d.setHours(hour24, minNum, 0, 0);
  return d;
}

/* ---------- Console icons row ---------- */

const CONSOLE_CONFIG: {
  key: keyof Cafe;
  icon: React.ReactNode;
  label: string;
  color: string;
}[] = [
  { 
    key: "ps5_count", 
    icon: <Gamepad2 className="w-4 h-4" />, 
    label: "PS5", 
    color: "linear-gradient(135deg, rgba(0, 112, 243, 0.2) 0%, rgba(0, 112, 243, 0.1) 100%)" 
  },
  { 
    key: "ps4_count", 
    icon: <Gamepad2 className="w-4 h-4" />, 
    label: "PS4", 
    color: "linear-gradient(135deg, rgba(0, 112, 243, 0.15) 0%, rgba(0, 112, 243, 0.08) 100%)" 
  },
  { 
    key: "xbox_count", 
    icon: <span className="text-green-400">X</span>, 
    label: "Xbox", 
    color: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)" 
  },
  { 
    key: "pc_count", 
    icon: <Monitor className="w-4 h-4" />, 
    label: "PC", 
    color: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)" 
  },
  { 
    key: "pool_count", 
    icon: <DollarSign className="w-4 h-4" />, 
    label: "Pool", 
    color: "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)" 
  },
  { 
    key: "arcade_count", 
    icon: <MonitorPlay className="w-4 h-4" />, 
    label: "Arcade", 
    color: "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.08) 100%)" 
  },
];

// Extended configs for additional equipment
const EXTENDED_CONFIG: {
  key: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}[] = [
  { 
    key: "vr_count", 
    icon: <Telescope className="w-4 h-4" />, 
    label: "VR", 
    color: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)" 
  },
  { 
    key: "steering_wheel_count", 
    icon: <Car className="w-4 h-4" />, 
    label: "Racing", 
    color: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)" 
  },
  { 
    key: "snooker_count", 
    icon: <Target className="w-4 h-4" />, 
    label: "Snooker", 
    color: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%)" 
  },
];

function ConsoleIconsRow({ cafe }: { cafe: Cafe }) {
  const allConfigs = [...CONSOLE_CONFIG, ...EXTENDED_CONFIG];
  
  const available = allConfigs.filter(
    ({ key }) => (((cafe as any)[key] as number | null) ?? 0) > 0
  );

  if (available.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-sm font-semibold text-zinc-300" style={{ fontFamily: 'Inter, sans-serif' }}>
          Available Equipment
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {available.map(({ key, icon, label, color }, idx) => {
          const count = ((cafe as any)[key] as number | null) ?? 0;
          return (
            <div
              key={key}
              className="console-chip inline-flex items-center gap-2 rounded-xl px-3 py-2 group"
              style={{ background: color }}
            >
              <div className="text-zinc-300 group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </span>
                <span className="text-[10px] text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {count} unit{count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}