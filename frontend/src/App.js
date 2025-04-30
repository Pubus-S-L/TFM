import React from "react";
import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
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
const AdminRoute = ({ children }) => {
  const jwt = tokenService.getLocalAccessToken();
  if (!jwt) return <Navigate to="/login" />;
  
  try {
    const decodedToken = jwt_decode(jwt);
    const isAdmin = decodedToken.authorities && 
                decodedToken.authorities.includes('ADMIN');
    return isAdmin ? children : <Navigate to="/" />;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return <Navigate to="/" />;
  }
};

function App() {
  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter>
          <AppNavbar />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<SwaggerDocs />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/papers/filtered/:search" element={<Papers />} />
            <Route path="/papers/:id" element={<PaperDetail />} />
            <Route path="/papers/:id/download/:paperFileId" element={<PaperDetail />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/linkedInLogin" element={<LoginLinkedIn />} />
            <Route path="/chats" element={<ChatList />} />

            {/* Rutas privadas para usuarios autenticados */}
            <Route path="/myPapers" element={<PrivateRoute><UserPaperList /></PrivateRoute>} />
            <Route path="/myPapers/:id" element={<PrivateRoute><UserPaperEdit /></PrivateRoute>} />
            <Route path="/myProfile" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Rutas privadas para administradores */}
            <Route path="/users" element={<AdminRoute><UserListAdmin /></AdminRoute>} />
            <Route path="/users/:username" element={<AdminRoute><UserEditAdmin /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><UserEditAdmin /></AdminRoute>} />
            
            {/* Manejo de rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}
export default App;
