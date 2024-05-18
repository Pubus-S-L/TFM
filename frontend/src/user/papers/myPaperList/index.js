import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link, json } from "react-router-dom";
import tokenService from "../../../services/token.service";
import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import secret from "../../../secret.json"

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
  const linkedIn = "linkedIn";
  const twitter = "twitter";
  const apiKey = secret.OPENAI_API_KEY;
  

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

  const handleGenerateText = async (title,paperId, red_social) => {
 
      let prompt = "You are an enthusiastic researcher and you write a social media post about your new paper"+title+"";
      const model = "gpt-3.5-turbo-instruct";
      let maxTokens = 300;
      const url = `http://localhost:3000/papers/${paperId}`;
      if(red_social==="twitter"){
        prompt = "You are an enthusiastic researcher and you write a social media post on 190 characteres about your new paper"+title+"";
      }
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: maxTokens
        })
      };
    
      try {
        const response = await fetch('https://api.openai.com/v1/completions', requestOptions);
        const previa = await response.json();
        const output = await previa.choices[0].text;

      let shareText = encodeURIComponent(`${output}. If you want to know more about it, check out this link: `);
      if(red_social==="linkedIn"){
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&text=${shareText}${url}`, '_blank');
      }
      else{
        shareText = encodeURIComponent(`${output}. If you want to know more about it, check out this link: `);
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&title=${shareText}`, '_blank');
      }
      }catch(error){
      const generatedText = "🎉 Exciting News! 🚀 Just published my latest paper:" + title + "";
      const shareText = encodeURIComponent(`${generatedText}. If you want to know more about it click on ${url}`);
      if(red_social==="linkedIn"){
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&text=${shareText}`, '_blank');
      }
      else{
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${shareText}`, '_blank');
      }
    }
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
                onClick={() => handleGenerateText(paper.title,paper.id,linkedIn)}
                className="auth-button linkedIn"
              >
                <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" style={{width:30}} viewBox="0 0 512 512" aria-label="ln" role="img">
                        <path d="m132.28,479.99501l-92.88,0l0,-299.1l92.88,0l0,299.1zm-46.49,-339.9c-29.7,0 -53.79,-24.6 -53.79,-54.3a53.79,53.79 0 0 1 107.58,0c0,29.7 -24.1,54.3 -53.79,54.3zm394.11,339.9l-92.68,0l0,-145.6c0,-34.7 -0.7,-79.2 -48.29,-79.2c-48.29,0 -55.69,37.7 -55.69,76.7l0,148.1l-92.78,0l0,-299.1l89.08,0l0,40.8l1.3,0c12.4,-23.5 42.69,-48.3 87.88,-48.3c94,0 111.28,61.9 111.28,142.3l0,164.3l-0.1,0z"></path>
                      </svg>
                   - Compartir en LinkedIn
              </button>
              <button
                
                onClick={() => handleGenerateText(paper.title,paper.id,twitter)}
                className="auth-button twitter"
              >
                <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" style={{width:30}} viewBox="0 0 512 512" aria-label="tw" role="img"><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>
                - Compartir en Twitter
              </button>
                    {/* <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${url}&text=${encodeURIComponent("Hey, don't miss my new paper titled...'"+ paper.title + "'. If you want to know more about it click on <a href='"+encodeURIComponent("http://localhost:3000/papers/"+paper.id)+"'>this link</a>")}`} target="_blank">
                      <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" style={{width:30}} viewBox="0 0 512 512" aria-label="ln" role="img">
                        <path d="m132.28,479.99501l-92.88,0l0,-299.1l92.88,0l0,299.1zm-46.49,-339.9c-29.7,0 -53.79,-24.6 -53.79,-54.3a53.79,53.79 0 0 1 107.58,0c0,29.7 -24.1,54.3 -53.79,54.3zm394.11,339.9l-92.68,0l0,-145.6c0,-34.7 -0.7,-79.2 -48.29,-79.2c-48.29,0 -55.69,37.7 -55.69,76.7l0,148.1l-92.78,0l0,-299.1l89.08,0l0,40.8l1.3,0c12.4,-23.5 42.69,-48.3 87.88,-48.3c94,0 111.28,61.9 111.28,142.3l0,164.3l-0.1,0z"></path>
                      </svg>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${url}&text=${encodeURI("Tú por qué eres tan guapo bb")}`} target="_blank">
                    <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" style={{width:30}} viewBox="0 0 512 512" aria-label="tw" role="img"><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>
                    </a> */}
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
