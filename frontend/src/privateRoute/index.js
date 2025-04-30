import React, { useState, useEffect } from 'react';
import tokenService from '../services/token.service';
import Login from '../auth/login';

const PrivateRoute = ({ children }) => {
    const jwt = tokenService.getLocalAccessToken();
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Si no hay token, no hace falta hacer la petición
        if (!jwt) {
            setIsLoading(false);
            setIsValid(false);
            setMessage("Please sign in to access this page.");
            return;
        }
        
        // Validar el token contra el servidor
        const validateToken = async () => {
            try {
                const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/auth/validate?token=${jwt}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                });
                
                const result = await response.json();
                setIsValid(result);
                
                if (!result) {
                    setMessage("Your token has expired. Please, sign in again.");
                    // Si el token no es válido, limpiarlo del almacenamiento
                    tokenService.removeUser();
                }
            } catch (error) {
                console.error("Error validating token:", error);
                setIsValid(false);
                setMessage("Error validating your session. Please sign in again.");
                tokenService.removeUser();
            } finally {
                setIsLoading(false);
            }
        };
        
        validateToken();
    }, [jwt]); // Este efecto se ejecuta solo cuando el JWT cambia

    // Si no hay token, mostrar login directamente
    if (!jwt) {
        return <Login message={message || "Please sign in to access this page."} navigation={false} />;
    }

    // Mostrar indicador de carga mientras se valida
    if (isLoading) {
        return <div className="loading-container">
            <div className="spinner"></div>
            <p>Validating your session...</p>
        </div>;
    }
    
    // Mostrar componente hijo o redireccionar a login según la validación
    return isValid ? children : <Login message={message} navigation={true} />;
};

export default PrivateRoute;