import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Booking from './pages/Booking'
import Confirmation from './pages/Confirmation'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import TechDashboard from './pages/TechDashboard'
import { initializeData } from './utils/data'

// Initialize local storage defaults
initializeData();

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="book" element={<Booking />} />
            <Route path="confirmation" element={<Confirmation />} />

            {/* Auth Pages */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            {/* Protected Pages */}
            <Route path="dashboard" element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } />

            <Route path="tech-dashboard" element={
              <ProtectedRoute role="tech">
                <TechDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
