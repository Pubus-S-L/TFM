import React from "react";
import { useEffect, useState} from "react";
import "../../../static/css/user/myProfile.css";
import "../../../static/css/auth/authButton.css";
import myGif from './PubUS.gif';

export default function AboutUs() {
    const [company,setCompany] = useState();  

    async function setUp() {
        try {
            let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/company`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let company = await response.json();
            setCompany(company);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }
    

    useEffect(() => {
        setUp();
    },);

    return (
        <div style={{ display: "flex", alignItems: "center", marginTop: "2rem", marginLeft: "2rem" }}>
            <img src={myGif} alt="My GIF" style={{ width: "20%", height: "auto"}} />
            <div className="paper-row" style={{ marginLeft: "1rem", width: "70%" }}>
            <div className="paper-data">
            {company && (
                <>
            <h4 className="paper-name">{company.name}</h4>
            <span>
                <strong>Description:</strong> {company.description}
            </span>
            <span>
                <strong>Phone:</strong> {company.phone}
            </span>
            <span>
                <strong>Email:</strong> {company.email}
            </span>
            <br />
            <span>
                <strong>--Support Data--</strong>
            </span>
            <span>
                <strong>Phone:</strong> {company.supportPhone}
            </span>
            <span>
                <strong>Email:</strong> {company.supportEmail}
            </span>
                </>
                )}
            </div>

            </div>
        </div>
        );
}
