const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    tripId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ["MANUAL_OVERRIDE"]
    },
    timestamp: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
