🚗 MOVEINSYNC – Vehicle Tracking & Geofence-Based Auto Trip Closure System
📌 Project Description

This project is a real-time vehicle tracking system designed to automatically detect trip start and trip completion using geofence-based logic.

The system simulates vehicle movement across predefined routes and continuously monitors the vehicle's live location. Based on the vehicle's entry into pickup and drop geofence zones, the backend automatically updates the trip status without requiring any manual intervention.

The frontend map interface displays the real-time vehicle movement for the currently active trip by fetching data from the backend API.

🎯 Objective

To develop a backend-driven system that can:

Track vehicle movement in real time

Automatically start a trip when the vehicle enters the pickup geofence

Automatically close a trip when the vehicle enters the destination geofence

Manage multiple trips dynamically using a simulator

Provide live vehicle position to the frontend map interface

🧱 Tech Stack Used
🔹 Backend

Node.js

Express.js

MongoDB

Mongoose

Handles:

Trip creation and storage

Active trip detection

Vehicle movement simulation

Geofence entry checks

Trip state transitions

Automatic trip closure logic

🔹 Frontend

JavaScript

Vite

OpenLayers

Displays:

Real-time vehicle movement

Currently active trip

Route simulation

Pickup and Drop geofence interactions

⚙️ System Workflow

A trip is created with:

Pickup location

Drop location

Geofence radius

A simulator generates vehicle coordinates along the trip route.

Backend continuously checks:

Whether the vehicle has entered the pickup geofence

Whether the vehicle has entered the drop geofence

When the vehicle enters:

Pickup Geofence → Trip status changes to Started

Drop Geofence → Trip status changes to Completed

Frontend fetches the /trip/active API to display the live movement of the active trip on the map.

📍 Geofence Logic

A geofence is a virtual boundary defined using:

Latitude

Longitude

Radius

If the real-time vehicle location lies within the defined geofence radius, the backend triggers an event such as:

Trip Start

Trip Completion

This removes the need for manual trip updates.

🚀 Running the Project Locally
1️⃣ Clone the Repository
git clone https://github.com/PavanKalyan1430/MOVE-IN-SYNC-CASE-STUDY-ASSIGNMENT.git
cd MOVE-IN-SYNC-CASE-STUDY-ASSIGNMENT
2️⃣ Setup Backend
cd backend
npm install
npm start
3️⃣ Setup Frontend

Open a new terminal:

cd frontend
npm install
npm run dev
4️⃣ Environment Variables

Create a .env file inside the backend folder and add:

MONGO_URI=your_mongodb_connection_string
PORT=5000
📡 API Endpoint
Method	Endpoint	Description
GET	/trip/active	Fetch currently active trip
🧪 Use Cases

Employee transportation tracking

Logistics fleet management

Ride-sharing automation

Delivery vehicle monitoring

📈 Future Enhancements

Real GPS device integration

Admin dashboard

Trip analytics

Route optimization

Alert and notification system

👨‍💻 Author

Pavan Kalyan
