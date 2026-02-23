
const cors = require("cors");
const express = require("express");

const tripRoutes = require("./routes/tripRoutes");
const locationRoutes = require("./routes/locationRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

app.use("/trip", tripRoutes);
app.use("/location", locationRoutes);
app.use("/auth", authRoutes);

module.exports = app;
