import React, { useState } from 'react';
import tokenService from '../services/token.service';
import Login from '../auth/login';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const location = useLocation();
    return <Navigate to="/login" state={{ from: location }} replace />;
  };

export default PrivateRoute;