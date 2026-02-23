


const geofenceEngine = require("../services/GeofenceEngine");
const Trip = require("../models/Trip");

class TripController {
  static async startTrip(req, res) {
    try {
      const { tripId, vehicleId, pickupLat, pickupLong, officeLat, officeLong } = req.body;

      if (!tripId || !vehicleId || pickupLat === undefined || pickupLong === undefined || officeLat === undefined || officeLong === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const trip = await geofenceEngine.startTrip({
        tripId,
        vehicleId,
        pickupLat: Number(pickupLat),
        pickupLong: Number(pickupLong),
        officeLat: Number(officeLat),
        officeLong: Number(officeLong),
      });

      return res.status(201).json({
        message: "Trip started successfully",
        data: trip,
      });
    } catch (error) {
      if (error.message === "Trip already exists") {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  static async manualEndTrip(req, res) {
    try {
      const { tripId, latitude, longitude } = req.body;

      if (!tripId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await geofenceEngine.manualEndTrip({
        tripId,
        latitude: Number(latitude),
        longitude: Number(longitude),
      });

      return res.status(200).json({
        message: "Trip manually ended",
        data: result,
      });
    } catch (error) {
      if (error.message === "Trip not found") {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  static async getTrip(req, res) {
    try {
      const trip = await Trip.findOne({ tripId: req.params.tripId });

      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }

      // ── Return current cab position + static pickup/office coords ──────────
      // VehicleMap.jsx needs pickupLat/Long and officeLat/Long to place the
      // green (start) and red (destination) pins on the map.
      return res.json({
        currentLat:  trip.currentLat,
        currentLong: trip.currentLong,
        status:      trip.status,
        pickupLat:   trip.pickupLat,   // ← needed for green START pin
        pickupLong:  trip.pickupLong,  // ← needed for green START pin
        officeLat:   trip.officeLat,   // ← needed for red DESTINATION pin
        officeLong:  trip.officeLong,  // ← needed for red DESTINATION pin
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getActiveTrip(req, res) {
    try {
      const trip = await Trip.findOne({ status: "IN_PROGRESS" });

      if (!trip) {
        return res.json({});
      }

      return res.json({ tripId: trip.tripId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = TripController;