import React from "react";
import { useEffect, useState, useRef } from "react";
import "../../static/css/user/myPaperList.css";
import "../../static/css/auth/authButton.css";
import { Link } from "react-router-dom";
export default function UserDetail() {
    let pathArray = window.location.pathname.split("/");
    const [user,setUser] = useState();  
    const [userId,setUserId] = useState(pathArray[2]);
    const [papers,setPapers] = useState([]);      

    async function setUp() {
        try {
            let response = await fetch(`/api/v1/users/${userId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let user = await response.json();
            setUser(user);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }
    

    useEffect(() => {
        setUp();
    },);


    async function setUpPapers() {
        try {
            let response = await fetch(`/api/v1/papers/users/${userId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let papers = await response.json();
            setPapers(papers);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }

    useEffect(() => {
        setUpPapers();
    },);

    return (
        <div className="paper-row">
            <div className="paper-data">
            {user && (
                <>
            <h4 className="paper-name">{user.firstName+ " "+ user.lastName}</h4>
            <span>
                <strong>Studies:</strong> {user.studies}
            </span>
            <span>
                <strong>Job:</strong> {user.job}
            </span>
            <span>
                <strong>Papers:</strong>
                {papers && papers.length > 0 ? (papers.map((paper) => {
                return (
                <div key={paper.id} className="paper-row">
                    <div className="paper-data">
                    <h4 className="paper-name">{paper.title}</h4>
                    </div>
                    <div className="paper-options">
                    <Link
                        to={"/papers/" + paper.id}
                        className="auth-button blue"
                        style={{ textDecoration: "none" }}
                    >
                        View Paper
                    </Link>
                    </div>
                </div>
                );
            })
            ) : (
            <p>No papers found</p>
            )}
                </span>
                </>
                )}
            </div>
        </div>
        );
}
