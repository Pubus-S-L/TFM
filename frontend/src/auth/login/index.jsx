import React, { useState } from "react";
import { Alert, Spinner } from "reactstrap";
import FormGenerator from "../../components/formGenerator/formGenerator";
import tokenService from "../../services/token.service";
import "../../static/css/auth/authButton.css";
import { loginFormInputs } from "./form/loginFormInputs";
import { useLinkedIn } from "./LinkedIn/useLinkedIn.tsx";
import linkedin from "./LinkedIn/linkedin.png";
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [message, setMessage] = useState(null)
  const loginFormRef = React.createRef();
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { linkedInLogin } = useLinkedIn({
    clientId: "77bspiilcaqccb",
    redirectUri: `${API_BASE_URL}/linkedInLogin`,    
    onSuccess: loginLinkedIn, // Aquí pasas la función loginLinkedIn como callback de onSuccess
    onError: (error) => {
      console.log(error);
    },  
  });

  async function loginLinkedIn(code) {
    const reqBody = { code }; // Aquí estás creando el cuerpo de la solicitud con el código de autorización
    setMessage(null);
    await fetch(`${API_BASE_URL}/api/v1/auth/loginLinkedIn`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(reqBody),
    })
      .then(function (response) {
        if (response.status === 200) return response.json();
        else return Promise.reject("Invalid login attempt");
      })
      .then(function (data) {
        tokenService.setUser(data);
        tokenService.updateLocalAccessToken(data.token);
        navigate("/papers");
      })
      .catch((error) => {         
        setMessage(error);
      });            
  }
  async function handleSubmit({ values }) {

    const reqBody = values;
    setMessage(null);
    setLoading(true);
    await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(reqBody),
    })
      .then(function (response) {
        if (response.status === 200) return response.json();
        else return response.json().then(err => Promise.reject(err.message));
      })
      .then(function (data) {
        tokenService.setUser(data);
        tokenService.updateLocalAccessToken(data.token);
        navigate("/papers");
        window.location.reload();
      })
      .catch((error) => {         
        setMessage(error);
      }) 
      .finally(() => {
        setLoading(false);
      });     
  }

    return (
      <div className="auth-page-container">
        {message ? (
          <Alert color="primary">{message}</Alert>
        ) : (
          <></>
        )}

        <h1>Login</h1>

        <div className="auth-form-container">
          <FormGenerator
            ref={loginFormRef}
            inputs={loginFormInputs}
            onSubmit={handleSubmit}
            numberOfColumns={1}
            listenEnterKey
            buttonText={loading ? <Spinner size="sm" /> : "Login"}
            buttonClassName="auth-button"
            buttonDisabled={loading}
          />
        </div>
        {/* <img
          onClick={linkedInLogin}
          src={linkedin}
          alt="Sign in with LinkedIn"
          style={{marginTop: '2rem', maxWidth: '180px', cursor:'pointer'}}
        /> */}
      </div>
    );  
}