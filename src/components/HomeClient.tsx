// src/components/HomeClient.tsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import CafeList from "@/components/CafeList";
import type { Cafe } from "../types/cafe";
import { 
  Search, 
  X, 
  Filter, 
  ChevronRight,
  Award,
  Trophy,
  Users,
  Clock,
  Zap,
  Sparkles,
  Gamepad2,
  Monitor,
  CircleDollarSign,
  Car,
  Telescope,
  Target,
  Frown,
  Check,
  TrendingUp,
  TrendingDown
} from "lucide-react";

type Props = {
  cafes: Cafe[];
};

type SortKey = "relevance" | "price_asc" | "price_desc";

export default function HomeClient({ cafes }: Props) {
  const safeCafes: Cafe[] = Array.isArray(cafes) ? cafes : [];

  const [query, setQuery] = useState("");
  const [onlyPs5, setOnlyPs5] = useState(false);
  const [onlyPc, setOnlyPc] = useState(false);
  const [onlyPool, setOnlyPool] = useState(false);
  const [onlyWheel, setOnlyWheel] = useState(false);
  const [onlyVr, setOnlyVr] = useState(false);
  const [onlySnooker, setOnlySnooker] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when filter sheet is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  // Feature highlight timeout
  useEffect(() => {
    if (activeFeature) {
      const timer = setTimeout(() => {
        setActiveFeature(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [activeFeature]);

  const handleScrollToList = () => {
    if (!listRef.current) return;
    listRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleComingSoon = (feature: string) => {
    setActiveFeature(feature);
  };

  const filteredCafes = useMemo(() => {
    let list = [...safeCafes];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        [c.name, c.address, c.city].some((field) =>
          field?.toLowerCase().includes(q)
        )
      );
    }

    if (onlyPs5) list = list.filter((c) => (c.ps5_count ?? 0) > 0);
    if (onlyPc) list = list.filter((c) => (c.pc_count ?? 0) > 0);
    if (onlyPool) list = list.filter((c) => (c.pool_count ?? 0) > 0);
    if (onlyWheel)
      list = list.filter((c) => ((c as any).steering_wheel_count ?? 0) > 0);
    if (onlyVr) list = list.filter((c) => ((c as any).vr_count ?? 0) > 0);
    if (onlySnooker)
      list = list.filter((c) => ((c as any).snooker_count ?? 0) > 0);

    if (sortBy === "price_asc") {
      list.sort(
        (a, b) =>
          (a.hourly_price ?? Number.POSITIVE_INFINITY) -
          (b.hourly_price ?? Number.POSITIVE_INFINITY)
      );
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => (b.hourly_price ?? 0) - (a.hourly_price ?? 0));
    }

    return list;
  }, [
    safeCafes,
    query,
    onlyPs5,
    onlyPc,
    onlyPool,
    onlyWheel,
    onlyVr,
    onlySnooker,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (onlyPs5) n++;
    if (onlyPc) n++;
    if (onlyPool) n++;
    if (onlyWheel) n++;
    if (onlyVr) n++;
    if (onlySnooker) n++;
    return n;
  }, [onlyPs5, onlyPc, onlyPool, onlyWheel, onlyVr, onlySnooker]);

  const clearAllFilters = () => {
    setOnlyPs5(false);
    setOnlyPc(false);
    setOnlyPool(false);
    setOnlyWheel(false);
    setOnlyVr(false);
    setOnlySnooker(false);
    setQuery("");
    setSortBy("relevance");
  };

  const filterButtons = [
    { 
      key: "ps5", 
      label: "PS5", 
      icon: <Gamepad2 className="w-4 h-4" />, 
      active: onlyPs5, 
      toggle: () => setOnlyPs5((v) => !v) 
    },
    { 
      key: "pc", 
      label: "PC", 
      icon: <Monitor className="w-4 h-4" />, 
      active: onlyPc, 
      toggle: () => setOnlyPc((v) => !v) 
    },
    { 
      key: "pool", 
      label: "Pool", 
      icon: <CircleDollarSign className="w-4 h-4" />, 
      active: onlyPool, 
      toggle: () => setOnlyPool((v) => !v) 
    },
    { 
      key: "wheel", 
      label: "Racing", 
      icon: <Car className="w-4 h-4" />, 
      active: onlyWheel, 
      toggle: () => setOnlyWheel((v) => !v) 
    },
    { 
      key: "vr", 
      label: "VR", 
      icon: <Telescope className="w-4 h-4" />, 
      active: onlyVr, 
      toggle: () => setOnlyVr((v) => !v) 
    },
    { 
      key: "snooker", 
      label: "Snooker", 
      icon: <Target className="w-4 h-4" />, 
      active: onlySnooker, 
      toggle: () => setOnlySnooker((v) => !v) 
    },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --neon-red: #ff073a;
          --neon-red-dim: #cc0530;
          --neon-cyan: #00f0ff;
          --dark-bg: #08080c;
          --card-bg: #101016;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Cyber Grid Background - Reference code se */
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Circuit Pattern - Reference code se */
        .circuit-pattern {
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(255, 7, 58, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 240, 255, 0.1) 0%, transparent 50%);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 7, 58, 0.3),
                        inset 0 0 10px rgba(255, 7, 58, 0.1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 7, 58, 0.5),
                        inset 0 0 20px rgba(255, 7, 58, 0.2);
          }
        }

        @keyframes featureHighlight {
          0% { 
            opacity: 0; 
            transform: scale(0.8) translateY(20px); 
          }
          20% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
          80% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
          100% { 
            opacity: 0; 
            transform: scale(0.9) translateY(-10px); 
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .animate-feature-highlight {
          animation: featureHighlight 1.5s ease-out forwards;
        }

        .glow-red {
          text-shadow: 0 0 8px rgba(255, 7, 58, 0.45),
                       0 0 14px rgba(255, 7, 58, 0.25);
        }

        .glow-cyan {
          text-shadow: 0 0 20px rgba(0, 240, 255, 0.7),
                       0 0 40px rgba(0, 240, 255, 0.4);
        }

        /* Main Background - Reference code jaise */
        .bg-main {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .bg-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          background: var(--dark-bg);
        }

        .bg-main::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            rgba(8, 8, 12, 0) 0%,
            rgba(8, 8, 12, 0.3) 20%,
            rgba(8, 8, 12, 0.6) 40%,
            rgba(8, 8, 12, 0.8) 60%,
            rgba(8, 8, 12, 0.9) 80%,
            rgba(8, 8, 12, 1) 100%
          );
          z-index: 1;
        }

        @media (max-width: 768px) {
          .bg-main::before {
            background-attachment: scroll;
          }
        }

        .card-glass {
          background: rgba(16, 16, 22, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .btn-glow {
          background: linear-gradient(135deg, var(--neon-red) 0%, var(--neon-red-dim) 100%);
          box-shadow: 
            0 4px 20px rgba(255, 7, 58, 0.3),
            0 1px 0 rgba(255, 255, 255, 0.1) inset;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-glow::before {
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

        .btn-glow:hover::before {
          left: 100%;
        }

        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 30px rgba(255, 7, 58, 0.5),
            0 1px 0 rgba(255, 255, 255, 0.1) inset;
        }

        .btn-glow:active {
          transform: translateY(0);
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }

        .btn-ghost:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .btn-ghost:active {
          background: rgba(255, 255, 255, 0.12);
        }

        .chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.2s ease;
        }

        .chip:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .chip-active {
          background: linear-gradient(135deg, var(--neon-red) 0%, var(--neon-red-dim) 100%);
          border-color: transparent;
          box-shadow: 
            0 4px 20px rgba(255, 7, 58, 0.3),
            0 0 20px rgba(255, 7, 58, 0.2);
        }

        .input-field {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }

        .input-field:focus-within {
          border-color: var(--neon-cyan);
          box-shadow: 
            0 0 0 3px rgba(0, 240, 255, 0.1),
            inset 0 0 20px rgba(0, 240, 255, 0.05);
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .safe-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 24px);
        }

        /* Mobile adjustments: compact filter card, visible search border, smaller sort buttons */
        @media (max-width: 768px) {
          .filters-compact {
            padding: 10px 12px !important;
            border-radius: 12px !important;
            gap: 2px !important;
          }

          .input-field {
            border: 1px solid rgba(255,255,255,0.16) !important;
            padding: 8px 10px !important;
            padding-left: 36px !important;
            padding-right: 36px !important;
            font-size: 15px !important;
            height: 40px !important;
          }

          /* Center only the placeholder text on small screens so icon doesn't overlap it visually */
          .input-field::placeholder,
          .input-field::-webkit-input-placeholder,
          .input-field:-ms-input-placeholder {
            text-align: center;
            opacity: 0.9;
          }

          /* Keep typed text left-aligned */
          .input-field {
            text-align: left;
          }

          /* Position of the left search icon can be adjusted independently */
          .search-icon-mobile {
            left: 10px;
          }

          .compact-sort-btn {
            padding: 5px 8px !important;
            font-size: 12px !important;
            border-radius: 8px !important;
            height: 32px !important;
          }

          /* Tighten spacing in filter section */
          .filters-compact .space-y-6 {
            gap: 10px !important;
          }

          /* Reduce heading text size on mobile */
          .filters-compact h2 {
            font-size: 16px !important;
          }
        }

        .overlay-bg {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .stat-card {
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 0.1) 0%,
            rgba(0, 240, 255, 0.1) 100%);
          border: 1px solid rgba(255, 7, 58, 0.2);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 0.1) 0%,
            transparent 50%,
            rgba(0, 240, 255, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .tournament-pattern {
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255, 7, 58, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(0, 240, 255, 0.1) 0%, transparent 50%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, 0.02) 2px,
              rgba(255, 255, 255, 0.02) 4px
            );
        }

        .esports-pattern {
          background: 
            linear-gradient(45deg, transparent 48%, rgba(255, 7, 58, 0.1) 50%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(0, 240, 255, 0.1) 50%, transparent 52%);
          background-size: 40px 40px;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }
      `}</style>

      <main className="min-h-screen bg-main text-white relative">
        {/* Active Feature Notification */}
        {activeFeature && (
          <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="animate-feature-highlight bg-gradient-to-r from-[#ff073a] to-[#00f0ff] text-black px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {activeFeature} Coming Soon!
              </span>
            </div>
          </div>
        )}

        {/* Background Patterns - Reference code jaise */}
        <div className="absolute inset-0 z-0">
          {/* Dark Overlay - Reference code se */}
          <div className="absolute inset-0 bg-slate-950/80 z-10" />
          
          {/* Cyber Grid Pattern - Reference code se */}
          <div className="absolute inset-0 cyber-grid z-[11] opacity-50" />
          
          {/* Circuit Pattern - Reference code se */}
          <div className="absolute inset-0 circuit-pattern z-[12] opacity-60" />
          
          {/* Tournament Pattern - Aapke original se */}
          <div className="absolute inset-0 tournament-pattern z-[13]" />
        </div>

        {/* Gaming Tournament decorative bubbles removed per request */}

        {/* Tournament Circuit Lines - Aapke original se */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff073a] to-transparent opacity-30"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-30"></div>
          <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff073a] to-transparent opacity-30"></div>
        </div>

        {/* Tournament Stage Effect - Aapke original se */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#08080c] via-transparent to-transparent z-20"></div>

        <div className="hero-content">
          <div className="mx-auto max-w-7xl px-4 pb-20 lg:px-8 relative z-30">
            
            {/* ===== HERO SECTION ===== */}
            <section className={`pt-12 lg:pt-16 mb-10 lg:mb-16 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <div className="text-center relative">
                {/* Main Title with Tournament Theme */}
                <div className="relative inline-block mb-4">
                  {/* Tournament Spotlight Effect */}
                  <div className="absolute -inset-6 bg-gradient-to-r from-[#ff073a] via-[#00f0ff] to-[#ff073a] blur-3xl opacity-15 rounded-full"></div>
                  
                  {/* Championship Badge - YAHI CHANGE KIYA HAI */}
                  {/* Mobile pe hidden, tablet aur desktop pe visible */}
                  <div className="hidden md:flex absolute -top-8 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#ff073a] to-[#ff3366] shadow-lg">
                      <Trophy className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold uppercase tracking-widest">Gaming Café Booking</span>
                    </div>
                  </div>

                  <h1 
                    className="relative text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#910320] via-white to-[#ffffff] glow-red">
                      BOOK
                    </span>
                    <span className="text-white">MY</span>
                    <span className="text-white">GAME</span>
                  </h1>
                  
                  {/* Tournament Subtitle */}
                  <div className="mt-4 relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff073a] to-[#00f0ff] blur opacity-20 rounded-lg"></div>
                    <p className="relative text-lg md:text-xl text-zinc-300 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm">
                      Reserve your gaming seat instantly at top esports cafes!
                    </p>
                  </div>
                </div>
                               

                {/* Tournament Stats Grid - Mobile pe hidden, tablet aur desktop pe visible */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
                  <div className="stat-card rounded-2xl p-4 text-center border border-[#ff073a]/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-[#ff073a]" />
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                      >
                        {safeCafes.length}+
                      </div>
                    </div>
                    <div 
                      className="text-xs text-zinc-300 uppercase tracking-wider"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Cafes
                    </div>
                  </div>
                  
                  <div className="stat-card rounded-2xl p-4 text-center border border-[#00f0ff]/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-[#00f0ff]" />
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                      >
                        24/7
                      </div>
                    </div>
                    <div 
                      className="text-xs text-zinc-300 uppercase tracking-wider"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Open
                    </div>
                  </div>
                  
                  <div className="stat-card rounded-2xl p-4 text-center border border-[#ff073a]/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-[#ff073a]" />
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                      >
                        50K+
                      </div>
                    </div>
                    <div 
                      className="text-xs text-zinc-300 uppercase tracking-wider"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Gamers
                    </div>
                  </div>
                  
                  <div className="stat-card rounded-2xl p-4 text-center border border-[#00f0ff]/30">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-[#00f0ff]" />
                      <div 
                        className="text-2xl md:text-3xl font-bold text-white"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                      >
                        10+
                      </div>
                    </div>
                    <div 
                      className="text-xs text-zinc-300 uppercase tracking-wider"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Achivment
                    </div>
                  </div>
                </div>

                {/* Tournament CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                  <button
                    onClick={handleScrollToList}
                    className="btn-glow px-8 py-4 rounded-2xl text-lg font-bold tracking-wide uppercase flex items-center gap-3 group animate-float relative overflow-hidden"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {/* Tournament Sparkle Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#ff073a] to-[#00f0ff] opacity-20 blur"></div>
                    <Zap className="w-5 h-5 group-hover:scale-125 transition-transform relative z-10" />
                    <span className="relative z-10">Book Now</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleComingSoon("Tournaments")}
                      className="btn-ghost px-6 py-4 rounded-2xl text-base font-semibold flex items-center gap-2 group relative overflow-hidden"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ff073a]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Trophy className="w-5 h-5 text-zinc-400 group-hover:text-[#ff073a] transition-colors relative z-10" />
                      <span className="relative z-10">Membership</span>
                    </button>
                    <button
                      onClick={() => handleComingSoon("Streaming")}
                      className="btn-ghost px-6 py-4 rounded-2xl text-base font-semibold flex items-center gap-2 group relative overflow-hidden"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Award className="w-5 h-5 text-zinc-400 group-hover:text-[#00f0ff] transition-colors relative z-10" />
                      <span className="relative z-10">Tournaments</span>
                    </button>
                  </div>
                </div>

                
              </div>
            </section>

            {/* ===== SEARCH & FILTERS ===== */}
            <section 
              ref={listRef}
              className={`sticky top-20 z-30 mb-8 lg:mb-12 bg-[#08080c]/95 backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-2xl filters-compact ${
                mounted ? 'animate-fade-in' : 'opacity-0'
              }`}
              style={{ animationDelay: '0.1s' }}
            >
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none search-icon-mobile">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Cafes, gaming arenas, or equipment..."
                  className="input-field w-full pl-12 pr-12 py-4 rounded-2xl text-lg placeholder:text-zinc-600 focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                {query && (
                  <button 
                    onClick={() => setQuery("")}
                    className="absolute inset-y-0 right-4 flex items-center p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                )}
              </div>

              {/* Filters Section */}
              <div className="space-y-6">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-[#ff073a]" />
                    <h2 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      Find Your Cafes
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="md:hidden relative p-3 rounded-xl btn-ghost"
                    >
                      <Filter className="w-5 h-5" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff073a] text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium appearance-none cursor-pointer"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <option value="relevance">Tournament Ready</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                    
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm font-medium text-[#ff073a] hover:text-[#ff073a]/80 transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {filterButtons.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={filter.toggle}
                      className={`flex items-center justify-center gap-3 p-4 rounded-xl transition-all ${
                        filter.active 
                          ? 'chip-active text-white' 
                          : 'chip text-zinc-400 hover:text-white'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      <div className={`p-2 rounded-lg ${
                        filter.active 
                          ? 'bg-white/20' 
                          : 'bg-white/5'
                      }`}>
                        {filter.icon}
                      </div>
                      <span className="font-semibold">{filter.label}</span>
                      {filter.active && (
                        <Check className="w-4 h-4 ml-2" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Sort Options (Mobile) */}
                <div className="md:hidden flex gap-2 overflow-x-auto hide-scrollbar py-2">
                  <button
                    onClick={() => setSortBy("relevance")}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all compact-sort-btn ${
                      sortBy === "relevance" 
                        ? 'bg-[#ff073a] text-white' 
                        : 'bg-white/5 text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Tournament
                  </button>
                  <button
                    onClick={() => setSortBy("price_asc")}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all compact-sort-btn ${
                      sortBy === "price_asc" 
                        ? 'bg-[#00f0ff] text-black' 
                        : 'bg-white/5 text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Price Low
                  </button>
                  <button
                    onClick={() => setSortBy("price_desc")}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all compact-sort-btn ${
                      sortBy === "price_desc" 
                        ? 'bg-[#00f0ff] text-black' 
                        : 'bg-white/5 text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Price High
                  </button>
                </div>
              </div>
            </section>

            {/* ===== RESULTS SECTION ===== */}
            <section 
              className={`${mounted ? 'animate-fade-in' : 'opacity-0'}`}
              style={{ animationDelay: '0.15s' }}
            >
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {query || activeFiltersCount > 0 ? 'Filtered Cafes' : 'All Gaming Cafes'}
                  </h2>
                  <p 
                    className="text-zinc-400"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {filteredCafes.length} professional venue{filteredCafes.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Café List or Empty State */}
              {filteredCafes.length > 0 ? (
                <CafeList cafes={filteredCafes} />
              ) : (
                <div className="card-glass rounded-3xl p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ff073a]/10 to-[#00f0ff]/10 flex items-center justify-center">
                    <Frown className="w-12 h-12 text-zinc-600" />
                  </div>
                  <h3 
                    className="text-2xl font-bold text-white mb-3"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    No Tournament Venues Found
                  </h3>
                  <p 
                    className="text-zinc-400 mb-8 max-w-md mx-auto"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    We couldn't find any tournament-ready venues matching your criteria. Try adjusting your filters or search terms.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={clearAllFilters}
                      className="btn-glow px-8 py-3 rounded-xl font-bold"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => setQuery("")}
                      className="btn-ghost px-8 py-3 rounded-xl font-semibold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Reset Search
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ===== MOBILE FILTER SHEET ===== */}
        {showFilters && (
          <div 
            className="fixed inset-0 z-50"
            onClick={() => setShowFilters(false)}
          >
            {/* Overlay */}
            <div className="overlay-bg absolute inset-0 animate-fade-in" style={{ animationDuration: '0.2s' }} />
            
            {/* Sheet */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-[#101016] rounded-t-[32px] border-t border-white/10 animate-slide-up safe-bottom shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    Tournament Filters
                  </h3>
                  <p 
                    className="text-sm text-zinc-400"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                  </p>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Equipment Filters */}
                <div className="mb-6">
                  <h4 
                    className="text-sm font-semibold text-zinc-300 mb-3"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    TOURNAMENT EQUIPMENT
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {filterButtons.map((filter) => (
                      <button
                        key={filter.key}
                        onClick={filter.toggle}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          filter.active 
                            ? 'bg-gradient-to-r from-[#ff073a] to-[#ff073a]/80 text-white' 
                            : 'bg-white/5 text-zinc-400 border border-white/10'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <div className={`p-2 rounded-lg ${
                          filter.active 
                            ? 'bg-white/20' 
                            : 'bg-white/5'
                        }`}>
                          {filter.icon}
                        </div>
                        <span className="font-semibold">{filter.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="pt-4 border-t border-white/10">
                  <h4 
                    className="text-sm font-semibold text-zinc-300 mb-3"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    SORT BY
                  </h4>
                  <div className="space-y-2">
                    {[
                      { value: 'relevance', label: 'Tournament Ready', icon: <Trophy className="w-4 h-4" /> },
                      { value: 'price_asc', label: 'Price: Low to High', icon: <TrendingUp className="w-4 h-4" /> },
                      { value: 'price_desc', label: 'Price: High to Low', icon: <TrendingDown className="w-4 h-4" /> },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as SortKey)}
                        className={`flex items-center justify-between w-full p-4 rounded-xl transition-all ${
                          sortBy === option.value
                            ? 'bg-gradient-to-r from-[#00f0ff] to-[#00f0ff]/80 text-black'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        <div className="flex items-center gap-3">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                        {sortBy === option.value && (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                <button
                  onClick={() => {
                    clearAllFilters();
                    setShowFilters(false);
                  }}
                  className="flex-1 py-4 rounded-xl text-base font-semibold bg-white/5 hover:bg-white/10 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Reset All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-[2] py-4 rounded-xl text-base font-bold btn-glow"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Show {filteredCafes.length} Venues
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}