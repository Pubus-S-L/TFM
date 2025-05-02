import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import tokenService from '../services/token.service';

const PrivateRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const location = useLocation();
    
    useEffect(() => {
        const validateToken = async () => {
            const jwt = tokenService.getLocalAccessToken();
            
            if (!jwt) {
                setIsLoading(false);
                setIsValid(false);
                return;
            }
            
            try {
                const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/auth/validate?token=${jwt}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                });
                
                const data = await response.json();
                setIsValid(data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error validating token:", error);
                setIsValid(false);
                setIsLoading(false);
            }
        };
        
        validateToken();
    }, []);
    
    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    if (!isValid) {
        // Redirigir al login con state para recordar la página intentada
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

export default PrivateRoute;