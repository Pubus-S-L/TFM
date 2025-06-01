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
    if(!registerFormRef.current.validate()) return;
    const request = values;
    request["authority"] = 'user';
    let state = "";

    fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(request),
    })
    .then(function (response) {
      if (response.status === 200) {
        const loginRequest = {
          username: request.username,
          password: request.password,
        };
        fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
          headers: { "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify(loginRequest),
        })
        .then(function (response) {
          if (response.status === 200) {
            state = "200";
            return response.json();
          } else {
            state = "";
            return response.json().then(err => Promise.reject(err.message));
          }
        })
        .then(function (data) {
          if (state !== "200") alert(data.message);
          else {
            tokenService.setUser(data);
            tokenService.updateLocalAccessToken(data.token);
            navigate("/papers");
            window.location.reload();
          }
        })
        .catch((message) => {
          alert(message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  })
  .catch((message) => {
    alert(message);
  });
}

  return(
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