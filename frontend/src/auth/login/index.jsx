import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/auth.service';
// Añade otros imports según sea necesario

function Login({ message, navigation = true }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(message || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Obtener la ubicación de redirección desde location.state
    const from = location.state?.from?.pathname || "/";
    
    console.log(`Login component mounted. Will redirect to: ${from} after login`);
    
    // Si estamos usando HashRouter, podemos guardar la URL de origen en sessionStorage
    // como respaldo en caso de que se pierda el state durante la navegación
    useEffect(() => {
        if (location.state?.from?.pathname) {
            sessionStorage.setItem('redirectAfterLogin', location.state.from.pathname);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevenir múltiples envíos
        
        setError('');
        setIsSubmitting(true);
        
        console.log(`Attempting login for user: ${username}`);
        
        try {
            const response = await authService.login(username, password);
            
            if (response && response.token) {
                console.log('Login successful');
                
                // Usar el destino del state o el respaldo de sessionStorage
                const redirectPath = from !== "/" 
                    ? from 
                    : sessionStorage.getItem('redirectAfterLogin') || "/";
                
                console.log(`Redirecting to: ${redirectPath}`);
                
                // Limpiar el respaldo después de usarlo
                sessionStorage.removeItem('redirectAfterLogin');
                
                // Si navigation es falso, no hacer la redirección
                if (navigation) {
                    // Pequeño retraso para asegurar que el token se guardó
                    setTimeout(() => {
                        navigate(redirectPath, { replace: true });
                        // Forzar un refresh de la página para asegurar que el estado de autenticación se actualice
                        window.location.reload();
                    }, 300);
                }
            } else {
                setError('Error en la respuesta del servidor');
                console.error("Unexpected server response:", response);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || err.message || 'Error de autenticación');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-center">Iniciar sesión</h3>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="username" className="form-label">Usuario</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Contraseña</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="d-grid">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Iniciando sesión...
                                            </>
                                        ) : (
                                            'Iniciar sesión'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;