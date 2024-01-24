import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Papers() {
  let [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // let [search, setSearch] = useState("");
  // const datos = e=>
  //   e.preventDefault()
  //   fetch(`/api/v1/papers/filtered/${search}`)
  //   .then(response => response.json())
  //   .then(data => {
  //       setPapers(data)
  //   })

  //   const changeState = e =>{
  //     setSearch(e.target.value)
  //   }


  async function setUp() {
    let papers = await (
      await fetch(`/api/v1/papers?search=${searchTerm}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();
    setPapers(papers)
  }

  useEffect(() => {
    setUp();
  },  [searchTerm]);

  return (
    <div>
      {/* <AppNavbar /> */}
      <div className="paper-list-page-container">
        <div className="title-and-add">
          <h1 className="paper-list-title">Papers</h1>
        </div>
        <input
          type="text"
          placeholder="Search papers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {papers && papers.length > 0 ? (
          papers.map((paper) => {
            return (
              <div key={paper.id} className="paper-row">
                <div className="paper-data">
                  <h4 className="paper-name">{paper.title}</h4>
                  <span>
                    <strong>Authors:</strong> {paper.authors}
                  </span>
                  <span>
                    <strong>Publication Year:</strong> {paper.publicationYear}
                  </span>
                  <span>
                    <strong>Type:</strong> {paper.type.name}
                  </span>
                </div>
                <div className="paper-options">
                  <Link
                    to={"/papers/" + paper.id}
                    className="auth-button blue"
                    style={{ textDecoration: "none" }}
                  >
                    Details
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <p>No papers found</p>
        )}
      </div>
    </div>
  );
}
