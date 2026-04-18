import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import { TestProvider } from './context/TestContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ModeSelection from './pages/ModeSelection';
import TestMode from './pages/TestMode';
import TestHistory from './pages/TestHistory';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <StudyProvider>
        <TestProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><ModeSelection /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/test" element={<ProtectedRoute><TestMode /></ProtectedRoute>} />
                <Route path="/test-history" element={<ProtectedRoute><TestHistory /></ProtectedRoute>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TestProvider>
      </StudyProvider>
    </AuthProvider>
  );
}

export default App;
