// src/app/bookings/[bookingId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";
import {
  ArrowLeft,
  Gamepad2,
  Monitor,
  Car,
  Target,
  Telescope,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Ticket,
  CreditCard,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Home,
  Users,
  DollarSign,
  Hash,
  Shield,
  Star,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  History,
  CheckSquare
} from "lucide-react";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id: string | null;
  booking_date: string | null;
  start_time: string | null;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
  duration?: number | null;
  source?: string | null;
};

type BookingItemRow = {
  id?: string;
  booking_id: string;
  ticket_id: string;
  console: string | null;
  title: string | null;
  price: number | null;
  quantity: number | null;
};

type CafeRow = {
  id: string;
  name: string;
  google_maps_url?: string | null;
  instagram_url?: string | null;
  address?: string | null;
};

type BookingWithRelations = BookingRow & {
  items: BookingItemRow[];
  cafe: CafeRow | null;
};

// Console icons mapping
const consoleIcons: Record<string, React.ReactNode> = {
  ps5: <Gamepad2 className="w-6 h-6" />,
  ps4: <Gamepad2 className="w-6 h-6" />,
  xbox: <Gamepad2 className="w-6 h-6" />,
  pc: <Monitor className="w-6 h-6" />,
  pool: <Target className="w-6 h-6" />,
  arcade: <Gamepad2 className="w-6 h-6" />,
  snooker: <Target className="w-6 h-6" />,
  vr: <Telescope className="w-6 h-6" />,
  steering: <Car className="w-6 h-6" />,
  steering_wheel: <Car className="w-6 h-6" />,
};

