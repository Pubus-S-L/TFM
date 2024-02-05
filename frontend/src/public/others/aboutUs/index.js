import React from "react";
import { useEffect, useState} from "react";
import "../../../static/css/user/myProfile.css";
import "../../../static/css/auth/authButton.css";

export default function AboutUs() {
    const [company,setCompany] = useState();  

    async function setUp() {
        try {
            let response = await fetch(`/api/v1/company`, {
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
        <div className="paper-row">
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
        );
}
