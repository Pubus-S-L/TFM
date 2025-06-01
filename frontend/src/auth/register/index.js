import "../../static/css/auth/authButton.css";
import "../../static/css/auth/authPage.css";
import tokenService from "../../services/token.service";
import FormGenerator from "../../components/formGenerator/formGenerator";
import { registerFormInputs } from "./form/registerFormInputs";
import { useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Spinner } from "reactstrap";

export default function Register() {
  const registerFormRef = useRef();   
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL;   
  
  async function handleSubmit({ values }) {
    setLoading(true);

    if (!registerFormRef.current.validate()) {
      setLoading(false);
      return;
    }

    const request = { ...values, authority: 'user' };

    try {
      // Signup request
      const signupResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(request),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        alert(signupData.message || "Signup failed");
        setLoading(false);
        return;
      }

      // Login request
      const loginRequest = {
        username: request.username,
        password: request.password,
      };

      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify(loginRequest),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        alert(loginData.message || "Login failed");
        setLoading(false);
        return;
      }

      // Set user token and navigate
      tokenService.setUser(loginData);
      tokenService.updateLocalAccessToken(loginData.token);
      navigate("/papers");
      window.location.reload();

    } catch (error) {
      alert(error.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-container">
      <h1>Register</h1>
      <div className="auth-form-container">
        <FormGenerator
          ref={registerFormRef}
          inputs={registerFormInputs}
          onSubmit={handleSubmit}
          numberOfColumns={1}
          listenEnterKey
          buttonText={loading ? <Spinner size="sm" /> : "Save"}
          buttonClassName="auth-button"
          buttonDisabled={loading}
        />
      </div>
    </div>
  );
}
