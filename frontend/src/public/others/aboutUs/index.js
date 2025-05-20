import React, { useEffect, useState } from "react";
import "../../../static/css/user/myProfile.css";
import "../../../static/css/auth/authButton.css";
import myGif from "./PubUS.gif";

export default function AboutUs() {
  const [company, setCompany] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/company`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        setCompany(data);
      } catch (error) {
        console.error("Error during data fetching:", error);
      }
    }

    fetchCompanyData();
  }, [API_BASE_URL]);

  return (
    <div className="about-us-container" style={styles.container}>
      <img src={myGif} alt="Company Presentation" style={styles.image} />

      <div className="about-us-info paper-row" style={styles.info}>
        {company ? (
          <div className="paper-data">
            <h4 className="paper-name">{company.name}</h4>

            <p>
              <strong>Description:</strong> {company.description}
            </p>
            <p>
              <strong>Phone:</strong> {company.phone}
            </p>
            <p>
              <strong>Email:</strong> {company.email}
            </p>

            <hr />

            <h5>Support Contact</h5>
            <p>
              <strong>Phone:</strong> {company.supportPhone}
            </p>
            <p>
              <strong>Email:</strong> {company.supportEmail}
            </p>
          </div>
        ) : (
          <p>Loading company information...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: "1.5rem",
    margin: "2rem",
  },
  image: {
    flex: "1 1 250px",
    maxWidth: "300px",
    height: "auto",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  info: {
    flex: "2 1 300px",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
};
