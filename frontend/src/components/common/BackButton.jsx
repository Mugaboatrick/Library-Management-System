import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BackButton = ({ to, label = 'Back', className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const home = to || (user?.role === 'LIBRARIAN' ? '/admin' : user ? '/dashboard' : '/');

  if (location.pathname === home) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(home)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#2d6f2d] border border-[#2d6f2d]/30 shadow-sm text-sm font-semibold hover:bg-green-50 hover:border-[#2d6f2d] transition ${className}`}
    >
      <span aria-hidden="true" className="text-base leading-none"></span> {label}
    </button>
  );
};

export default BackButton;