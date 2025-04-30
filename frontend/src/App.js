import React from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
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
  // Obtener token de manera segura
  const jwt = tokenService.getLocalAccessToken();
  
  // Preparar roles con manejo de errores
  let roles = [];
  
  if (jwt) {
    try {
      const decoded = jwt_decode(jwt);
      roles = decoded.authorities || [];
    } catch (error) {
      console.error("Error decodificando JWT:", error);
    }
  }

  // Verificar si el usuario es admin
  const isAdmin = roles.includes("ADMIN");

  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter>
          <AppNavbar />
          <Routes>
            {/* Rutas públicas comunes */}
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<SwaggerDocs />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/papers/filtered/:search" element={<Papers />} />
            <Route path="/papers/:id" element={<PaperDetail />} />
            <Route path="/papers/:id/download/:paperFileId" element={<PaperDetail />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/linkedInLogin" element={<LoginLinkedIn />} />
            
            {/* Rutas solo para usuarios autenticados */}
            <Route path="/logout" element={<PrivateRoute><Logout /></PrivateRoute>} />
            <Route path="/myPapers" element={<PrivateRoute><UserPaperList /></PrivateRoute>} />
            <Route path="/myPapers/:id" element={<PrivateRoute><UserPaperEdit /></PrivateRoute>} />
            <Route path="/myProfile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/chats" element={<PrivateRoute><ChatList /></PrivateRoute>} />
            
            {/* Rutas solo para administradores */}
            {isAdmin && (
              <>
                <Route path="/users" element={<PrivateRoute><UserListAdmin /></PrivateRoute>} />
                <Route path="/users/:username" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
                <Route path="/admin/users/:id" element={<PrivateRoute><UserEditAdmin /></PrivateRoute>} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;