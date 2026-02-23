import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage.jsx";
import VehicleMap from "./vehicleMap.jsx";

// Guard: if no token in localStorage, redirect to /login
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route — login/register */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected route — only accessible after login */}
        <Route
          path="/map"
          element={
            <PrivateRoute>
              <VehicleMap />
            </PrivateRoute>
          }
        />

        {/* Default: redirect root to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}