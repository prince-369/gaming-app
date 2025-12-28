// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";
import {
  Gamepad2,
  Monitor,
  Car,
  Target,
  Telescope,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Shield,
  Sparkles,
  DollarSign,
  Hash,
  Users
} from "lucide-react";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering_wheel";

const CONSOLES: { id: ConsoleId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "ps5", label: "PS5", icon: <Gamepad2 className="w-6 h-6" />, color: "#3b82f6" },
  { id: "ps4", label: "PS4", icon: <Gamepad2 className="w-6 h-6" />, color: "#1d4ed8" },
  { id: "xbox", label: "Xbox", icon: <Gamepad2 className="w-6 h-6" />, color: "#16a34a" },
  { id: "pc", label: "PC", icon: <Monitor className="w-6 h-6" />, color: "#ef4444" },
  { id: "pool", label: "Pool Table", icon: <Target className="w-6 h-6" />, color: "#92400e" },
  { id: "arcade", label: "Arcade", icon: <Gamepad2 className="w-6 h-6" />, color: "#ea580c" },
  { id: "snooker", label: "Snooker", icon: <Target className="w-6 h-6" />, color: "#059669" },
  { id: "vr", label: "VR", icon: <Telescope className="w-6 h-6" />, color: "#7c3aed" },
  { id: "steering_wheel", label: "Racing Rig", icon: <Car className="w-6 h-6" />, color: "#dc2626" },
];

const CONSOLE_DB_KEYS: Record<ConsoleId, string> = {
  ps5: "ps5_count",
  ps4: "ps4_count",
  xbox: "xbox_count",
  pc: "pc_count",
  pool: "pool_count",
  arcade: "arcade_count",
  snooker: "snooker_count",
  vr: "vr_count",
  steering_wheel: "steering_wheel_count",
};

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

