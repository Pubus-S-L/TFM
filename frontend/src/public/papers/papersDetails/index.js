import React from "react";
import { useEffect, useState, useRef } from "react";
import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Link } from "react-router-dom";
import like from "../../../static/images/like.png";
import tokenService from "../../../services/token.service";

export default function PaperDetail() {
    let pathArray = window.location.pathname.split("/");
    const [paper,setPaper] = useState();  
    const [paperId,setPaperId] = useState(pathArray[2]);
    const jwt = JSON.parse(window.localStorage.getItem("jwt"));
    const user = tokenService.getUser();

    function downloadFile(fileId,fileName) {
        fetch(`/api/v1/papers/${paperId}/download/${fileId}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
          })
          .then((blob) => {
            const fileNameHeader = fileName;
            const fileNameMatch = /filename="?([^"]+)"?;?/i.exec(fileNameHeader);
            const suggestedFileName = fileNameMatch ? fileNameMatch[1] : `${fileName}`;
      
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", suggestedFileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
          })
          .catch((error) => {
            console.error("Error downloading file:", error);
          });
      }
      

    async function setUp() {
        try {
            let response = await fetch(`/api/v1/papers/${paperId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let paper = await response.json();
            setPaper(paper);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }
    

    useEffect(() => {
        setUp();
    },);


    async function likePaper(){
        try {
            let response = await fetch(`/api/v1/papers/${user.id}/like/${paperId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }

    return (
        <div className="paper-row">
            <div className="paper-data">
            {paper && (
                <>
            <h4 className="paper-name">{paper.title}</h4>
            <span>
                <strong>Authors:</strong> {paper.authors}
            </span>
            <span>
                <strong>Publication Year:</strong> {paper.publicationYear}
            </span>
            <span>
                <strong>Publisher:</strong> {paper.publisher}
            </span>
            <span>
                <strong>Type:</strong> {paper.type.name}
            </span>
            <span>
                <strong>Abstract:</strong> {paper.abstractContent}
            </span>
            <span>
                <strong>Publication Data:</strong> {paper.publicationData}
            </span>
            <span>
                <strong>Notes:</strong> {paper.notes}
            </span>
            <span>
                <strong>Keywords:</strong> {paper.keywords}
            </span>
            <span>
                <strong>Source:</strong> {paper.source}
            </span>
            <span>
                <strong>Scopus:</strong> {paper.scopus}
            </span>
            <span>
                <strong>Files:</strong>
                {paper.paperFiles && paper.paperFiles.map((paperFile, index) => (
                <><div key={index}>
                    {paperFile.name}
                </div>
                <button
                    onClick={() => downloadFile(paperFile.id, paperFile.name)}
                    className="auth-button blue"
                >
                    Download
                </button></>
                 ))}
            </span>
            <span>
                <strong>User:</strong> {paper.user.firstName + " " + paper.user.lastName}
            </span>
            <div className="paper-options">
                  <Link
                    to={"/users/" + paper.user.id}
                    className="auth-button blue"
                    style={{ textDecoration: "none" }}
                  >
                    View Profile
                  </Link>
                  <button 
                    onClick={() => likePaper()}
                    className="auth-button like"
                    style={{ display: "inline-block"}}
                    >
                    <img src={like} alt="Like" style={{ height: 30, width: 30 }} />
                </button>
                </div>
            </>
            )}
            </div>
        </div>
        );
}
