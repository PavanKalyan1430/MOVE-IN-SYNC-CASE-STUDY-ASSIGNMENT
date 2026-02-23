const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const geofenceEngine = require("./services/GeofenceEngine");

dotenv.config();

async function startServer() {
  await connectDB();

  geofenceEngine.startBufferMonitor();

  app.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