export default function WalkInBookingPage() {
  const params = useParams();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Cafe data
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});

  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<30 | 60>(60);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");

  // Load cafe data
  useEffect(() => {
    async function loadCafe() {
      if (!cafeIdOrSlug) return;

      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeIdOrSlug);

        const { data, error } = await supabase
          .from("cafes")
          .select("*")
          .eq(isUUID ? "id" : "slug", cafeIdOrSlug)
          .maybeSingle();

        if (error || !data) {
          setError("Café not found");
          return;
        }

        setCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        // Get available consoles
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const dbKey = CONSOLE_DB_KEYS[c.id];
          const count = (data as any)[dbKey] ?? 0;

          if (count > 0) {
            available.push(c.id);
          }
        });

        setAvailableConsoles(available);

        // Load console pricing from console_pricing table
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          pricingData.forEach((item: any) => {
            let consoleId = item.console_type as ConsoleId;

            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };
            }

            const key = `qty${item.quantity}_${item.duration_minutes}min` as keyof ConsolePricingTier;
            pricing[consoleId]![key] = item.price;
          });

          setConsolePricing(pricing);
        }

        // Auto-select first available console
        if (available.length > 0) {
          setSelectedConsole(available[0]);
        }
      } catch (err) {
        console.error("Error loading cafe:", err);
        setError("Could not load café details");
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [cafeIdOrSlug]);

  // Calculate amount based on tier pricing
  const calculateAmount = () => {
    if (!selectedConsole) return 0;

    const tier = consolePricing[selectedConsole];
    const basePrice = cafePrice;

    if (tier) {
      const key = `qty${quantity}_${duration}min` as keyof ConsolePricingTier;
      const tierPrice = tier[key];

      if (tierPrice !== null && tierPrice !== undefined) {
        return tierPrice;
      }
    }

    // Fallback to simple calculation
    const durationMultiplier = duration / 60;
    const fallbackAmount = basePrice * quantity * durationMultiplier;
    return Math.round(fallbackAmount);
  };

  const totalAmount = calculateAmount();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (customerPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!selectedConsole) {
      setError("Please select a console");
      return;
    }

    if (!cafeId) {
      setError("Café information not loaded");
      return;
    }

    try {
      setSubmitting(true);

      const now = new Date();
      const bookingDate = now.toISOString().split("T")[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      const startTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafeId,
          user_id: null,
          booking_date: bookingDate,
          start_time: startTime,
          duration: duration,
          total_amount: totalAmount,
          status: "confirmed",
          source: "walk_in",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
        setError("Could not create booking. Please try again.");
        return;
      }

      // Create booking item
      const consoleInfo = CONSOLES.find(c => c.id === selectedConsole);
      const ticketId = `${selectedConsole}_${quantity}_${duration}`;

      const { error: itemError } = await supabase
        .from("booking_items")
        .insert({
          booking_id: booking.id,
          ticket_id: ticketId,
          console: selectedConsole,
          title: `${consoleInfo?.label || selectedConsole} - ${quantity}x ${duration}min`,
          price: totalAmount,
          quantity: quantity,
        });

      if (itemError) {
        console.error("Booking item error:", itemError);
        setError("Booking created but item failed. Please contact staff.");
        return;
      }

      // Success!
      setBookingId(booking.id.slice(0, 8).toUpperCase());
      setSuccess(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setCustomerName("");
        setCustomerPhone("");
        setQuantity(1);
        setDuration(60);
        if (availableConsoles.length > 0) {
          setSelectedConsole(availableConsoles[0]);
        }
        setSuccess(false);
        setBookingId("");
      }, 5000);

    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="loading-spinner" />
        <p className="loading-text">Loading café details...</p>
      </div>
    );
  }

  if (error && !cafeId) {
    return (
      <div className="error-container">
        <AlertCircle className="error-icon" />
        <h1 className="error-title">{error}</h1>
      </div>
    );
  }

  // Filter consoles to show only available ones
  const availableConsoleOptions = CONSOLES.filter(c => availableConsoles.includes(c.id));

  return (
    <>
      <style jsx global>{`
        .walk-in-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          font-family: ${fonts.body};
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .walk-in-container {
          max-width: 480px;
          width: 100%;
        }

        /* Loading States */
        .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          font-family: ${fonts.body};
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          color: ${colors.blue};
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          margin-top: 12px;
          font-size: 14px;
          color: ${colors.textSecondary};
        }

        /* Error States */
        .error-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          font-family: ${fonts.body};
          padding: 20px;
          text-align: center;
        }

        .error-icon {
          width: 48px;
          height: 48px;
          color: ${colors.red};
          margin-bottom: 16px;
        }

        .error-title {
          color: ${colors.red};
          font-size: 18px;
          font-family: ${fonts.heading};
        }

        /* Success State */
        .success-card {
          background: rgba(20, 20, 28, 0.95);
          border: 2px solid rgba(34, 197, 94, 0.5);
          border-radius: 20px;
          padding: 40px 24px;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 16px;
          animation: scaleIn 0.5s ease;
          color: #22c55e;
        }

        .success-title {
          color: #22c55e;
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .booking-id {
          color: ${colors.textPrimary};
          font-size: 16px;
          margin-bottom: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .success-message {
          color: ${colors.textSecondary};
          font-size: 14px;
          margin-top: 16px;
        }

        .amount-card {
          margin-top: 24px;
          padding: 16px;
          background: rgba(255, 7, 58, 0.1);
          border-radius: 12px;
        }

        .amount-label {
          color: ${colors.textSecondary};
          font-size: 13px;
          margin-bottom: 4px;
        }

        .amount-value {
          color: ${colors.red};
          font-size: 32px;
          font-weight: 700;
          font-family: ${fonts.heading};
        }

        /* Header */
        .header {
          text-align: center;
          margin-bottom: 24px;
        }

        .cafe-name {
          font-family: ${fonts.heading};
          font-size: 28px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .page-title {
          color: ${colors.textSecondary};
          font-size: 13px;
        }

        /* Form */
        .form-container {
          background: rgba(20, 20, 28, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
        }

        /* Error Message */
        .error-message {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 12px;
          padding: 12px 16px;
          margin-bottom: 20px;
          color: #ef4444;
          font-size: 14px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Form Inputs */
        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          color: ${colors.textPrimary};
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: ${colors.textPrimary};
          font-size: 16px;
          font-family: ${fonts.body};
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: ${colors.blue};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Console Selection */
        .console-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .console-button {
          padding: 14px 8px;
          border-radius: 12px;
          color: ${colors.textPrimary};
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }

        .console-button.selected {
          border-width: 2px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .console-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .console-icon {
          margin-bottom: 4px;
        }

        .console-label {
          font-size: 12px;
          font-weight: 600;
        }

        /* Quantity Selection */
        .quantity-grid {
          display: flex;
          gap: 8px;
        }

        .quantity-button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          color: ${colors.textPrimary};
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
        }

        .quantity-button.selected {
          background: linear-gradient(135deg, ${colors.red} 0%, #cc0530 100%);
          border-color: ${colors.red};
          color: white;
          box-shadow: 0 4px 12px rgba(255, 7, 58, 0.2);
        }

        .quantity-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Duration Selection */
        .duration-grid {
          display: flex;
          gap: 10px;
        }

        .duration-button {
          flex: 1;
          padding: 14px;
          border-radius: 12px;
          color: ${colors.textPrimary};
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .duration-button.selected {
          background: linear-gradient(135deg, ${colors.cyan} 0%, #00b8d4 100%);
          border-color: ${colors.cyan};
          color: white;
          box-shadow: 0 4px 12px rgba(0, 240, 255, 0.2);
        }

        .duration-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Amount Display */
        .total-amount-card {
          background: rgba(255, 7, 58, 0.1);
          border: 1px solid rgba(255, 7, 58, 0.3);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .amount-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .amount-info {
          display: flex;
          flex-direction: column;
        }

        .amount-label {
          color: ${colors.textSecondary};
          font-size: 13px;
          margin-bottom: 4px;
        }

        .amount-note {
          color: ${colors.textPrimary};
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .amount-value {
          font-family: ${fonts.heading};
          font-size: 36px;
          font-weight: 700;
          color: ${colors.red};
        }

        /* Submit Button */
        .submit-button {
          width: 100%;
          padding: 18px;
          border: none;
          border-radius: 14px;
          color: white;
          font-size: 17px;
          font-weight: 700;
          font-family: ${fonts.heading};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.2s;
          background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
          box-shadow: 0 4px 20px rgba(255, 7, 58, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(148, 163, 184, 0.3);
          box-shadow: none;
        }

        .submit-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(255, 7, 58, 0.4);
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { transform: scale(0.5); }
          to { transform: scale(1); }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .walk-in-page {
            padding: 12px;
          }

          .console-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .cafe-name {
            font-size: 24px;
          }

          .form-container {
            padding: 20px 16px;
          }

          .quantity-button,
          .duration-button {
            padding: 12px;
            font-size: 16px;
          }

          .amount-value {
            font-size: 28px;
          }

          .submit-button {
            padding: 16px;
            font-size: 15px;
          }
        }

        @media (min-width: 640px) {
          .walk-in-page {
            padding: 24px;
          }

          .form-container {
            padding: 32px;
          }
        }
      `}</style>

      <div className="walk-in-page">
        <div className="walk-in-container">
          {/* Success Message */}
          {success ? (
            <div className="success-card">
              <CheckCircle className="success-icon" />
              <div className="success-title">Booking Confirmed!</div>
              <div className="booking-id">
                <Hash className="w-4 h-4" />
                Booking ID: #{bookingId}
              </div>
              <div className="success-message">
                Please proceed to the counter for payment
              </div>
              <div className="amount-card">
                <div className="amount-label">Amount to Pay</div>
                <div className="amount-value">₹{totalAmount}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="header">
                <h1 className="cafe-name">{cafeName}</h1>
                <p className="page-title">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Walk-In Booking Form
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="form-container">
                {/* Error Message */}
                {error && (
                  <div className="error-message">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Name Input */}
                <div className="form-group">
                  <label className="form-label">
                    <User className="w-4 h-4" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={submitting}
                    autoComplete="name"
                    className="form-input"
                  />
                </div>

                {/* Phone Input */}
                <div className="form-group">
                  <label className="form-label">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    disabled={submitting}
                    autoComplete="tel"
                    inputMode="numeric"
                    className="form-input"
                  />
                </div>

                {/* Console Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <Gamepad2 className="w-4 h-4" />
                    Select Console *
                  </label>
                  <div className="console-grid">
                    {availableConsoleOptions.map((console) => {
                      const isSelected = selectedConsole === console.id;

                      return (
                        <button
                          key={console.id}
                          type="button"
                          onClick={() => setSelectedConsole(console.id)}
                          disabled={submitting}
                          className={`console-button ${isSelected ? 'selected' : ''}`}
                          style={{
                            borderColor: isSelected ? console.color : undefined,
                            background: isSelected ? `linear-gradient(135deg, ${console.color}33 0%, ${console.color}11 100%)` : undefined
                          }}
                        >
                          <div className="console-icon" style={{ color: isSelected ? console.color : colors.textPrimary }}>
                            {console.icon}
                          </div>
                          <div className="console-label">{console.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <Users className="w-4 h-4" />
                    No. of Players
                  </label>
                  <div className="quantity-grid">
                    {[1, 2, 3, 4].map((num) => {
                      const isSelected = quantity === num;

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuantity(num)}
                          disabled={submitting}
                          className={`quantity-button ${isSelected ? 'selected' : ''}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <Clock className="w-4 h-4" />
                    Duration
                  </label>
                  <div className="duration-grid">
                    <button
                      type="button"
                      onClick={() => setDuration(30)}
                      disabled={submitting}
                      className={`duration-button ${duration === 30 ? 'selected' : ''}`}
                    >
                      <Clock className="w-4 h-4" />
                      30 min
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration(60)}
                      disabled={submitting}
                      className={`duration-button ${duration === 60 ? 'selected' : ''}`}
                    >
                      <Clock className="w-4 h-4" />
                      60 min
                    </button>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="total-amount-card">
                  <div className="amount-content">
                    <div className="amount-info">
                      <div className="amount-label">Total Amount</div>
                      <div className="amount-note">
                        <CreditCard className="w-3 h-3" />
                        Pay at Counter
                      </div>
                    </div>
                    <div className="amount-value">₹{totalAmount}</div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedConsole}
                  className="submit-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}