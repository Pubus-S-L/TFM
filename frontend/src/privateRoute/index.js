import React from 'react';
import { Navigate } from 'react-router-dom';
import tokenService from '../services/token.service';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!tokenService.getLocalAccessToken();
  
  // Redirige al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default PrivateRoute;