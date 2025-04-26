import React, { useState, useEffect } from "react";
import { Alert } from "reactstrap";
import tokenService from "../../../services/token.service";
import "../../../static/css/auth/authButton.css";

export default function LoginLinkedIn() {
    const [message, setMessage] = useState(null)
    useEffect(() => {
      const url = window.location.href;
      const params = new URLSearchParams(new URL(url).search);
      const code = params.get("code");

        if (code) {
          loginLinkedIn(code);
        } else {
          setMessage("Authorization code not found.");
        }

    // Escucha mensajes de LinkedInCallback
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data.from === "Linked In") {
        if (data.error) {
          setMessage(data.errorMessage);
        } else {
          loginLinkedIn(data.code);
        }
      }
      });
    }, []);
    
      async function loginLinkedIn(code) {
        const reqBody = { code };
        setMessage(null);
        try {
          const response = await fetch("https://tfm-m1dn.onrender.com/api/v1/auth/loginLinkedIn", {
            headers: { "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify(reqBody),
          });
          if (response.status === 200) {
            const data = await response.json();
            tokenService.setUser(data);
            tokenService.updateLocalAccessToken(data.token);
            window.opener.location.href = "/papers";
            window.close();
          } else {
            throw new Error("Invalid login attempt");
          }
        } catch (error) {
          setMessage(error.message);
          window.close();
        }
      }
    
      return (
        <div className="auth-page-container">
          {message ? <Alert color="danger">{message}</Alert> : null}
          <h1>You are signing in Pubus</h1>
        </div>
      );
    }