import React from "react";
import "../../../static/css/user/myProfile.css";
import "../../../static/css/auth/authButton.css";

export default function AboutUs() {

    const title = "About us"
    const telefono = "958426315"
    
    return (
            <div className="paper-data">
            <h4 className="paper-name">{title}</h4>
            <span>
                <strong>Studies:</strong> {telefono}
            </span>
            <span>
                <strong>Job:</strong> {}
            </span>
            </div>
        );
}
