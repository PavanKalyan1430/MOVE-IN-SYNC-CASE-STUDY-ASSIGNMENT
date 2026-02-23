const express = require("express");
const LocationController = require("../controllers/LocationController");

const router = express.Router();

router.post("/update", LocationController.updateLocation);

module.exports = router;
