import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import LineString from "ol/geom/LineString";

const POLL_INTERVAL_MS = 5000;
const API_BASE = "http://localhost:3000";

axios.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("token")}`;

// ─── Coloured circle pin style for OL map ────────────────────────────────────
function makePinStyle(color, label) {
  return new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: "#fff", width: 2.5 }),
    }),
    text: new Text({
      text: label,
      font: "bold 11px sans-serif",
      fill: new Fill({ color: "#fff" }),
      offsetY: 1,
    }),
  });
}

export default function VehicleMap() {
  const [tripId,        setTripId]        = useState(null);
  const [tripStatus,    setTripStatus]    = useState(null);
  const [lastUpdate,    setLastUpdate]    = useState(null);
  const [error,         setError]         = useState(null);
  // ── popup state ─────────────────────────────────────────────────────────
  const [showPopup,     setShowPopup]     = useState(false);
  const [completedId,   setCompletedId]   = useState(null); // tripId captured at completion

  // ── OL refs ─────────────────────────────────────────────────────────────
  const mapRef          = useRef(null);
  const mapObjRef       = useRef(null);
  const vectorSourceRef = useRef(null);
  const cabMarkerRef    = useRef(null);
  const trailSourceRef  = useRef(null);
  const trailCoordsRef  = useRef([]);
  const hasCenteredRef  = useRef(false);
  const pinsAddedRef    = useRef(false);
  const intervalRef     = useRef(null);
  // track previous status so we fire the popup exactly once on transition
  const prevStatusRef   = useRef(null);

  // ─── 1. Init OL map once ────────────────────────────────────────────────
  useEffect(() => {
    if (mapObjRef.current) return;

    const cabSource = new VectorSource();
    vectorSourceRef.current = cabSource;

    const trailSource = new VectorSource();
    trailSourceRef.current = trailSource;

    const trailLayer = new VectorLayer({
      source: trailSource,
      style: new Style({
        stroke: new Stroke({ color: "rgba(59,130,246,0.6)", width: 3, lineDash: [6, 4] }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        trailLayer,
        new VectorLayer({ source: cabSource }),
      ],
      view: new View({ center: fromLonLat([77.209, 28.6139]), zoom: 13 }),
    });

    mapObjRef.current = map;
    return () => { map.setTarget(null); mapObjRef.current = null; };
  }, []);

  // ─── 2. Fetch active trip ID once ───────────────────────────────────────
  useEffect(() => {
    axios.get(`${API_BASE}/trip/active`)
      .then(res => {
        if (res.data?.tripId) { setTripId(res.data.tripId); setError(null); }
        else setError("No active trip found.");
      })
      .catch(() => setError("Could not reach server."));
  }, []);

  // ─── 3. Smooth marker animation helper ──────────────────────────────────
  const animateMarker = useCallback((marker, toCoords) => {
    const geom  = marker.getGeometry();
    const from  = geom.getCoordinates();
    const STEPS = 20;
    let   step  = 0;
    const tick  = () => {
      step++;
      const t = step / STEPS;
      geom.setCoordinates([
        from[0] + (toCoords[0] - from[0]) * t,
        from[1] + (toCoords[1] - from[1]) * t,
      ]);
      if (step < STEPS) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  // ─── 4. GPS polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!tripId) return;

    const poll = async () => {
      try {
        const res = await axios.get(`${API_BASE}/trip/${tripId}`);
        const { currentLat, currentLong, status, pickupLat, pickupLong, officeLat, officeLong } = res.data;

        // ── 4a. Detect COMPLETED transition → show popup exactly once ──────
        // prevStatusRef tracks the last known status. When it changes from
        // anything → "COMPLETED", we store the tripId and open the modal.
        if (status === "COMPLETED" && prevStatusRef.current !== "COMPLETED") {
          setCompletedId(tripId);   // capture tripId for the popup message
          setShowPopup(true);       // open the popup
          clearInterval(intervalRef.current); // stop polling — trip is done
        }
        prevStatusRef.current = status;

        if (!currentLat || !currentLong) return;

        const cabCoords = fromLonLat([currentLong, currentLat]);

        // ── 4b. Place green START + red DESTINATION pins once ──────────────
        if (!pinsAddedRef.current && pickupLat && pickupLong && officeLat && officeLong) {
          const pickupPin = new Feature({ geometry: new Point(fromLonLat([pickupLong, pickupLat])) });
          pickupPin.setStyle(makePinStyle("#16a34a", "S")); // green — Start

          const officePin = new Feature({ geometry: new Point(fromLonLat([officeLong, officeLat])) });
          officePin.setStyle(makePinStyle("#dc2626", "D")); // red — Destination

          vectorSourceRef.current.addFeature(pickupPin);
          vectorSourceRef.current.addFeature(officePin);
          pinsAddedRef.current = true;

          // Fit view to show both pins on first load
          if (!hasCenteredRef.current && mapObjRef.current) {
            mapObjRef.current.getView().fit(vectorSourceRef.current.getExtent(), {
              padding: [80, 80, 80, 80], maxZoom: 16, duration: 900,
            });
            hasCenteredRef.current = true;
          }
        }

        // ── 4c. Create or animate the cab marker ───────────────────────────
        if (!cabMarkerRef.current) {
          const marker = new Feature({ geometry: new Point(cabCoords) });
          marker.setStyle(new Style({
            image: new Icon({ src: "https://cdn-icons-png.flaticon.com/512/854/854878.png", scale: 0.07, anchor: [0.5, 1] }),
          }));
          cabMarkerRef.current = marker;
          vectorSourceRef.current.addFeature(marker);

          // Blue pulse ring
          const pulse = new Feature({ geometry: new Point(cabCoords) });
          pulse.setStyle(new Style({
            image: new CircleStyle({
              radius: 13,
              fill: new Fill({ color: "rgba(59,130,246,0.12)" }),
              stroke: new Stroke({ color: "rgba(59,130,246,0.8)", width: 2 }),
            }),
          }));
          vectorSourceRef.current.addFeature(pulse);
          cabMarkerRef._pulseFeature = pulse;
        } else {
          animateMarker(cabMarkerRef.current, cabCoords);
          if (cabMarkerRef._pulseFeature) animateMarker(cabMarkerRef._pulseFeature, cabCoords);
        }

        // ── 4d. Grow trail ─────────────────────────────────────────────────
        trailCoordsRef.current.push(cabCoords);
        if (trailCoordsRef.current.length > 1) {
          const existing = trailSourceRef.current.getFeatures()[0];
          if (existing) {
            existing.getGeometry().setCoordinates(trailCoordsRef.current);
          } else {
            trailSourceRef.current.addFeature(
              new Feature({ geometry: new LineString(trailCoordsRef.current) })
            );
          }
        }

        setLastUpdate(new Date().toLocaleTimeString());
        setTripStatus(status);
        setError(null);
      } catch {
        setError("Failed to fetch location.");
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [tripId, animateMarker]);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", fontFamily: "'DM Mono', monospace, sans-serif" }}>

      {/* OL map */}
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {/* ── HUD top-left ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 100,
        background: "rgba(10,10,20,0.82)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
        padding: "14px 18px", color: "#fff", minWidth: 220,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#60a5fa", marginBottom: 8, textTransform: "uppercase" }}>
          ◉ Live Tracking
        </div>
        {tripId && (
          <>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Trip ID</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#f8fafc" }}>{tripId}</div>
          </>
        )}
        <StatusBadge status={tripStatus} />
        {lastUpdate && (
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 10 }}>Last update: {lastUpdate}</div>
        )}
        {error && (
          <div style={{ fontSize: 11, color: "#f87171", marginTop: 8, padding: "6px 8px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
            ⚠ {error}
          </div>
        )}
      </div>

      {/* ── Legend bottom-left ───────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 16, left: 16, zIndex: 100,
        background: "rgba(10,10,20,0.78)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
        padding: "10px 14px", color: "#94a3b8", fontSize: 12,
        display: "flex", flexDirection: "column", gap: 7,
      }}>
        <Row><Pin color="#16a34a" label="S" /> Starting point (Pickup)</Row>
        <Row><Pin color="#dc2626" label="D" /> Destination (Office)</Row>
        <Row><span style={{ fontSize: 16 }}>🚗</span> Vehicle (live)</Row>
        <Row>
          <span style={{ display: "inline-block", width: 28, height: 0, borderTop: "2px dashed rgba(59,130,246,0.8)" }} />
          Route trail
        </Row>
      </div>

      {/* ── Trip Completed Popup ─────────────────────────────────────────── */}
      {showPopup && (
        <CompletedPopup
          tripId={completedId}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

// ── Trip completed modal ──────────────────────────────────────────────────────
function CompletedPopup({ tripId, onClose }) {
  return (
    <>
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.25s ease",
        }}
      />

      {/* Modal card */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 201,
        background: "linear-gradient(145deg, #0f172a, #1e293b)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 18,
        padding: "36px 40px",
        minWidth: 320,
        textAlign: "center",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        animation: "popIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
        color: "#f8fafc",
        fontFamily: "'DM Mono', monospace, sans-serif",
      }}>
        {/* Big checkmark icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(16,185,129,0.15)",
          border: "2px solid #10b981",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: 36,
          boxShadow: "0 0 24px rgba(16,185,129,0.3)",
        }}>
          ✓
        </div>

        <div style={{ fontSize: 11, letterSpacing: 3, color: "#10b981", marginBottom: 8, textTransform: "uppercase" }}>
          Trip Completed
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Vehicle has arrived!
        </div>

        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 24 }}>
          The vehicle successfully reached the destination.
        </div>

        {/* Trip ID pill */}
        <div style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "8px 18px",
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 3 }}>TRIP ID</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", letterSpacing: 1 }}>{tripId}</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            display: "block", width: "100%",
            padding: "12px 0",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 0.5,
            boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.target.style.opacity = 0.85}
          onMouseLeave={e => e.target.style.opacity = 1}
        >
          Dismiss
        </button>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn   { from { opacity: 0; transform: translate(-50%,-50%) scale(0.85) }
                               to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Row({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{children}</div>;
}

function Pin({ color, label }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="9" fill={color} stroke="#fff" strokeWidth="2" />
      <text x="10" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">{label}</text>
    </svg>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    IN_PROGRESS: { bg: "rgba(16,185,129,0.15)",  text: "#10b981", dot: "#10b981" },
    COMPLETED:   { bg: "rgba(99,102,241,0.15)",  text: "#818cf8", dot: "#818cf8" },
    default:     { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", dot: "#94a3b8" },
  };
  const c = map[status] || map.default;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 20,
      background: c.bg, color: c.text, fontSize: 12, fontWeight: 600,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: c.dot,
        boxShadow: status === "IN_PROGRESS" ? `0 0 6px ${c.dot}` : "none",
        animation: status === "IN_PROGRESS" ? "pulseDot 1.5s infinite" : "none",
      }} />
      {status.replace("_", " ")}
    </div>
  );
}