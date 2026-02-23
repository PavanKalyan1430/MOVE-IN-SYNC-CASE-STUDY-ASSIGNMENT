const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, unique: true, index: true },
    vehicleId: { type: String, required: true, index: true },

    pickupLat: { type: Number, required: true },
    pickupLong: { type: Number, required: true },

    officeLat: { type: Number, required: true },
    officeLong: { type: Number, required: true },

    //  LIVE VEHICLE TRACKING FIELDS
    currentLat: { type: Number, default: null },
    currentLong: { type: Number, default: null },

    pickupTriggered: { type: Boolean, default: false },
    tripCompleted: { type: Boolean, default: false },

    dwellStartTime: { type: Date, default: null },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED"],
      default: "IN_PROGRESS"
    },

    lastLocationAt: { type: Date, default: null },

    locationBuffer: {
      type: [
        {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          speed: { type: Number, required: true },
          timestamp: { type: Date, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);