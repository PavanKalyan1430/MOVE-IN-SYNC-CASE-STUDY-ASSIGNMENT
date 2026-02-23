const express = require("express");
const TripController = require("../controllers/TripController");

const router = express.Router();

router.post("/start", TripController.startTrip);
router.post("/manual-end", TripController.manualEndTrip);
router.get("/active", TripController.getActiveTrip);
router.get("/:tripId", TripController.getTrip);

module.exports = router;
