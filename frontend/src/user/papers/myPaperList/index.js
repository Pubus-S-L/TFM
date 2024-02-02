import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link } from "react-router-dom";
import tokenService from "../../../services/token.service";
import { useState, useEffect } from "react";

export default function UserPaperList() {
  let [papers, setPapers] = useState([]);
  let [message, setMessage] = useState(null);
  let [modalShow, setModalShow] = useState(false);

  const user = tokenService.getUser();
  const jwt = tokenService.getLocalAccessToken();

  function removePaper(id) {
    fetch(`/api/v1/papers/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 200) {
          let updatedPapers = [...papers].filter((i) => i.id !== id);
          setPapers(updatedPapers);
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
        setModalShow(true);
      });
  }

  function handleShow() {
    setModalShow(!modalShow);
  }

  async function setUp() {
    let papers = await (
      await fetch(`/api/v1/papers?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      })
    ).json();
    setPapers(papers)
  }

  useEffect(() => {
    setUp();
  }, []);

  return (
    <div>
      {/* <AppNavbar /> */}
      <div className="paper-list-page-container">
        <div className="title-and-add">
          <h1 className="paper-list-title">My Papers</h1>
          <Link
            to="/myPapers/new"
            className="auth-button"
            style={{ textDecoration: "none", marginBottom: "2rem" }}
          >
            Add Paper
          </Link>
        </div>
        {papers.length > 0 ? (
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
                    to={"/myPapers/" + paper.id}
                    className="auth-button blue"
                    style={{ textDecoration: "none" }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => removePaper(paper.id)}
                    className="auth-button danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>Papers not found.</p>
        )}

        <Modal isOpen={modalShow} toggle={handleShow} keyboard={false}>
          <ModalHeader
            toggle={handleShow}
            close={
              <button className="close" onClick={handleShow} type="button">
                &times;
              </button>
            }
          >
            Alert!
          </ModalHeader>
          <ModalBody>{message || ""}</ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleShow}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}
