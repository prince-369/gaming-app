// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { 
  colors, 
  fonts, 
  CONSOLE_LABELS, 
  CONSOLE_DB_KEYS, 
  CONSOLE_COLORS, 
  OPEN_HOUR, 
  CLOSE_HOUR, 
  PEAK_START, 
  PEAK_END, 
  TIME_INTERVAL, 
  BOOKING_DURATION_MINUTES, 
  type ConsoleId 
} from "@/lib/constants";

// Lucide Icons
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gamepad2,
  Monitor,
  Car,
  Target,
  Telescope,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  MapPin,
  Instagram,
  CreditCard,
  Plus,
  Minus,
  ChevronRight,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Crown,
  DollarSign
} from "lucide-react";

// ============ TYPES ============
type DayOption = {
  key: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
};

type TimeSlot = {
  label: string;
  hour: number;
  minutes: number;
  isPeak: boolean;
};

type ConsoleOption = {
  id: ConsoleId;
  label: string;
  icon: React.ReactNode;
  color: string;
  dbKey: string;
};

type TicketOption = {
  id: string;
  console: ConsoleId;
  title: string;
  players: number;
  price: number;
  description: string;
};

type SelectedTicketForCheck = {
  console: ConsoleId;
  quantity: number;
};

type ConsoleAvailability = {
  total: number;
  booked: number;
  available: number;
  nextAvailableAt: string | null;
};

// ============ CONSTANTS ============
const CONSOLES: ConsoleOption[] = [
  { 
    id: "ps5", 
    label: CONSOLE_LABELS.ps5, 
    icon: <Gamepad2 className="w-5 h-5" />, 
    color: CONSOLE_COLORS.ps5, 
    dbKey: CONSOLE_DB_KEYS.ps5 
  },
  { 
    id: "ps4", 
    label: CONSOLE_LABELS.ps4, 
    icon: <Gamepad2 className="w-5 h-5" />, 
    color: CONSOLE_COLORS.ps4, 
    dbKey: CONSOLE_DB_KEYS.ps4 
  },
  { 
    id: "xbox", 
    label: CONSOLE_LABELS.xbox, 
    icon: <Gamepad2 className="w-5 h-5" />, 
    color: CONSOLE_COLORS.xbox, 
    dbKey: CONSOLE_DB_KEYS.xbox 
  },
  { 
    id: "pc", 
    label: CONSOLE_LABELS.pc, 
    icon: <Monitor className="w-5 h-5" />, 
    color: CONSOLE_COLORS.pc, 
    dbKey: CONSOLE_DB_KEYS.pc 
  },
  { 
    id: "pool", 
    label: CONSOLE_LABELS.pool, 
    icon: <Target className="w-5 h-5" />, 
    color: CONSOLE_COLORS.pool, 
    dbKey: CONSOLE_DB_KEYS.pool 
  },
  { 
    id: "arcade", 
    label: CONSOLE_LABELS.arcade, 
    icon: <Gamepad2 className="w-5 h-5" />, 
    color: CONSOLE_COLORS.arcade, 
    dbKey: CONSOLE_DB_KEYS.arcade 
  },
  { 
    id: "snooker", 
    label: CONSOLE_LABELS.snooker, 
    icon: <Target className="w-5 h-5" />, 
    color: CONSOLE_COLORS.snooker, 
    dbKey: CONSOLE_DB_KEYS.snooker 
  },
  { 
    id: "vr", 
    label: CONSOLE_LABELS.vr, 
    icon: <Telescope className="w-5 h-5" />, 
    color: CONSOLE_COLORS.vr, 
    dbKey: CONSOLE_DB_KEYS.vr 
  },
  { 
    id: "steering", 
    label: CONSOLE_LABELS.steering, 
    icon: <Car className="w-5 h-5" />, 
    color: CONSOLE_COLORS.steering, 
    dbKey: CONSOLE_DB_KEYS.steering 
  },
];

// ============ HELPER FUNCTIONS ============
function buildNext7Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    days.push({
      key: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNum: d.getDate().toString(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

function buildTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let minutes = 0; minutes < 60; minutes += TIME_INTERVAL) {
      const d = new Date();
      d.setHours(hour, minutes, 0, 0);
      const label = d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      slots.push({
        label,
        hour,
        minutes,
        isPeak: hour >= PEAK_START && hour < PEAK_END,
      });
    }
  }
  return slots;
}

