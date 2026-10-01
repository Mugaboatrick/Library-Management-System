import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Spinner from './components/common/Spinner';

import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import Register from './pages/auth/Register';
import Landing from './pages/Landing';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminBooks from './pages/admin/Books';
import AdminBorrow from './pages/admin/Borrow';
import AdminBorrowings from './pages/admin/Borrowings';
import AdminFines from './pages/admin/Fines';
import AdminEbooks from './pages/admin/Ebooks';
import AdminReports from './pages/admin/Reports';
import AdminQRCards from './pages/admin/QRCards';
import AdminCategories from './pages/admin/Categories';
import AdminMembers from './pages/admin/Members';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';

import UserDashboard from './pages/UserDashboard';
import RecentActivity from './pages/RecentActivity';
import BrowseBooks from './pages/BrowseBooks';
import MyFines from './pages/MyFines';
import MyEbooks from './pages/MyEbooks';
import EReader from './pages/EReader';
import MyQRCode from './pages/MyQRCode';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'LIBRARIAN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/books" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminBooks /></ProtectedRoute>} />
      <Route path="/admin/borrow" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminBorrow /></ProtectedRoute>} />
      <Route path="/admin/borrowings" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminBorrowings /></ProtectedRoute>} />
      <Route path="/admin/fines" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminFines /></ProtectedRoute>} />
      <Route path="/admin/ebooks" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminEbooks /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/qr-cards" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminQRCards /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminCategories /></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute roles={['LIBRARIAN']}><AdminMembers /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute roles={['LIBRARIAN']}><Messages /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute roles={['LIBRARIAN']}><Notifications /></ProtectedRoute>} />

      {/* Shared user routes */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/recent-activity" element={<ProtectedRoute roles={['STUDENT']}><RecentActivity /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><BrowseBooks /></ProtectedRoute>} />
      <Route path="/my-fines" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><MyFines /></ProtectedRoute>} />
      <Route path="/reader" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><MyEbooks /></ProtectedRoute>} />
      <Route path="/reader/:id" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST','LIBRARIAN']}><EReader /></ProtectedRoute>} />
      <Route path="/my-qr" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><MyQRCode /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><Messages /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute roles={['STUDENT','TEACHER','GUEST']}><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['LIBRARIAN','STUDENT','TEACHER','GUEST']}><Settings /></ProtectedRoute>} />
      <Route path="/welcome" element={<ProtectedRoute roles={['LIBRARIAN','STUDENT','TEACHER','GUEST']}><Welcome /></ProtectedRoute>} />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
