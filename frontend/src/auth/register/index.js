import "../../static/css/auth/authButton.css";
import "../../static/css/auth/authPage.css";
import tokenService from "../../services/token.service";
import FormGenerator from "../../components/formGenerator/formGenerator";
import { registerFormInputs } from "./form/registerFormInputs";
import { useRef } from "react";
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const registerFormRef = useRef();   
  const navigate = useNavigate();   
  
  async function handleSubmit({ values }) {

    if(!registerFormRef.current.validate()) return;
    const request = values;
    request["authority"] = 'user';
    let state = "";

    fetch("https://tfm-m1dn.onrender.com/api/v1/auth/signup", {
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
        fetch("https://tfm-m1dn.onrender.com/api/v1/auth/signin", {
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
            return response.json();
          }
        })
        .then(function (data) {
          if (state !== "200") alert(data.message);
          else {
            tokenService.setUser(data);
            tokenService.updateLocalAccessToken(data.token);
            navigate(0);
          }
        })
        .catch((message) => {
          alert(message);
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
            buttonText="Save"
            buttonClassName="auth-button"
          />
        </div>
      </div>
    );

  }