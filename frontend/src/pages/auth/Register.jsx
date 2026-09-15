import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info('Account registration is done by the librarian only. Scan your QR card to sign in.');
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

export default Register;