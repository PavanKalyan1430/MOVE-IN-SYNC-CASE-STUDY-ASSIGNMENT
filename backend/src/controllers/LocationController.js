const geofenceEngine = require("../services/GeofenceEngine");

class LocationController {
  static async updateLocation(req, res) {
    try {
      const { tripId, latitude, longitude, speed, timestamp } = req.body;

      if (!tripId || latitude === undefined || longitude === undefined || speed === undefined || !timestamp) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await geofenceEngine.processLocationUpdate({
        tripId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: Number(speed),
        timestamp
      });

      return res.status(200).json({
        message: "Location processed",
        data: result
      });
    } catch (error) {
      if (error.message === "Trip not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Invalid timestamp format") {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = LocationController;
