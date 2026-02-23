# Real-Time Vehicle Tracking Backend

## Setup

1. Install dependencies:
   npm install
2. Start MongoDB locally (default URI in `.env`).
3. Run server:
   npm run dev

## APIs

### Start Trip
POST `/trip/start`

Sample body:
{
  "tripId": "TRIP-1001",
  "vehicleId": "VEH-01",
  "pickupLat": 12.9716,
  "pickupLong": 77.5946,
  "officeLat": 12.9352,
  "officeLong": 77.6245
}

### Update Location
POST `/location/update`

Sample body:
{
  "tripId": "TRIP-1001",
  "latitude": 12.9717,
  "longitude": 77.5947,
  "speed": 8,
  "timestamp": "2026-02-20T08:30:00.000Z"
}

### Manual End Trip
POST `/trip/manual-end`

Sample body:
{
  "tripId": "TRIP-1001",
  "latitude": 12.9717,
  "longitude": 77.5947
}

## Notes
- Pickup geofence radius: 70m.
- Office geofence radius: 150m.
- Dwell time for auto-completion: 30s at speed < 10.
- Location gaps > 20s are buffered and synced when updates resume.
- Notifications are simulated using console logs.