function timeStringToMinutes(timeStr: string): number {
  const match = timeStr.toLowerCase().match(/(\d+):(\d+)\s*(am|pm)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

function doTimeSlotsOverlap(
  slot1StartMinutes: number,
  slot2StartMinutes: number,
  durationMinutes: number = BOOKING_DURATION_MINUTES
): boolean {
  const slot1End = slot1StartMinutes + durationMinutes;
  const slot2End = slot2StartMinutes + durationMinutes;
  return slot1StartMinutes < slot2End && slot2StartMinutes < slot1End;
}

function minutesToTimeString(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

function generateTickets(
  consoleId: ConsoleId,
  pricingTier: {
    qty1_30min: number | null; qty1_60min: number | null;
    qty2_30min: number | null; qty2_60min: number | null;
    qty3_30min: number | null; qty3_60min: number | null;
    qty4_30min: number | null; qty4_60min: number | null;
  } | null,
  fallbackPrice: number,
  duration: 30 | 60 | 90
): TicketOption[] {
  const consoleName = CONSOLES.find((c) => c.id === consoleId)?.label || consoleId;
  const tickets: TicketOption[] = [];

  const maxConsoles = ["pool", "snooker"].includes(consoleId)
    ? 2
    : ["pc", "vr", "steering"].includes(consoleId)
    ? 1
    : 4;

  for (let qty = 1; qty <= maxConsoles; qty++) {
    let price: number;

    if (pricingTier) {
      if (duration === 90) {
        const price60 = pricingTier[`qty${qty}_60min` as keyof typeof pricingTier] ?? (fallbackPrice * qty);
        const price30 = pricingTier[`qty${qty}_30min` as keyof typeof pricingTier] ?? (fallbackPrice * qty * 0.5);
        price = price60 + price30;
      } else {
        const qtyKey = `qty${qty}_${duration}min` as keyof typeof pricingTier;
        const tierPrice = pricingTier[qtyKey];

        if (tierPrice !== null && tierPrice !== undefined) {
          price = tierPrice;
        } else {
          price = duration === 30 ? (fallbackPrice * qty * 0.5) : (fallbackPrice * qty);
        }
      }
    } else {
      if (duration === 90) {
        price = fallbackPrice * qty * 1.5;
      } else {
        price = duration === 30 ? (fallbackPrice * qty * 0.5) : (fallbackPrice * qty);
      }
    }

    const durationText = duration === 30 ? "30 minutes" : duration === 60 ? "1 hour" : "1.5 hours";

    tickets.push({
      id: `${consoleId}_${qty}`,
      console: consoleId,
      title: `${consoleName} | ${qty} Console${qty > 1 ? "s" : ""}`,
      players: qty,
      price: price,
      description: `${qty} ${consoleName} console${qty > 1 ? "s" : ""} for ${durationText}.`,
    });
  }
  return tickets;
}

const DAY_OPTIONS = buildNext7Days();
const ALL_TIME_SLOTS = buildTimeSlots();

// ============ COMPONENT ============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();

  const rawId = params?.id;
  const cafeId = typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  // ===== STATE =====
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<string>(DAY_OPTIONS[0]?.key ?? "");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>("ps5");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [actualCafeId, setActualCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");

  type ConsolePricingTier = {
    qty1_30min: number | null;
    qty1_60min: number | null;
    qty2_30min: number | null;
    qty2_60min: number | null;
    qty3_30min: number | null;
    qty3_60min: number | null;
    qty4_30min: number | null;
    qty4_60min: number | null;
  };

  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});
  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 90>(60);
  const [consoleLimits, setConsoleLimits] = useState<Partial<Record<ConsoleId, number>>>({});
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liveAvailability, setLiveAvailability] = useState<Partial<Record<ConsoleId, ConsoleAvailability>>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== LOAD CAFE DATA =====
  useEffect(() => {
    async function loadCafeData() {
      if (!cafeId) return;

      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeId);

        const { data, error } = await supabase
          .from("cafes")
          .select(
            "id, name, slug, hourly_price, google_maps_url, instagram_url, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
          )
          .eq(isUUID ? "id" : "slug", cafeId)
          .maybeSingle();

        if (error || !data) {
          console.error("Error loading cafe:", error);
          return;
        }

        setActualCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);
        setGoogleMapsUrl(data.google_maps_url || "");
        setInstagramUrl(data.instagram_url || "");

        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const count = (data as any)[c.dbKey];
          if (count && count > 0) {
            limits[c.id] = count;
            available.push(c.id);
          }
        });

        setConsoleLimits(limits);
        setAvailableConsoles(available);

        if (available.length > 0 && !available.includes(selectedConsole)) {
          setSelectedConsole(available[0]);
        }

        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", cafeId);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          pricingData.forEach((item: any) => {
            let consoleId = item.console_type as ConsoleId;
            if (item.console_type === "steering_wheel") {
              consoleId = "steering";
            }

            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null, qty1_60min: null,
                qty2_30min: null, qty2_60min: null,
                qty3_30min: null, qty3_60min: null,
                qty4_30min: null, qty4_60min: null,
              };
            }

            const qty = item.quantity;
            const duration = item.duration_minutes;
            if (qty >= 1 && qty <= 4 && (duration === 30 || duration === 60)) {
              const qtyKey = `qty${qty}_${duration}min` as keyof ConsolePricingTier;
              pricing[consoleId]![qtyKey] = item.price;
            }
          });

          setConsolePricing(pricing);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCafeData();
  }, [cafeId, selectedConsole]);

  // FETCH LIVE AVAILABILITY
  const fetchLiveAvailability = useCallback(async () => {
    const effectiveCafeId = actualCafeId || cafeId;
    if (!effectiveCafeId || !selectedDate || !selectedTime) {
      setLiveAvailability({});
      return;
    }

    try {
      setLoadingAvailability(true);
      const selectedTimeMinutes = timeStringToMinutes(selectedTime);

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          start_time,
          booking_items (
            console,
            quantity
          )
        `
        )
        .eq("cafe_id", effectiveCafeId)
        .eq("booking_date", selectedDate)
        .neq("status", "cancelled");

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        return;
      }

      const availability: Partial<Record<ConsoleId, ConsoleAvailability>> = {};
      availableConsoles.forEach((consoleId) => {
        availability[consoleId] = {
          total: consoleLimits[consoleId] || 0,
          booked: 0,
          available: consoleLimits[consoleId] || 0,
          nextAvailableAt: null,
        };
      });

      const overlappingBookingsPerConsole: Partial<
        Record<ConsoleId, { endMinutes: number; quantity: number }[]>
      > = {};

      (bookings ?? []).forEach((booking: any) => {
        const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");
        const bookingEndMinutes = bookingStartMinutes + BOOKING_DURATION_MINUTES;

        if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, selectedDuration)) {
          (booking.booking_items ?? []).forEach((item: any) => {
            const consoleId = item.console as ConsoleId;
            if (consoleId && availability[consoleId]) {
              availability[consoleId]!.booked += item.quantity || 0;
              availability[consoleId]!.available =
                availability[consoleId]!.total - availability[consoleId]!.booked;

              if (!overlappingBookingsPerConsole[consoleId]) {
                overlappingBookingsPerConsole[consoleId] = [];
              }
              overlappingBookingsPerConsole[consoleId]!.push({
                endMinutes: bookingEndMinutes,
                quantity: item.quantity || 0,
              });
            }
          });
        }
      });

      availableConsoles.forEach((consoleId) => {
        const consoleData = availability[consoleId];
        if (!consoleData) return;

        if (consoleData.available === 0 || consoleData.available < consoleData.total) {
          const overlappingBookings = overlappingBookingsPerConsole[consoleId] || [];

          if (overlappingBookings.length > 0) {
            const sortedByEndTime = [...overlappingBookings].sort(
              (a, b) => a.endMinutes - b.endMinutes
            );
            const earliestEndMinutes = sortedByEndTime[0].endMinutes;
            availability[consoleId]!.nextAvailableAt = minutesToTimeString(earliestEndMinutes);
          }
        }
      });

      setLiveAvailability(availability);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, [actualCafeId, cafeId, selectedDate, selectedTime, availableConsoles, consoleLimits, selectedDuration]);

  useEffect(() => {
    fetchLiveAvailability();
  }, [fetchLiveAvailability]);

  useEffect(() => {
    if (step !== 2 || !selectedDate || !selectedTime) return;

    const interval = setInterval(() => {
      fetchLiveAvailability();
    }, 30000);

    return () => clearInterval(interval);
  }, [step, selectedDate, selectedTime, fetchLiveAvailability]);

  // ===== DERIVED STATE =====
  const filteredTimeSlots = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    if (selectedDate !== todayKey) {
      return ALL_TIME_SLOTS;
    }

    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();

    return ALL_TIME_SLOTS.filter((slot) => {
      if (slot.hour > currentHour) return true;
      if (slot.hour === currentHour && slot.minutes > currentMinutes + 5) return true;
      return false;
    });
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime && filteredTimeSlots.length > 0) {
      const isStillAvailable = filteredTimeSlots.some((slot) => slot.label === selectedTime);
      if (!isStillAvailable) {
        setSelectedTime("");
      }
    }
  }, [filteredTimeSlots, selectedTime]);

  const tickets = useMemo(() => {
    const pricingTier = consolePricing[selectedConsole] ?? null;
    return generateTickets(selectedConsole, pricingTier, cafePrice, selectedDuration);
  }, [selectedConsole, consolePricing, cafePrice, selectedDuration]);

  const usedPerConsole = useMemo(() => {
    const map: Partial<Record<ConsoleId, number>> = {};
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      const consoleId = ticketId.split("_")[0] as ConsoleId;
      map[consoleId] = (map[consoleId] ?? 0) + qty;
    });
    return map;
  }, [quantities]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let totalAmount = 0;

    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty <= 0) return;
      const consoleId = ticketId.split("_")[0] as ConsoleId;
      const pricingTier = consolePricing[consoleId] ?? null;
      const consoleTickets = generateTickets(consoleId, pricingTier, cafePrice, selectedDuration);
      const ticket = consoleTickets.find((t) => t.id === ticketId);
      if (ticket) {
        totalTickets += qty;
        totalAmount += qty * ticket.price;
      }
    });

    return { totalTickets, totalAmount };
  }, [quantities, consolePricing, cafePrice, selectedDuration]);

  const getRealAvailable = useCallback(
    (consoleId: ConsoleId) => {
      const liveData = liveAvailability[consoleId];
      if (!liveData) return consoleLimits[consoleId] || 0;

      const mySelection = usedPerConsole[consoleId] || 0;
      return Math.max(0, liveData.available - mySelection);
    },
    [liveAvailability, usedPerConsole, consoleLimits]
  );

  const maxForSelected =
    liveAvailability[selectedConsole]?.available ??
    consoleLimits[selectedConsole] ??
    Infinity;
  const usedForSelected = usedPerConsole[selectedConsole] ?? 0;
  const remainingForSelected = Math.max(0, maxForSelected - usedForSelected);
  const atLimit = remainingForSelected <= 0;

  const dateLabel = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(`${selectedDate}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  // ===== HANDLERS =====
  function getQty(ticketId: string) {
    return quantities[ticketId] ?? 0;
  }

  function setQty(ticketId: string, value: number) {
    const consoleId = ticketId.split("_")[0] as ConsoleId;
    const available = getRealAvailable(consoleId) + (quantities[ticketId] || 0);

    setQuantities((prev) => {
      const next = { ...prev };

      if (value <= 0) {
        delete next[ticketId];
      } else if (value <= available) {
        next[ticketId] = value;
      } else {
        next[ticketId] = available;
      }

      return next;
    });
  }

  function handleContinueToTickets() {
    if (!selectedDate || !selectedTime) return;
    setStep(2);
    setQuantities({});
  }

  function handleBackToDateTime() {
    setStep(1);
    setQuantities({});
  }

  async function handleConfirmBooking() {
    if (summary.totalTickets === 0 || !cafeId) return;

    setIsSubmitting(true);

    if (userLoading) {
      return;
    }

    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      router.push("/login");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_complete) {
        sessionStorage.setItem("redirectAfterOnboarding", window.location.pathname + window.location.search);
        router.push("/onboarding");
        return;
      }
    } catch (err) {
      console.error("Error checking profile:", err);
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => {
          const consoleId = ticketId.split("_")[0] as ConsoleId;
          const pricingTier = consolePricing[consoleId] ?? null;
          const consoleTickets = generateTickets(consoleId, pricingTier, cafePrice, selectedDuration);
          const ticket = consoleTickets.find((t) => t.id === ticketId);
          return {
            ticketId,
            console: consoleId,
            title: ticket?.title || ticketId,
            price: ticket?.price || 0,
            quantity: qty,
          };
        });

      if (selectedTickets.length === 0) {
        alert("Please select at least one ticket.");
        setIsSubmitting(false);
        return;
      }

      const capacityResult = await checkBookingCapacityWithOverlap({
        cafeId,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets.map((t) => ({
          console: t.console,
          quantity: t.quantity,
        })),
        durationMinutes: selectedDuration,
      });

      if (!capacityResult.ok) {
        alert(capacityResult.message);
        await fetchLiveAvailability();
        setIsSubmitting(false);
        return;
      }

      const payload = {
        cafeId: actualCafeId || cafeId,
        cafeName,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets,
        totalAmount: summary.totalAmount,
        durationMinutes: selectedDuration,
        source: "online",
      };

      sessionStorage.setItem("checkoutDraft", JSON.stringify(payload));
      router.push("/checkout");
    } catch (err) {
      console.error("Failed to prepare checkout:", err);
      alert("Could not prepare checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===== RENDER =====
  if (!cafeId) {
    return (
      <div className="error-container">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h1 className="error-title">Café not found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="loading-text">Loading café details...</p>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Background glow */}
      <div className="background-glow" />

      <div className="booking-container">
        {/* Header */}
        <header className="booking-header">
          <button
            onClick={() => (step === 2 ? handleBackToDateTime() : router.back())}
            className="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            {step === 2 ? "Change Date & Time" : "Back"}
          </button>

          <div className="header-top">
            <p className="cafe-name">{cafeName}</p>

            {(googleMapsUrl || instagramUrl) && (
              <div className="social-links">
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button maps"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-button instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <h1 className="booking-title">
            {step === 1 ? "Select Date & Time" : "Choose Your Setup"}
          </h1>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className="step">
              <div className="step-label">Step 1: Date & Time</div>
              <div className="step-bar active" />
            </div>
            <div className="step">
              <div className={`step-label ${step === 2 ? "active" : ""}`}>Step 2: Consoles</div>
              <div className={`step-bar ${step === 2 ? "active" : ""}`} />
            </div>
          </div>
        </header>

        {/* ========== STEP 1: DATE & TIME ========== */}
        {step === 1 && (
          <>
            {/* Date Selection */}
            <section className="date-section">
              <h2 className="section-heading">
                <Calendar className="w-5 h-5" />
                Select Date
              </h2>

              <div className="date-grid">
                {DAY_OPTIONS.map((day) => {
                  const isActive = day.key === selectedDate;
                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDate(day.key)}
                      className={`date-button ${isActive ? 'active' : ''}`}
                      style={{ borderColor: isActive ? colors.red : colors.border }}
                    >
                      <div className={`day-name ${day.isToday ? 'today' : ''}`}>
                        {day.isToday ? "TODAY" : day.dayName}
                      </div>
                      <div className="day-number">{day.dayNum}</div>
                      <div className="month">{day.month}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <section className="time-section">
              <h2 className="section-heading">
                <Clock className="w-5 h-5" />
                Select Time
              </h2>

              {filteredTimeSlots.length === 0 ? (
                <div className="no-slots">
                  <AlertCircle className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="no-slots-title">No slots available for today</p>
                  <p className="no-slots-subtitle">Please select another date</p>
                </div>
              ) : (
                <>
                  <div className="time-grid">
                    {filteredTimeSlots.map((slot) => {
                      const isActive = slot.label === selectedTime;
                      return (
                        <button
                          key={slot.label}
                          onClick={() => setSelectedTime(slot.label)}
                          className={`time-button ${isActive ? 'active' : ''}`}
                          style={{ borderColor: isActive ? colors.red : colors.border }}
                        >
                          <span className="time-label">{slot.label}</span>
                          {slot.isPeak && (
                            <div className="peak-indicator" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="peak-note">
                    <span className="peak-dot" />
                    Peak hours (6 PM - 10 PM) may have higher demand
                  </p>
                </>
              )}
            </section>
          </>
        )}

        {/* ========== STEP 2: TICKETS ========== */}
        {step === 2 && (
          <>
            {/* Selected Date/Time Summary */}
            <div className="booking-summary">
              <div className="summary-content">
                <div className="summary-header">
                  <div className="summary-info">
                    <div className="summary-label">Your Booking</div>
                    <div className="summary-date">{dateLabel}</div>
                    <div className="summary-time">
                      <Clock className="w-4 h-4" />
                      {selectedTime} - {getEndTime(selectedTime, selectedDuration)}
                    </div>
                  </div>
                  <button
                    onClick={handleBackToDateTime}
                    className="change-button"
                  >
                    Change
                  </button>
                </div>

                <div className="duration-badge">
                  <Clock className="w-4 h-4" />
                  <span>{selectedDuration === 30 ? "30 min" : selectedDuration === 60 ? "1 hour" : "1.5 hours"}</span>
                </div>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="duration-section">
              <h2 className="section-heading">
                <Clock className="w-5 h-5" />
                Select Duration
              </h2>
              <div className="duration-grid">
                <button
                  onClick={() => { setSelectedDuration(30); setQuantities({}); }}
                  className={`duration-button ${selectedDuration === 30 ? 'active' : ''}`}
                >
                  <div className="duration-number">30</div>
                  <div className="duration-label">min</div>
                </button>
                <button
                  onClick={() => { setSelectedDuration(60); setQuantities({}); }}
                  className={`duration-button ${selectedDuration === 60 ? 'active' : ''}`}
                >
                  <div className="duration-number">60</div>
                  <div className="duration-label">min</div>
                </button>
                <button
                  onClick={() => { setSelectedDuration(90); setQuantities({}); }}
                  className={`duration-button premium ${selectedDuration === 90 ? 'active' : ''}`}
                >
                  <Crown className="w-3 h-3 absolute top-2 right-2" />
                  <div className="duration-number">90</div>
                  <div className="duration-label">min</div>
                </button>
              </div>
            </div>

            {/* Live Availability Banner */}
            <div className="availability-banner">
              <div className="availability-info">
                <div className="live-indicator" />
                <span className="live-text">Live Availability</span>
                <span className="live-note">(accounts for overlapping bookings)</span>
              </div>
              <div className="availability-actions">
                {loadingAvailability && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {lastUpdated && (
                  <span className="update-time">
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <button
                  onClick={fetchLiveAvailability}
                  disabled={loadingAvailability}
                  className="refresh-button"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Console Selection */}
            <section className="console-section">
              <h2 className="section-heading">
                <Gamepad2 className="w-5 h-5" />
                Select Console
              </h2>

              <div className="console-grid">
                {availableConsoles.map((consoleId) => {
                  const console = CONSOLES.find((c) => c.id === consoleId);
                  if (!console) return null;

                  const isActive = consoleId === selectedConsole;
                  const availability = liveAvailability[consoleId];
                  const totalSlots = availability?.total ?? consoleLimits[consoleId] ?? 0;
                  const availableSlots = availability?.available ?? totalSlots;
                  const nextAvailableAt = availability?.nextAvailableAt ?? null;
                  const mySelection = usedPerConsole[consoleId] ?? 0;
                  const isSoldOut = availableSlots <= 0 && mySelection === 0;
                  const isLowStock = availableSlots <= 2 && availableSlots > 0;

                  return (
                    <button
                      key={consoleId}
                      onClick={() => !isSoldOut && setSelectedConsole(consoleId)}
                      disabled={isSoldOut}
                      className={`console-card ${isActive ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}`}
                      style={{ 
                        borderColor: isActive ? console.color : colors.border,
                        background: isActive ? `linear-gradient(135deg, ${console.color}25 0%, ${console.color}10 100%)` : colors.darkCard
                      }}
                    >
                      <div className={`console-icon ${isSoldOut ? 'disabled' : ''}`}>
                        {console.icon}
                      </div>

                      <div className="console-name" style={{ color: isActive ? console.color : colors.textPrimary }}>
                        {console.label}
                      </div>

                      <div className="console-price">
                        <DollarSign className="w-3 h-3 inline" />
                        {selectedDuration === 90
                          ? ((consolePricing[consoleId]?.qty1_60min ?? cafePrice) + (consolePricing[consoleId]?.qty1_30min ?? cafePrice * 0.5))
                          : (consolePricing[consoleId]?.[`qty1_${selectedDuration}min` as keyof ConsolePricingTier] ?? (selectedDuration === 30 ? cafePrice * 0.5 : cafePrice))
                        }
                      </div>

                      <div className={`availability-badge ${isSoldOut ? 'sold-out' : isLowStock ? 'low-stock' : 'available'}`}>
                        {isSoldOut ? "Sold Out" : `${availableSlots}/${totalSlots}`}
                      </div>

                      {mySelection > 0 && (
                        <div className="selected-indicator" style={{ background: `${console.color}30`, color: console.color }}>
                          <CheckCircle className="w-3 h-3" />
                          {mySelection}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ticket Cards */}
            <section className="tickets-section">
              <div className="tickets-header">
                <h2 className="section-heading">
                  <CreditCard className="w-5 h-5" />
                  Select Tickets
                </h2>

                {!atLimit && remainingForSelected > 0 && (
                  <span className={`availability-text ${remainingForSelected <= 2 ? 'low' : 'high'}`}>
                    {remainingForSelected} slot{remainingForSelected > 1 ? "s" : ""} available
                  </span>
                )}
              </div>

              {atLimit && usedForSelected === 0 ? (
                <div className="sold-out-card">
                  <AlertCircle className="w-10 h-10 mb-3 text-red-500" />
                  <p className="sold-out-title">Sold Out for This Time Slot</p>
                  <p className="sold-out-subtitle">
                    All {CONSOLE_LABELS[selectedConsole]} setups are booked for{" "}
                    {selectedTime} - {getEndTime(selectedTime)}.
                  </p>
                  {liveAvailability[selectedConsole]?.nextAvailableAt && (
                    <div className="next-available">
                      <Clock className="w-4 h-4" />
                      <span>Available from {liveAvailability[selectedConsole]?.nextAvailableAt}</span>
                    </div>
                  )}
                  <p className="sold-out-hint">Try selecting a different time or console.</p>
                </div>
              ) : (
                <div className="tickets-list">
                  {tickets.map((ticket) => {
                    const qty = getQty(ticket.id);
                    const hasQty = qty > 0;
                    const canAdd = remainingForSelected > 0;

                    return (
                      <div key={ticket.id} className={`ticket-card ${hasQty ? 'selected' : ''}`}>
                        <div className="ticket-content">
                          <div className="ticket-info">
                            <div className="ticket-title">{ticket.title}</div>
                            <div className="ticket-price">
                              <DollarSign className="w-4 h-4 inline" />
                              {ticket.price}
                              <span className="price-unit">/hr</span>
                            </div>
                            <p className="ticket-description">{ticket.description}</p>
                          </div>

                          {!hasQty ? (
                            <button
                              disabled={!canAdd}
                              onClick={() => canAdd && setQty(ticket.id, 1)}
                              className={`add-button ${canAdd ? 'enabled' : 'disabled'}`}
                            >
                              Add
                            </button>
                          ) : (
                            <div className="quantity-selector">
                              <button
                                onClick={() => setQty(ticket.id, qty - 1)}
                                className="quantity-btn minus"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="quantity-display">{qty}</span>
                              <button
                                disabled={!canAdd}
                                onClick={() => canAdd && setQty(ticket.id, qty + 1)}
                                className={`quantity-btn plus ${!canAdd ? 'disabled' : ''}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="action-bar">
        <div className="action-content">
          {step === 1 ? (
            <>
              <div className="step1-info">
                <div className="date-display">
                  {selectedDate ? dateLabel : "Select a date"}
                </div>
                <div className={`time-display ${selectedTime ? 'selected' : ''}`}>
                  {selectedTime || "Select a time"}
                </div>
              </div>
              <button
                onClick={handleContinueToTickets}
                disabled={!selectedDate || !selectedTime}
                className={`continue-button ${selectedDate && selectedTime ? 'enabled' : 'disabled'}`}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="step2-info">
                {summary.totalTickets > 0 ? (
                  <>
                    <div className="ticket-count">
                      {summary.totalTickets} ticket{summary.totalTickets > 1 ? "s" : ""} selected
                    </div>
                    <div className="booking-details">
                      {dateLabel} • {selectedTime}
                    </div>
                  </>
                ) : (
                  <div className="no-tickets">Add tickets to continue</div>
                )}
              </div>
              <button
                onClick={handleConfirmBooking}
                disabled={summary.totalTickets === 0 || isSubmitting}
                className={`confirm-button ${summary.totalTickets > 0 && !isSubmitting ? 'enabled' : 'disabled'}`}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {isSubmitting
                  ? "Processing..."
                  : summary.totalTickets > 0
                  ? `Pay ₹${summary.totalAmount}`
                  : "Select Tickets"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx global>{`
        .booking-page {
          min-height: 100vh;
          background: linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%);
          font-family: ${fonts.body};
          color: ${colors.textPrimary};
          position: relative;
        }

        .background-glow {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.06) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        /* Loading and Error States */
        .error-container, .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: ${fonts.body};
        }

        .error-container {
          color: ${colors.red};
        }

        .error-title {
          font-family: ${fonts.heading};
          font-size: 24px;
          margin-bottom: 16px;
        }

        .loading-container {
          color: ${colors.blue};
        }

        .loading-text {
          margin-top: 12px;
          font-size: 14px;
          color: ${colors.textSecondary};
        }

        /* Main Container */
        .booking-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 16px 16px 140px;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .booking-header {
          margin-bottom: 24px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: ${colors.textSecondary};
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 16px;
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .cafe-name {
          font-size: 12px;
          color: ${colors.cyan};
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        }

        .social-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .social-button.maps {
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(66, 133, 244, 0.1) 100%);
          border: 1px solid rgba(66, 133, 244, 0.3);
          color: #4285f4;
        }

        .social-button.instagram {
          background: linear-gradient(135deg, rgba(225, 48, 108, 0.2) 0%, rgba(193, 53, 132, 0.1) 100%);
          border: 1px solid rgba(225, 48, 108, 0.3);
          color: #e1306c;
        }

        .social-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .booking-title {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.cyan} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }

        .step {
          flex: 1;
        }

        .step-label {
          font-size: 10px;
          color: ${colors.textMuted};
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .step-label.active {
          color: ${colors.cyan};
        }

        .step-bar {
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .step-bar.active {
          background: linear-gradient(90deg, ${colors.red} 0%, ${colors.cyan} 100%);
        }

        /* Section Styles */
        .section-heading {
          font-size: 13px;
          font-weight: 600;
          color: ${colors.textSecondary};
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Date Section */
        .date-section {
          margin-bottom: 20px;
        }

        .date-grid {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .date-grid::-webkit-scrollbar {
          display: none;
        }

        .date-button {
          flex-shrink: 0;
          width: 68px;
          padding: 10px 6px;
          border-radius: 10px;
          border: 1px solid ${colors.border};
          background: ${colors.darkCard};
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .date-button.active {
          border: 2px solid ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(255, 7, 58, 0.1) 100%);
          box-shadow: 0 0 20px rgba(255, 7, 58, 0.3);
        }

        .day-name {
          font-size: 11px;
          color: ${colors.textMuted};
          margin-bottom: 4px;
          font-weight: 500;
        }

        .day-name.today {
          color: ${colors.cyan};
        }

        .day-number {
          font-family: ${fonts.heading};
          font-size: 20px;
          font-weight: 700;
          color: ${colors.textPrimary};
        }

        .month {
          font-size: 11px;
          color: ${colors.textMuted};
          margin-top: 2px;
        }

        /* Time Section */
        .time-section {
          margin-bottom: 20px;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .time-button {
          padding: 10px 6px;
          min-height: 44px;
          border-radius: 8px;
          border: 1px solid ${colors.border};
          background: ${colors.darkCard};
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .time-button.active {
          border: 2px solid ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(255, 7, 58, 0.1) 100%);
          box-shadow: 0 0 20px rgba(255, 7, 58, 0.3);
        }

        .time-label {
          font-size: 13px;
          font-weight: 600;
          color: ${colors.textPrimary};
        }

        .peak-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f59e0b;
        }

        .no-slots {
          padding: 32px 20px;
          background: ${colors.darkCard};
          border-radius: 12px;
          border: 1px solid ${colors.border};
          text-align: center;
        }

        .no-slots-title {
          font-size: 14px;
          color: ${colors.textSecondary};
          margin-bottom: 8px;
        }

        .no-slots-subtitle {
          font-size: 12px;
          color: ${colors.textMuted};
        }

        .peak-note {
          font-size: 12px;
          color: ${colors.textMuted};
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .peak-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          display: inline-block;
        }

        /* Step 2 Styles */
        .booking-summary {
          padding: 18px 20px;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(255, 7, 58, 0.08) 100%);
          border-radius: 16px;
          border: 2px solid rgba(0, 240, 255, 0.2);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .summary-content {
          position: relative;
          z-index: 1;
        }

        .summary-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .summary-label {
          font-size: 11px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .summary-date {
          font-size: 16px;
          font-weight: 700;
          color: ${colors.textPrimary};
          font-family: ${fonts.heading};
          margin-bottom: 4px;
        }

        .summary-time {
          font-size: 15px;
          color: ${colors.cyan};
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .change-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.25) 100%);
          border: 1px solid ${colors.cyan};
          border-radius: 10px;
          color: ${colors.cyan};
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .duration-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(0, 240, 255, 0.15);
          border: 1px solid ${colors.cyan};
          font-size: 11px;
          font-weight: 700;
          color: ${colors.cyan};
        }

        /* Duration Selector */
        .duration-section {
          margin-bottom: 24px;
        }

        .duration-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .duration-button {
          padding: 16px 12px;
          min-height: 80px;
          border-radius: 14px;
          border: 1.5px solid ${colors.border};
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .duration-button.active {
          border: 2.5px solid ${colors.cyan};
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.10) 100%);
          box-shadow: 0 6px 20px rgba(0, 240, 255, 0.3);
          transform: translateY(-1px);
        }

        .duration-button.premium.active {
          border-color: ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.22) 0%, rgba(255, 7, 58, 0.10) 100%);
          box-shadow: 0 6px 20px rgba(255, 7, 58, 0.3);
        }

        .duration-number {
          font-size: 26px;
          font-weight: 900;
          font-family: ${fonts.heading};
          color: ${colors.textPrimary};
          margin-bottom: 4px;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        .duration-button.active .duration-number {
          color: ${colors.cyan};
        }

        .duration-button.premium.active .duration-number {
          color: ${colors.red};
        }

        .duration-label {
          font-size: 12px;
          color: ${colors.textMuted};
          font-weight: 600;
        }

        .duration-button.active .duration-label {
          color: ${colors.cyan};
        }

        .duration-button.premium.active .duration-label {
          color: ${colors.red};
        }

        /* Availability Banner */
        .availability-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%);
          border-radius: 10px;
          border: 1px solid rgba(0, 240, 255, 0.2);
          margin-bottom: 20px;
        }

        .availability-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${colors.green};
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .live-text {
          font-size: 13px;
          color: ${colors.cyan};
          font-weight: 500;
        }

        .live-note {
          font-size: 11px;
          color: ${colors.textMuted};
        }

        .availability-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .update-time {
          font-size: 11px;
          color: ${colors.textMuted};
        }

        .refresh-button {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
          border-radius: 6px;
          color: ${colors.textSecondary};
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Console Grid */
        .console-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-start;
        }

        .console-card {
          min-width: 85px;
          max-width: 85px;
          padding: 10px 6px;
          border-radius: 10px;
          border: 1px solid ${colors.border};
          background: ${colors.darkCard};
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .console-card.active {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transform: scale(1.02);
        }

        .console-card.sold-out {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .console-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .console-icon.disabled {
          filter: grayscale(1);
        }

        .console-name {
          font-size: 11px;
          font-weight: 800;
          font-family: ${fonts.heading};
          margin-bottom: 2px;
          letter-spacing: -0.2px;
        }

        .console-price {
          font-size: 10px;
          color: ${colors.textMuted};
          font-weight: 600;
          margin-bottom: 6px;
        }

        .availability-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .availability-badge.available {
          background: rgba(34, 197, 94, 0.2);
          color: ${colors.green};
        }

        .availability-badge.low-stock {
          background: rgba(245, 158, 11, 0.2);
          color: ${colors.orange};
        }

        .availability-badge.sold-out {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .selected-indicator {
          padding: 3px 6px;
          border-radius: 5px;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Tickets Section */
        .tickets-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .availability-text {
          font-size: 12px;
          font-weight: 500;
        }

        .availability-text.high {
          color: ${colors.green};
        }

        .availability-text.low {
          color: ${colors.orange};
        }

        .sold-out-card {
          padding: 32px 20px;
          background: ${colors.darkCard};
          border-radius: 14px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-align: center;
        }

        .sold-out-title {
          font-size: 15px;
          font-weight: 600;
          color: #ef4444;
          margin-bottom: 8px;
        }

        .sold-out-subtitle {
          font-size: 13px;
          color: ${colors.textMuted};
          margin-bottom: 12px;
        }

        .next-available {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.2);
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .sold-out-hint {
          font-size: 12px;
          color: ${colors.textMuted};
        }

        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-card {
          padding: 16px;
          background: ${colors.darkCard};
          border-radius: 14px;
          border: 1px solid ${colors.border};
          transition: all 0.2s ease;
        }

        .ticket-card.selected {
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, ${colors.darkCard} 100%);
          border: 1px solid rgba(255, 7, 58, 0.3);
        }

        .ticket-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .ticket-info {
          flex: 1;
        }

        .ticket-title {
          font-size: 15px;
          font-weight: 600;
          color: ${colors.textPrimary};
          margin-bottom: 6px;
        }

        .ticket-price {
          font-family: ${fonts.heading};
          font-size: 22px;
          font-weight: 700;
          color: ${colors.cyan};
          margin-bottom: 8px;
        }

        .price-unit {
          font-size: 12px;
          color: ${colors.textMuted};
          font-family: ${fonts.body};
          font-weight: 400;
        }

        .ticket-description {
          font-size: 13px;
          color: ${colors.textSecondary};
          line-height: 1.4;
        }

        .add-button {
          padding: 10px 20px;
          min-height: 44px;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-button.enabled {
          background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
        }

        .add-button.disabled {
          background: rgba(255, 255, 255, 0.05);
          color: ${colors.textMuted};
          cursor: not-allowed;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 0;
          background: ${colors.red};
          border-radius: 10px;
          overflow: hidden;
        }

        .quantity-btn {
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantity-btn.disabled {
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
        }

        .quantity-display {
          width: 32px;
          text-align: center;
          font-family: ${fonts.heading};
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        /* Bottom Action Bar */
        .action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 15, 20, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid ${colors.border};
          padding: 16px;
          z-index: 100;
        }

        .action-content {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .step1-info {
          flex: 1;
        }

        .date-display {
          font-size: 14px;
          font-weight: 600;
          color: ${colors.textPrimary};
          margin-bottom: 4px;
        }

        .time-display {
          font-size: 13px;
          color: ${colors.textMuted};
        }

        .time-display.selected {
          color: ${colors.cyan};
        }

        .step2-info {
          flex: 1;
        }

        .ticket-count {
          font-size: 14px;
          font-weight: 600;
          color: ${colors.textPrimary};
          margin-bottom: 4px;
        }

        .booking-details {
          font-size: 13px;
          color: ${colors.textSecondary};
        }

        .no-tickets {
          font-size: 14px;
          color: ${colors.textMuted};
        }

        .continue-button, .confirm-button {
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-family: ${fonts.heading};
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 140px;
          justify-content: center;
        }

        .continue-button.enabled {
          background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
          color: white;
        }

        .continue-button.disabled {
          background: rgba(255, 255, 255, 0.1);
          color: ${colors.textMuted};
          cursor: not-allowed;
        }

        .confirm-button.enabled {
          background: linear-gradient(135deg, ${colors.green} 0%, #16a34a 100%);
          color: white;
        }

        .confirm-button.disabled {
          background: rgba(255, 255, 255, 0.1);
          color: ${colors.textMuted};
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .booking-container {
            padding: 12px 12px 120px;
          }

          .booking-title {
            font-size: 20px;
          }

          .date-button {
            width: 60px;
            padding: 8px 4px;
          }

          .time-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .console-grid {
            justify-content: center;
          }

          .console-card {
            min-width: 75px;
            max-width: 75px;
            padding: 8px 4px;
          }

          .duration-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .duration-button {
            padding: 12px 8px;
            min-height: 70px;
          }

          .duration-number {
            font-size: 22px;
          }

          .action-content {
            gap: 12px;
          }

          .continue-button, .confirm-button {
            padding: 12px 20px;
            font-size: 12px;
            min-width: 120px;
          }
        }

        @media (min-width: 640px) {
          .booking-container {
            padding: 20px 16px 140px;
          }

          .booking-title {
            font-size: 22px;
          }

          .time-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .date-button {
            width: 72px;
            padding: 12px 8px;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Helper to calculate end time based on duration
 */
function getEndTime(startTime: string, durationMinutes: number = BOOKING_DURATION_MINUTES): string {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

  let hours = Math.floor(endMinutes / 60);
  const mins = endMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/* ================= CAPACITY CHECK WITH OVERLAP ================= */
async function checkBookingCapacityWithOverlap(options: {
  cafeId: string;
  bookingDate: string;
  timeSlot: string;
  tickets: SelectedTicketForCheck[];
  durationMinutes: number;
}): Promise<{ ok: boolean; message?: string }> {
  const { cafeId, bookingDate, timeSlot, tickets, durationMinutes } = options;

  const requested: Partial<Record<ConsoleId, number>> = {};
  for (const t of tickets) {
    if (!t.console || t.quantity <= 0) continue;
    requested[t.console] = (requested[t.console] ?? 0) + t.quantity;
  }
  if (Object.keys(requested).length === 0) {
    return { ok: false, message: "No tickets selected." };
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeId);

  const { data: cafeRow, error: cafeError } = await supabase
    .from("cafes")
    .select(
      "id, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
    )
    .eq(isUUID ? "id" : "slug", cafeId)
    .maybeSingle();

  if (cafeError || !cafeRow) {
    console.error("Capacity check: error loading cafe", cafeError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const capacities: Partial<Record<ConsoleId, number>> = {};
  (Object.keys(CONSOLE_DB_KEYS) as ConsoleId[]).forEach((consoleId) => {
    const dbKey = CONSOLE_DB_KEYS[consoleId];
    capacities[consoleId] = (cafeRow as any)[dbKey] ?? 0;
  });

  const selectedTimeMinutes = timeStringToMinutes(timeSlot);

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_time,
      booking_items (
        console,
        quantity
      )
    `
    )
    .eq("cafe_id", cafeRow.id)
    .eq("booking_date", bookingDate)
    .neq("status", "cancelled");

  if (bookingsError) {
    console.error("Capacity check: error loading bookings", bookingsError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const alreadyBooked: Partial<Record<ConsoleId, number>> = {};

  (bookings ?? []).forEach((booking: any) => {
    const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");

    if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, durationMinutes)) {
      (booking.booking_items ?? []).forEach((item: any) => {
        const consoleId = item.console as ConsoleId;
        if (!consoleId) return;
        const qty = item.quantity ?? 0;
        alreadyBooked[consoleId] = (alreadyBooked[consoleId] ?? 0) + qty;
      });
    }
  });

  for (const [consoleIdStr, qtyRequested] of Object.entries(requested)) {
    const consoleId = consoleIdStr as ConsoleId;
    const capacity = capacities[consoleId] ?? 0;
    const used = alreadyBooked[consoleId] ?? 0;
    const remaining = capacity - used;

    if ((qtyRequested ?? 0) > remaining) {
      return {
        ok: false,
        message:
          remaining > 0
            ? `Only ${remaining} ${CONSOLE_LABELS[consoleId]} setup(s) available for this time slot. Another booking overlaps with your selected time.`
            : `No ${CONSOLE_LABELS[consoleId]} setups available. All are booked for overlapping time slots.`,
      };
    }
  }

  return { ok: true };
}