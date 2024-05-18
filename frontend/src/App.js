import React from "react";
import { Route, Routes } from "react-router-dom";
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
import UserProfile from "./user/profile";
import AboutUs from "./public/others/aboutUs";
import LoginLinkedIn from "./auth/login/LinkedIn/loginLinkedin";

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
  const jwt = tokenService.getLocalAccessToken();
  let roles = []
  if (jwt) {
    roles = getRolesFromJWT(jwt);
  }

  function getRolesFromJWT(jwt) {
    return jwt_decode(jwt).authorities;
  }

  let adminRoutes = <></>;
  let userRoutes = <></>;
  let publicRoutes = <></>;

  roles.forEach((role) => {
    if (role === "ADMIN") {
      adminRoutes = (
        <>
        </>)
    }

  })
  if (!jwt) {
    publicRoutes = (
      <>        
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/papers" exact={true} element={<Papers />} />
        <Route path="/papers/filtered/:search" exact={true} element={<Papers />} />
        <Route path="/papers/:id" exact={true} element={<PaperDetail />} />
        <Route path="/papers/:id/download/:paperFileId" exact={true} element={<PaperDetail />} />
        <Route path="/users/:id" exact={true} element={<UserDetail />} />
        <Route path="/about" exact={true} element={<AboutUs />} />
        <Route path="/linkedInLogin" exact={true} element={<LoginLinkedIn />} />
      </>
    )
  } else {
    userRoutes = (
      <>
        {/* <Route path="/papers" element={<PrivateRoute><Papers /></PrivateRoute>} /> */}        
        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myPapers" exact={true} element={<PrivateRoute><UserPaperList/></PrivateRoute>} />
        <Route path="/myPapers/:id" exact={true} element={<PrivateRoute><UserPaperEdit /></PrivateRoute>} /> 
        <Route path="/myProfile" exact={true} element={<PrivateRoute><UserProfile /></PrivateRoute>} /> 
        <Route path="/papers" exact={true} element={<Papers />} />
        <Route path="/papers/filtered/:search" exact={true} element={<Papers />} />
        <Route path="/papers/:id" exact={true} element={<PaperDetail />} />
        <Route path="/papers/:id/download/:paperFileId" exact={true} element={<PaperDetail />} />
        <Route path="/users/:id" exact={true} element={<UserDetail />} />
        <Route path="/about" exact={true} element={<AboutUs />} />
      </>
    )
  }

  return (
    <div>
      <ErrorBoundary FallbackComponent={ErrorFallback} >
        <AppNavbar />
        <Routes>
          <Route path="/" exact={true} element={<Home />} />
          {publicRoutes}
          {userRoutes}
          {adminRoutes}
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
