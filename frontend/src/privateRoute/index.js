import React, { useState, useEffect } from 'react';
import tokenService from '../services/token.service';
import { Navigate, useLocation } from 'react-router-dom';
import Login from '../auth/login';

const PrivateRoute = ({ children }) => {
  const jwt = tokenService.getLocalAccessToken();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [message, setMessage] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const validateToken = async () => {
      setIsLoading(true);
      if (jwt) {
        try {
          const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/auth/validate?token=${jwt}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
          const data = await response.json();
          setIsAuthenticated(data);
          setIsLoading(false);
        } catch (error) {
          console.error("Error validating token:", error);
          setMessage("There was an error validating your session. Please log in again.");
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
        setMessage(null); // No hay token, no hay mensaje específico de expiración
      }
    };

    validateToken();
  }, [jwt]); // Dependencia en jwt para re-ejecutar si el token cambia

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated === true) {
    return children;
  } else {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
};

export default PrivateRoute;