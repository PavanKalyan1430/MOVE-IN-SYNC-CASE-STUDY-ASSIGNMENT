const Trip = require("../models/Trip");
const AuditLog = require("../models/AuditLog");
const { calculateDistanceInMeters } = require("../utils/haversine");
const NotificationService = require("./NotificationService");

class GeofenceEngine {
  constructor() {
    this.PICKUP_RADIUS_METERS = 70;
    this.OFFICE_RADIUS_METERS = 150;
    this.DWELL_TIME_MS = 30000;
    this.BUFFER_THRESHOLD_MS = 20000;
    this.monitorIntervalRef = null;
  }

  async processLocationUpdate(payload) {
    const { tripId, latitude, longitude, speed, timestamp } = payload;

     console.log(`Vehicle Reached ${tripId}: `, latitude, longitude);

    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (trip.tripCompleted) {
      return {
        tripId,
        status: trip.status,
        message: "Trip already completed",
        pickupDistanceMeters: null,
        officeDistanceMeters: null
      };
    }

    const readingTime = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(readingTime.getTime())) {
      throw new Error("Invalid timestamp format");
    }

    const now = Date.now();
    const lastLocationAtMs = trip.lastLocationAt ? new Date(trip.lastLocationAt).getTime() : null;
    const gapExceeded = lastLocationAtMs && now - lastLocationAtMs > this.BUFFER_THRESHOLD_MS;

    if (gapExceeded) {
      trip.locationBuffer.push({ latitude, longitude, speed, timestamp: readingTime });
    }

    const pickupDistanceMeters = calculateDistanceInMeters(
      latitude,
      longitude,
      trip.pickupLat,
      trip.pickupLong
    );

    const officeDistanceMeters = calculateDistanceInMeters(
      latitude,
      longitude,
      trip.officeLat,
      trip.officeLong
    );

    await this.handlePickupGeofence(trip, pickupDistanceMeters);
    await this.handleOfficeGeofence(trip, officeDistanceMeters, speed, readingTime);


    trip.currentLat = latitude;
    trip.currentLong = longitude;

    trip.lastLocationAt = new Date(now);

    if (!gapExceeded) {
      await this.syncBufferedLocations(trip, {
        latitude,
        longitude,
        speed,
        timestamp: readingTime
      });
    }

    await trip.save();

    return {
      tripId,
      status: trip.status,
      pickupDistanceMeters,
      officeDistanceMeters,
      pickupTriggered: trip.pickupTriggered,
      tripCompleted: trip.tripCompleted,
      bufferedLocations: trip.locationBuffer.length
    };
  }

  async handlePickupGeofence(trip, pickupDistanceMeters) {
    if (pickupDistanceMeters <= this.PICKUP_RADIUS_METERS && !trip.pickupTriggered) {
      trip.pickupTriggered = true;
      NotificationService.sendPickupArrivedNotification(trip.tripId);
    }
  }

  async handleOfficeGeofence(trip, officeDistanceMeters, speed, readingTime) {
    const insideOffice = officeDistanceMeters <= this.OFFICE_RADIUS_METERS;
    const lowSpeed = Number(speed) < 10;

    if (!insideOffice || !lowSpeed || trip.tripCompleted) {
      trip.dwellStartTime = null;
      return;
    }

    if (!trip.dwellStartTime) {
      trip.dwellStartTime = readingTime;
      return;
    }

    const dwellDuration = readingTime.getTime() - new Date(trip.dwellStartTime).getTime();
    if (dwellDuration >= this.DWELL_TIME_MS && !trip.tripCompleted) {
      trip.tripCompleted = true;
      trip.status = "COMPLETED";
      NotificationService.sendTripAutoCompletedNotification(trip.tripId)
    }
  }

  async manualEndTrip({ tripId, latitude, longitude }) {
    const trip = await Trip.findOne({ tripId });

    if (!trip) {
      throw new Error("Trip not found");
    }

    if (!trip.tripCompleted) {
      trip.tripCompleted = true;
      trip.status = "COMPLETED";
    }

    const officeDistanceMeters = calculateDistanceInMeters(
      latitude,
      longitude,
      trip.officeLat,
      trip.officeLong
    );

    if (officeDistanceMeters > this.OFFICE_RADIUS_METERS) {
      await AuditLog.create({
        tripId,
        eventType: "MANUAL_OVERRIDE",
        timestamp: new Date()
      });
    }

    trip.dwellStartTime = null;
    trip.lastLocationAt = new Date();

    await trip.save();

    return {
      tripId,
      status: trip.status,
      tripCompleted: trip.tripCompleted,
      officeDistanceMeters
    };
  }

  async startTrip(payload) {
    const existing = await Trip.findOne({ tripId: payload.tripId });
    if (existing) {
      throw new Error("Trip already exists");
    }

    const trip = await Trip.create({
      ...payload,
      pickupTriggered: false,
      tripCompleted: false,
      dwellStartTime: null,
      status: "IN_PROGRESS",
      lastLocationAt: null,
      locationBuffer: []
    });

    return trip;
  }

  async syncBufferedLocations(trip, currentPoint) {
    if (!trip.locationBuffer || trip.locationBuffer.length === 0) {
      return;
    }

    const pendingCount = trip.locationBuffer.length;
    console.log(`Syncing ${pendingCount} buffered location(s) for trip ${trip.tripId}`);

    trip.locationBuffer = [];

    if (currentPoint) {
      trip.lastLocationAt = new Date();
    }
  }

  async flushExpiredBuffers() {
    const thresholdDate = new Date(Date.now() - this.BUFFER_THRESHOLD_MS);

    const candidates = await Trip.find({
      lastLocationAt: { $lt: thresholdDate },
      locationBuffer: { $exists: true, $ne: [] },
      tripCompleted: false
    });

    for (const trip of candidates) {
      await this.syncBufferedLocations(trip);
      trip.lastLocationAt = new Date();
      await trip.save();
    }
  }

  startBufferMonitor() {
    if (this.monitorIntervalRef) {
      return;
    }

    this.monitorIntervalRef = setInterval(async () => {
      try {
        await this.flushExpiredBuffers();
      } catch (error) {
        console.error("Buffer monitor error:", error.message);
      }
    }, 5000);
  }
}

module.exports = new GeofenceEngine();
