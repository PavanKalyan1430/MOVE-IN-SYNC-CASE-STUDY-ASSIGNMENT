# 🚗 MOVEINSYNC
### Vehicle Tracking & Geofence-Based Auto Trip Closure System

---

## 📌 Project Overview
A real-time vehicle tracking system that automatically detects trip start and trip completion using geofence-based logic.

The system simulates vehicle movement across predefined routes and continuously monitors the vehicle's live location. Based on the vehicle’s entry into pickup and drop geofence zones, the backend automatically updates the trip status without requiring any manual intervention.

The frontend map interface displays the real-time vehicle movement for the currently active trip by fetching data from the backend API.

---

## 🎯 Objective
- Track vehicle movement in real time
- Automatically start a trip when vehicle enters pickup geofence
- Automatically close a trip when vehicle enters destination geofence
- Manage multiple trips dynamically using simulator
- Provide live vehicle position to frontend map interface

---

## 🧱 Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Frontend
- JavaScript
- Vite
- OpenLayers

---

## ⚙️ System Workflow
1. Trip is created with Pickup Location, Drop Location and Geofence Radius.
2. Simulator generates vehicle movement coordinates along route.
3. Backend continuously checks vehicle entry into pickup and drop geofence.
4. Pickup Entry → Trip Status becomes Started.
5. Drop Entry → Trip Status becomes Completed.
6. Frontend fetches /trip/active API to display live trip movement.

---

## 📍 Geofence Logic
A geofence is a virtual boundary defined using Latitude, Longitude and Radius.

If the vehicle's real-time location lies within the defined geofence boundary, backend automatically triggers:
- Trip Start
- Trip Completion

This removes the need for manual trip updates.

---

## 🚀 Run Locally

### Clone Repository
git clone https://github.com/PavanKalyan1430/MOVE-IN-SYNC-CASE-STUDY-ASSIGNMENT.git
cd MOVE-IN-SYNC-CASE-STUDY-ASSIGNMENT

### Setup Backend
cd backend
npm install
npm start

### Setup Frontend (Open new terminal)
cd frontend
npm install
npm run dev

### Environment Variables
Create a .env file inside backend folder and add:
MONGO_URI=your_mongodb_connection_string
PORT=5000

---

## 📡 API Endpoint

Method | Endpoint      | Description
GET    | /trip/active  | Fetch currently active trip

---

## 🧪 Use Cases
- Employee Transportation Systems
- Logistics Fleet Tracking
- Ride Sharing Automation
- Delivery Monitoring

---

## 📈 Future Enhancements
- Real GPS Device Integration
- Admin Dashboard
- Trip Analytics
- Route Optimization
- Notification System

---

## 👨‍💻 Author
Pavan Kalyan
