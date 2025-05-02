import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { ErrorBoundary } from "react-error-boundary";
import AppNavbar from "./AppNavbar";
import Home from "./home";
import Register from "./auth/register";
import Login from "./auth/login";
import Logout from "./auth/logout";
import Papers from "./public/papers/papersList";
import PaperDetail from "./public/papers/papersDetails";
import tokenService from "./services/token.service";
import PrivateRoute from "./privateRoute";
import UserPaperEdit from "./user/papers/myPaperEdit";
import {UserPaperList} from "./user/papers/myPaperList";
import UserDetail from "./public/users";
import Profile from "./user/profile/page";
import SwaggerDocs from "./public/swagger";
import AboutUs from "./public/others/aboutUs";
import LoginLinkedIn from "./auth/login/LinkedIn/loginLinkedin";
import UserListAdmin from "./admin/users/UserListAdmin";
import UserEditAdmin from "./admin/users/UserEditAdmin";
import ChatList from "./public/users/room";
import "./styles/globals.css";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

function App() {
  // Usar useState para manejar el token y roles de forma reactiva
  const [jwt, setJwt] = useState(tokenService.getLocalAccessToken());
  const [roles, setRoles] = useState([]);
  
  // Efecto para actualizar los roles cuando cambia el token
  useEffect(() => {
    if (jwt) {
      try {
        setRoles(getRolesFromJWT(jwt));
      } catch (error) {
        console.error("Error decoding JWT:", error);
        // Limpiar token inválido
        tokenService.removeUser();
        setJwt(null);
        setRoles([]);
      }
    } else {
      setRoles([]);
    }
  }, [jwt]);
  
  // Efecto para escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const currentToken = tokenService.getLocalAccessToken();
      if (currentToken !== jwt) {
        setJwt(currentToken);
      }
    };
    
    // Verificar el token cada 5 segundos para detectar cambios
    const interval = setInterval(handleStorageChange, 5000);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
  }, [jwt]);

  function getRolesFromJWT(token) {
    if (!token) return [];
    try {
      return jwt_decode(token).authorities || [];
    } catch (e) {
      console.error("Error decoding token:", e);
      return [];
    }
  }

  let adminRoutes = <></>;
  let userRoutes = <></>;
  let publicRoutes = <></>;

  // Construir rutas de administrador si el usuario tiene el rol
  const isAdmin = roles.some(role => role === "ADMIN");
  if (isAdmin) {
    adminRoutes = (
      <>
      <Route path="/users" element={<PrivateRoute><UserListAdmin /></PrivateRoute>} />
      <Route path="/users/:username" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
      </>
    );
  }

  // Rutas públicas si no hay token
  if (!jwt) {
    publicRoutes = (
      <>        
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/papers/filtered/:search" element={<Papers />} />
        <Route path="/papers/:id" element={<PaperDetail />} />
        <Route path="/papers/:id/download/:paperFileId" element={<PaperDetail />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/linkedInLogin" element={<LoginLinkedIn />} />
        {/* Redireccionar rutas protegidas al login */}
        <Route path="/myPapers" element={<Navigate to="/login" />} />
        <Route path="/myPapers/:id" element={<Navigate to="/login" />} />
        <Route path="/myProfile" element={<Navigate to="/login" />} />
        <Route path="/chats" element={<Navigate to="/login" />} />
      </>
    );
  } else {
    // Rutas para usuarios autenticados
    userRoutes = (
      <>       
        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myPapers" element={<PrivateRoute><UserPaperList/></PrivateRoute>} />
        <Route path="/myPapers/:id" element={<PrivateRoute><UserPaperEdit /></PrivateRoute>} /> 
        <Route path="/myProfile" element={<PrivateRoute><Profile /></PrivateRoute>} /> 
        <Route path="/papers" element={<Papers />} />
        <Route path="/papers/filtered/:search" element={<Papers />} />
        <Route path="/papers/:id" element={<PaperDetail />} />
        <Route path="/papers/:id/download/:paperFileId" element={<PaperDetail />} />
        <Route path="/admin/users/:id" element={<UserEditAdmin />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/chats" element={<PrivateRoute><ChatList /></PrivateRoute>} />
      </>
    );
  }

  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AppNavbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<SwaggerDocs />} />
          {publicRoutes}
          {userRoutes}
          {adminRoutes}
          {/* Ruta catch-all para manejar URLs no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;