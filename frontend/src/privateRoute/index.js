import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import tokenService from './services/token.service';

const PrivateRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();
    
    useEffect(() => {
        const validateToken = async () => {
            try {
                const jwt = tokenService.getLocalAccessToken();
                
                if (!jwt) {
                    console.log("No token found, redirecting to login");
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
                
                console.log("Token found, validating...");
                const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/auth/validate?token=${jwt}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    // Agregando cache: 'no-store' para evitar cachés
                    cache: 'no-store'
                });
                
                if (!response.ok) {
                    console.log(`Token validation failed with status: ${response.status}`);
                    tokenService.removeUser();
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
                
                const isValid = await response.json();
                console.log(`Token validation result: ${isValid}`);
                
                if (isValid !== true) {
                    console.log("Token is invalid, removing");
                    tokenService.removeUser();
                    setIsAuthenticated(false);
                } else {
                    setIsAuthenticated(true);
                }
                
                setIsLoading(false);
            } catch (error) {
                console.error("Error during token validation:", error);
                // Si hay un error, asumimos que el token es inválido por seguridad
                tokenService.removeUser();
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        };
        
        validateToken();
    }, []);
    
    if (isLoading) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Verificando autenticación...</p>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        console.log(`Redirecting from ${location.pathname} to /login`);
        // Con HashRouter, la redirección debe incluir el state para preservar la URL original
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    return children;
};

export default PrivateRoute;