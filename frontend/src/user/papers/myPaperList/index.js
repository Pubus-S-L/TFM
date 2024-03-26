import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link, json } from "react-router-dom";
import tokenService from "../../../services/token.service";
import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';

let exportTitles = []

  function UserPaperList() {
  let [papers, setPapers] = useState([]);
  let [message, setMessage] = useState(null);
  let [modalShow, setModalShow] = useState(false);
  let [jsonData, setJsonData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const user = tokenService.getUser();
  const jwt = tokenService.getLocalAccessToken();
  const inputFileRef = useRef(null);

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

  async function handleImportExcel(event){
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const dataJson = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

      setJsonData(dataJson)

    };
    reader.readAsArrayBuffer(file);
  }

  console.log(jsonData);

  async function setUpFiles(){
    if (!jsonData) {
      return; // Si jsonData es null, no proceder
    }
      await fetch(`/api/v1/papers/importPaper/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData),
    })
    .then((response) => {
      if (response.status === 200) {
      }else {
        throw new Error("Invalid Excel");
      }
      return response.json();
    })
    .then((data) => {
      window.location.href = `/myPapers`;
      // setMessage(data.message);
      // setModalShow(true);

    });
    };

useEffect(() => {
  if (jsonData) {
    setUpFiles();
  }
}, [jsonData]);


  const handleSubmit = (event) => {
    event.preventDefault();
    // Aquí puedes hacer algo con el término de búsqueda, como enviarlo a una API
    console.log("Se realizó la búsqueda:", searchTerm);
  };

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  function importPaperByDOI(searchTerm) {
    const params = new URLSearchParams({ searchTerm: searchTerm });
    fetch(`/api/v1/papers/${user.id}/importByDOI?${params.toString()}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        window.location.href = `/myPapers`;
        // setMessage(data.message);
        // setModalShow(true);
    });
}



  return (
    <div>
      {/* <AppNavbar /> */}
      <div className="paper-list-page-container">
        <div className="title-and-add">
          <h1 className="paper-list-title">My Papers</h1>
          <div style={{ display: "flex", marginBottom: "2rem" }}>
          <form onSubmit={(event) => {
              event.preventDefault();
              importPaperByDOI(searchTerm);
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleChange}
              placeholder="Write down the DOI"
            />
            <button type="submit">
              Import
            </button>
          </form>
          </div>
          <div style={{ display: "flex", marginBottom: "2rem" }}>
            <Link
              to="/myPapers/new"
              className="auth-button green"
              style={{ textDecoration: "none", marginRight: "1rem", display: "inline-block" }}
            >
              Add Paper
            </Link>
              <button 
                onClick={() => inputFileRef.current.click()}
                className="auth-button purple"
                style={{ display: "inline-block"}}
                >
                Import Papers by Excell
              </button>
             </div>
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
                  <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  style={{ display: "none" }} // Ocultar el input, puedes personalizarlo como desees
                  ref={inputFileRef}
                />
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

export {exportTitles, UserPaperList}