export default function BookingDetailsPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;
  const router = useRouter();

  const [data, setData] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load booking + items + cafe
  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle<BookingRow>();

        if (bookingError) {
          console.error("[BookingDetails] bookingError:", bookingError);
          throw bookingError;
        }

        if (!booking) {
          setErrorMsg("This booking could not be found.");
          return;
        }

        const { data: itemsRows, error: itemsError } = await supabase
          .from("booking_items")
          .select("*")
          .eq("booking_id", bookingId);

        if (itemsError) {
          console.error("[BookingDetails] itemsError:", itemsError);
          throw itemsError;
        }

        const items = (itemsRows || []) as BookingItemRow[];

        let cafe: CafeRow | null = null;
        if (booking.cafe_id) {
          const { data: cafeRow, error: cafeError } = await supabase
            .from("cafes")
            .select("id, name, google_maps_url, instagram_url, address")
            .eq("id", booking.cafe_id)
            .maybeSingle<CafeRow>();

          if (cafeError) {
            console.error("[BookingDetails] cafeError:", cafeError);
            throw cafeError;
          }
          cafe = cafeRow ?? null;
        }

        if (!cancelled) {
          setData({
            ...booking,
            items,
            cafe,
          });
        }
      } catch (err) {
        console.error("Error loading booking details:", err);
        if (!cancelled) {
          setErrorMsg("Could not load booking details. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Helpers
  const formattedDate = useMemo(() => {
    if (!data?.booking_date) return "Date not set";
    try {
      const d = new Date(`${data.booking_date}T00:00:00`);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "short",
      });
    } catch {
      return data.booking_date;
    }
  }, [data?.booking_date]);

  const totalTickets = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }, [data]);

  const canCancel = useMemo(() => {
    if (!data) return false;
    const status = (data.status || "").toLowerCase();
    if (status === "cancelled") return false;
    if (!data.booking_date) return false;

    const todayStr = new Date().toISOString().slice(0, 10);
    return data.booking_date >= todayStr;
  }, [data]);

  const isUpcoming = useMemo(() => {
    if (!data?.booking_date) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return data.booking_date >= todayStr;
  }, [data]);

  const bookingSource = useMemo(() => {
    if (!data?.source) return "Online";
    if (data.source === "walk_in") return "Walk-in";
    return "Online";
  }, [data?.source]);

  async function handleCancelBooking() {
    if (!data || !bookingId) return;
    if (!canCancel) return;

    const ok = window.confirm(
      "Are you sure you want to cancel this booking? This cannot be undone."
    );
    if (!ok) return;

    try {
      setIsCancelling(true);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      setData((prev) =>
        prev
          ? { ...prev, status: "cancelled" }
          : prev
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Could not cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  function getStatusInfo(status?: string | null) {
    const value = (status || "confirmed").toLowerCase();
    
    if (value === "cancelled") {
      return {
        label: "CANCELLED",
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.3)",
        color: "#ef4444",
        icon: <XCircle className="w-4 h-4" />,
      };
    }
    if (value === "pending") {
      return {
        label: "PENDING",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.3)",
        color: "#f59e0b",
        icon: <AlertCircle className="w-4 h-4" />,
      };
    }
    return {
      label: "CONFIRMED",
      bg: "rgba(34, 197, 94, 0.15)",
      border: "rgba(34, 197, 94, 0.3)",
      color: "#22c55e",
      icon: <CheckCircle className="w-4 h-4" />,
    };
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="loading-spinner" />
        <p className="loading-text">Loading booking details...</p>
        <style jsx global>{`
          .loading-container {
            min-height: 100vh;
            background: linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%);
            font-family: ${fonts.body};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            color: ${colors.cyan};
            animation: spin 1s linear infinite;
          }
          .loading-text {
            margin-top: 16px;
            color: ${colors.textSecondary};
            font-size: 14px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (errorMsg || !data) {
    return (
      <div className="error-container">
        <AlertCircle className="error-icon" />
        <h1 className="error-title">Booking Not Found</h1>
        <p className="error-message">
          {errorMsg ?? "This booking doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="error-button"
        >
          Go to Dashboard
        </button>
        <style jsx global>{`
          .error-container {
            min-height: 100vh;
            background: linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%);
            font-family: ${fonts.body};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
          }
          .error-icon {
            width: 64px;
            height: 64px;
            color: ${colors.red};
            margin-bottom: 20px;
          }
          .error-title {
            font-family: ${fonts.heading};
            font-size: 20px;
            color: ${colors.red};
            margin-bottom: 12px;
          }
          .error-message {
            color: ${colors.textSecondary};
            font-size: 14px;
            margin-bottom: 24px;
            max-width: 300px;
          }
          .error-button {
            padding: 14px 28px;
            background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-family: ${fonts.heading};
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  const statusInfo = getStatusInfo(data.status);

  return (
    <>
      <style jsx global>{`
        .booking-details-page {
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
          background: radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.06) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.04) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        .booking-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px 40px;
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
          margin-bottom: 8px;
        }

        .booking-id-label {
          font-size: 12px;
          color: ${colors.cyan};
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }

        .booking-id-value {
          font-family: ${fonts.heading};
          font-size: 20px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin: 0;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Session Badge */
        .session-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .session-badge.upcoming {
          background: rgba(0, 240, 255, 0.1);
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .session-badge.past {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
        }

        .session-badge-text {
          font-size: 13px;
          font-weight: 500;
        }

        /* Ticket Card */
        .ticket-card {
          background: linear-gradient(180deg, #1a1a1a 0%, ${colors.darkCard} 100%);
          border-radius: 16px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          border: 2px dashed ${colors.border};
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .ticket-header {
          background: linear-gradient(90deg, ${colors.red} 0%, ${colors.cyan} 100%);
          padding: 4px 0;
          position: relative;
        }

        .ticket-body {
          padding: 24px 20px;
        }

        .venue-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .venue-icon {
          font-size: 56px;
          margin-bottom: 12px;
          color: ${colors.cyan};
        }

        .venue-name {
          font-size: 20px;
          font-weight: 800;
          color: ${colors.textPrimary};
          margin: 0 0 8px 0;
          font-family: ${fonts.heading};
          letter-spacing: 1px;
        }

        .venue-type {
          display: inline-block;
          padding: 4px 12px;
          background: linear-gradient(135deg, ${colors.red}30 0%, ${colors.cyan}30 100%);
          border-radius: 20px;
          font-size: 11px;
          color: ${colors.cyan};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Ticket Divider */
        .ticket-divider {
          position: relative;
          height: 1px;
          background: linear-gradient(90deg, ${colors.border} 0%, ${colors.border} 100%);
          margin: 0 -20px 24px -20px;
        }

        .ticket-hole {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${colors.dark};
          border: 1px solid ${colors.border};
          top: -9px;
        }

        .ticket-hole.left {
          left: -10px;
        }

        .ticket-hole.right {
          right: -10px;
        }

        /* Details Grid */
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 10px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .detail-value {
          font-size: 16px;
          font-weight: 700;
          color: ${colors.textPrimary};
        }

        .detail-value.time {
          color: ${colors.cyan};
        }

        /* Social Links */
        .social-section {
          margin-bottom: 20px;
        }

        .social-label {
          font-size: 10px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          font-weight: 600;
          text-align: center;
        }

        .social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .social-link.maps {
          background: #4285F4;
          color: white;
        }

        .social-link.instagram {
          background: #E1306C;
          color: white;
        }

        .social-link:hover {
          transform: scale(1.05);
        }

        .social-link-text {
          font-size: 12px;
          font-weight: 700;
        }

        /* Review Banner */
        .review-banner {
          padding: 12px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%);
          border-radius: 10px;
          border: 1px solid rgba(34, 197, 94, 0.3);
          text-align: center;
        }

        .review-stars {
          font-size: 16px;
          margin-bottom: 4px;
          color: #fbbf24;
        }

        .review-text {
          font-size: 11px;
          color: ${colors.textMuted};
          line-height: 1.4;
        }

        .review-text strong {
          color: #22c55e;
        }

        /* Tickets Section */
        .tickets-section {
          background: ${colors.darkCard};
          border: 1px solid ${colors.border};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 12px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letterSpacing: 1.5px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid ${colors.border};
        }

        .ticket-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ticket-icon {
          color: ${colors.cyan};
        }

        .ticket-details {
          display: flex;
          flex-direction: column;
        }

        .ticket-name {
          font-size: 14px;
          font-weight: 600;
          color: ${colors.textPrimary};
          margin-bottom: 2px;
        }

        .ticket-quantity {
          font-size: 12px;
          color: ${colors.textMuted};
        }

        .ticket-price {
          font-family: ${fonts.heading};
          font-size: 16px;
          font-weight: 600;
          color: ${colors.cyan};
        }

        /* Payment Summary */
        .payment-summary {
          background: ${colors.darkCard};
          border: 1px solid ${colors.border};
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .payment-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(34, 197, 94, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(34, 197, 94, 0.15);
        }

        .payment-info {
          display: flex;
          flex-direction: column;
        }

        .payment-label {
          font-size: 12px;
          color: ${colors.textMuted};
          margin-bottom: 4px;
        }

        .payment-amount {
          font-family: ${fonts.heading};
          font-size: 28px;
          font-weight: 700;
          color: ${colors.textPrimary};
        }

        .payment-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(34, 197, 94, 0.15);
          border-radius: 8px;
        }

        .payment-status-text {
          font-size: 12px;
          color: #22c55e;
          font-weight: 600;
        }

        /* Info Banner */
        .info-banner {
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.15);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .info-content {
          display: flex;
          flex-direction: column;
        }

        .info-text {
          font-size: 13px;
          color: ${colors.textSecondary};
          line-height: 1.5;
          margin: 0;
        }

        .info-date {
          font-size: 11px;
          color: ${colors.textMuted};
          margin-top: 8px;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .primary-button {
          padding: 16px 24px;
          border: none;
          border-radius: 14px;
          color: ${colors.dark};
          font-family: ${fonts.heading};
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .primary-button.blue {
          background: linear-gradient(135deg, ${colors.cyan} 0%, #0891b2 100%);
          box-shadow: 0 8px 32px rgba(0, 240, 255, 0.4);
        }

        .primary-button.blue:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 240, 255, 0.6);
        }

        .secondary-button {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
          border-radius: 14px;
          color: ${colors.textPrimary};
          font-family: ${fonts.heading};
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .cancel-button {
          padding: 14px 24px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #ef4444;
          font-family: ${fonts.body};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s ease;
        }

        .cancel-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.15);
        }

        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .booking-container {
            padding: 16px 12px 32px;
          }

          .details-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .social-grid {
            grid-template-columns: 1fr;
          }

          .ticket-card {
            margin: 0 -12px;
            border-radius: 12px;
          }

          .ticket-body {
            padding: 20px 16px;
          }

          .venue-icon {
            font-size: 48px;
          }

          .venue-name {
            font-size: 18px;
          }

          .primary-button,
          .secondary-button {
            padding: 14px 20px;
            font-size: 13px;
          }
        }

        @media (min-width: 640px) {
          .booking-container {
            padding: 24px 20px 48px;
          }
        }
      `}</style>

      <div className="booking-details-page">
        {/* Background glow */}
        <div className="background-glow" />

        <div className="booking-container">
          {/* Header */}
          <header className="booking-header">
            <button
              onClick={() => router.push("/dashboard")}
              className="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="header-top">
              <div>
                <p className="booking-id-label">Booking Details</p>
                <h1 className="booking-id-value">
                  #{data.id.slice(0, 8).toUpperCase()}
                </h1>
              </div>

              {/* Status Badge */}
              <div 
                className="status-badge"
                style={{
                  background: statusInfo.bg,
                  border: `1px solid ${statusInfo.border}`,
                  color: statusInfo.color,
                }}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </div>
            </div>
          </header>

          {/* Upcoming/Past Badge */}
          {data.status?.toLowerCase() !== "cancelled" && (
            <div className={`session-badge ${isUpcoming ? 'upcoming' : 'past'}`}>
              {isUpcoming ? (
                <>
                  <Calendar className="w-4 h-4" />
                  <span className="session-badge-text">Upcoming Session</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4" />
                  <span className="session-badge-text">Past Session</span>
                </>
              )}
            </div>
          )}

          {/* Ticket-Style Card */}
          <section className="ticket-card">
            {/* Ticket Header Bar */}
            <div className="ticket-header" />

            {/* Main Ticket Body */}
            <div className="ticket-body">
              {/* Venue Name & Icon */}
              <div className="venue-section">
                <div className="venue-icon">
                  <Gamepad2 className="w-full h-full" />
                </div>
                <h2 className="venue-name">
                  {data.cafe?.name ?? "Gaming Café"}
                </h2>
                <div className="venue-type">
                  Gaming Session
                </div>
              </div>

              {/* Divider with circles */}
              <div className="ticket-divider">
                <div className="ticket-hole left" />
                <div className="ticket-hole right" />
              </div>

              {/* Ticket Details Grid */}
              <div className="details-grid">
                {/* Date */}
                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar className="w-3 h-3" />
                    Date
                  </div>
                  <div className="detail-value">
                    {formattedDate}
                  </div>
                </div>

                {/* Time */}
                <div className="detail-item">
                  <div className="detail-label">
                    <Clock className="w-3 h-3" />
                    Time
                  </div>
                  <div className="detail-value time">
                    {data.start_time || "Time not set"}
                  </div>
                </div>

                {/* Duration */}
                {data.duration && (
                  <div className="detail-item">
                    <div className="detail-label">
                      <Clock className="w-3 h-3" />
                      Duration
                    </div>
                    <div className="detail-value">
                      {data.duration} minutes
                    </div>
                  </div>
                )}

                {/* Booking Source */}
                <div className="detail-item">
                  <div className="detail-label">
                    <Hash className="w-3 h-3" />
                    Source
                  </div>
                  <div className="detail-value">
                    {bookingSource}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {data.cafe && (data.cafe.google_maps_url || data.cafe.instagram_url) && (
                <div className="social-section">
                  <div className="social-label">
                    Stay Connected
                  </div>
                  <div className="social-grid">
                    {data.cafe.google_maps_url && (
                      <a
                        href={data.cafe.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link maps"
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="social-link-text">Google Maps</span>
                      </a>
                    )}

                    {data.cafe.instagram_url && (
                      <a
                        href={data.cafe.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link instagram"
                      >
                        <Instagram className="w-4 h-4" />
                        <span className="social-link-text">Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Review Banner */}
              <div className="review-banner">
                <div className="review-stars">
                  <Star className="w-4 h-4 inline" />
                  <Star className="w-4 h-4 inline" />
                  <Star className="w-4 h-4 inline" />
                  <Star className="w-4 h-4 inline" />
                  <Star className="w-4 h-4 inline" />
                </div>
                <div className="review-text">
                  <strong>Love it?</strong> Leave a review and help other gamers!
                </div>
              </div>
            </div>
          </section>

          {/* Tickets Section */}
          <section className="tickets-section">
            <h3 className="section-title">
              <Ticket className="w-4 h-4" />
              Tickets ({totalTickets})
            </h3>

            {data.items.length === 0 ? (
              <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                No ticket details available.
              </p>
            ) : (
              <div className="tickets-list">
                {data.items.map((item) => (
                  <div
                    key={item.id ?? `${item.ticket_id}-${item.console}`}
                    className="ticket-item"
                  >
                    <div className="ticket-info">
                      <div className="ticket-icon">
                        {consoleIcons[item.console || "ps5"] || <Gamepad2 className="w-6 h-6" />}
                      </div>
                      <div className="ticket-details">
                        <p className="ticket-name">
                          {item.title ?? "Ticket"}
                        </p>
                        <p className="ticket-quantity">
                          {item.quantity ?? 0} × ₹{item.price ?? 0}
                        </p>
                      </div>
                    </div>
                    <p className="ticket-price">
                      ₹{(item.price ?? 0) * (item.quantity ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Payment Summary */}
          <section className="payment-summary">
            <h3 className="section-title">
              <CreditCard className="w-4 h-4" />
              Payment Summary
            </h3>

            <div className="payment-card">
              <div className="payment-info">
                <p className="payment-label">Total Amount Paid</p>
                <p className="payment-amount">
                  ₹{data.total_amount ?? 0}
                </p>
              </div>
              <div className="payment-status">
                <CheckCircle className="w-4 h-4" />
                <span className="payment-status-text">Paid</span>
              </div>
            </div>
          </section>

          {/* Booking Info */}
          <section className="info-banner">
            <Info className="w-5 h-5 text-cyan-400" />
            <div className="info-content">
              <p className="info-text">
                {isUpcoming 
                  ? "Show this booking at the venue. Arrive 5 minutes early for the best experience!"
                  : "Thank you for gaming with us! We hope you had a great time."
                }
              </p>
              <p className="info-date">
                Booked on: {new Date(data.created_at || "").toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={() => router.push("/dashboard")}
              className="primary-button blue"
            >
              <Users className="w-5 h-5" />
              View All Bookings
            </button>

            <Link
              href="/"
              className="secondary-button"
            >
              <Gamepad2 className="w-5 h-5" />
              Book Another Session
            </Link>

            {canCancel && (
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="cancel-button"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Cancel Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}