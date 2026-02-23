

const axios = require("axios");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/moveinsync");

const Trip = mongoose.model("Trip", new mongoose.Schema({}, { strict: false }));

const runningTrips = new Set();

// ─── How many degrees to travel per tick ───────────────────────────────────
// ~0.0005 deg ≈ ~55 metres per tick at equator. Adjust for faster/slower sim.
const STEP_DEGREES = 0.0005;


function nextStep(curLat, curLon, destLat, destLon) {
  const dLat = destLat - curLat;
  const dLon = destLon - curLon;

  // Euclidean distance in degree-space
  const dist = Math.sqrt(dLat * dLat + dLon * dLon);

  // Already at (or within one step of) the destination
  if (dist <= STEP_DEGREES) {
    return { lat: destLat, lon: destLon, arrived: true };
  }

  // Unit vector × step  →  move exactly STEP_DEGREES along the straight line
  const ratio = STEP_DEGREES / dist;
  return {
    lat: parseFloat((curLat + dLat * ratio).toFixed(6)),
    lon: parseFloat((curLon + dLon * ratio).toFixed(6)),
    arrived: false,
  };
}

// ─── Poll for IN_PROGRESS trips every 5 s and start their simulations ──────
setInterval(async () => {
  const trips = await Trip.find({ status: "IN_PROGRESS" });

  trips.forEach((trip) => {
    // Each trip gets one simulation loop; never double-start
    if (runningTrips.has(trip.tripId)) return;
    runningTrips.add(trip.tripId);

    // Start from pickup location
    let currentLat = trip.pickupLat;
    let currentLon = trip.pickupLong;

    console.log(`Started simulation for trip ${trip.tripId}`);
    console.log(`From : (${currentLat}, ${currentLon})`);
    console.log(`To   : (${trip.officeLat}, ${trip.officeLong})`);

    // ── Movement phase ────────────────────────────────────────────────────
    const moveInterval = setInterval(async () => {
      const { lat, lon, arrived } = nextStep(
        currentLat,
        currentLon,
        trip.officeLat,
        trip.officeLong
      );

      // Send current position BEFORE updating, so the server always gets
      // a valid intermediate point (matches original simulator behaviour)
      await axios.post("http://localhost:3000/location/update", {
        tripId: trip.tripId,
        latitude: currentLat,
        longitude: currentLon,
        speed: 40,            // km/h – realistic in-transit speed
        timestamp: Date.now(),
      });

      if (arrived) {
        console.log(`[SIM] Trip ${trip.tripId} reached office — starting dwell phase`);
        clearInterval(moveInterval);

        // ── Dwell phase: sit at office with low speed to trigger geofence ─
        let dwellCount = 0;
        const DWELL_TICKS = 7; // 6× 5 s = 30 s  >  DWELL_TIME_MS (30 s)

        const dwellInterval = setInterval(async () => {
          await axios.post("http://localhost:3000/location/update", {
            tripId: trip.tripId,
            latitude: trip.officeLat,
            longitude: trip.officeLong,
            speed: 2,          // <10 km/h  → satisfies lowSpeed check in GeofenceEngine
            timestamp: Date.now(),
          });

          dwellCount++;
          console.log(`[SIM] Trip ${trip.tripId} dwell tick ${dwellCount}/${DWELL_TICKS}`);

          if (dwellCount >= DWELL_TICKS) {
            clearInterval(dwellInterval);
            console.log(`Trip ${trip.tripId} simulation complete`);
          }
        }, 5000);

        return; // stop movement updates
      }

      // Advance position along the straight-line vector
      currentLat = lat;
      currentLon = lon;
    }, 5000);
  });
}, 5000);