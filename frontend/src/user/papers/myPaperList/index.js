import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link, json } from "react-router-dom";
import tokenService from "../../../services/token.service";
import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import secret from "../../../secret.json"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card.tsx"
import { LoadingBar } from "../../../components/ui/loading-bar.tsx"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet.tsx";
import {PencilIcon, Trash2} from "lucide-react";
import UserPaperEdit from "../myPaperEdit/index.js";
import { Input } from "../../../components/ui/input.tsx";
import { useNavigate } from 'react-router-dom';

let exportTitles = []

  function UserPaperList() {
  let [papers, setPapers] = useState([]);
  let [message, setMessage] = useState(null);
  let [modalShow, setModalShow] = useState(false);
  let [jsonData, setJsonData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const user = tokenService.getUser();
  const jwt = tokenService.getLocalAccessToken();
  const inputFileRef = useRef(null);
  const linkedIn = "linkedIn";
  const twitter = "twitter";
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const [isImporting, setIsImporting] = useState(false);
  const [totalSteps, setTotalSteps] = useState(100);
  const [importProgress, setImportProgress] = useState(0);
  // const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const navigate = useNavigate();

  // const handleEditClick = (paperId) => {
  //   setSelectedPaperId(paperId);
  //   setIsSheetOpen(true);
  //   console.log(selectedPaperId)
  // };

  function removePaper(id) {
    fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${id}`, {
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
    setIsLoading(true);
    try {
      let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      let papersData = await response.json();
      setPapers(papersData);
    } catch (error) {
      setMessage("Error fetching papers. Please reload the page.");
      setModalShow(true);
    } finally {
      setIsLoading(false);
    }
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

  async function setUpFiles() {
    setIsImporting(true);
    if (!jsonData) return;

    try {
        setTotalSteps(jsonData.length || 100); 

        for (let i = 0; i < jsonData.length; i++) {
            await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/importPaper/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData[i]),
            });

            setImportProgress(((i + 1) / jsonData.length) * 100);
        }

        navigate(0);
    } catch (error) {
        setMessage("Error importing papers.");
        setModalShow(true);
    } finally {
        setIsImporting(false);
        setImportProgress(100); 
    }
}

useEffect(() => {
  if (jsonData) {
    setUpFiles();
  }
}, [jsonData]);

  const handleSavePaper = (updatedPaper) => {
    // Update the paper in the papers state
    const updatedPapers = papers.map(p => 
      p.id === updatedPaper.id ? updatedPaper : p
    );
    setPapers(updatedPapers);
    // setIsSheetOpen(false);
    setMessage("Paper updated successfully!");
    setModalShow(true);
  };

  function importPaperByDOI(searchTerm) {
    const params = new URLSearchParams({ searchTerm: searchTerm });
    fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${user.id}/importByDOI?${params.toString()}`, {
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
      navigate(0);
    });
}

  const handleGenerateText = async (title,abstract,paperId, red_social) => {
 
      let prompt = "You are an enthusiastic researcher and you write a social media post about your new paper"+title+"about"+abstract+"";
      const model = "gpt-3.5-turbo-instruct";
      let maxTokens = 300;
      const url = `https://pubus.onrender.com/papers/${paperId}`;
      if(red_social==="twitter"){
        prompt = "You are an enthusiastic researcher and you write a social media post on 190 characteres about your new paper"+title+"about"+abstract+"";
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
      <div className="paper-list-page-container">
        <div className="title-and-add">
          <h1 className="paper-list-title">My Papers</h1>

          {/* Search and Import by DOI */}
          <div style={{ display: "flex", marginBottom: "2rem" }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                importPaperByDOI(searchTerm);
              }}
              className="doi-form"
              style={{ display: "flex", flex: 1 }} // Importante: el form también flex
            >
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Write down the DOI to import"
                className="search-input"
                style={{
                  flex: 1,               // <-- el input se expande todo lo que pueda
                  textAlign: "left",
                  paddingLeft: "0.5rem",
                  minWidth: "250px",     // <-- un mínimo para que siempre sea grande
                }}
              />
              <button
                type="submit"
                className="auth-button pink"
                style={{ marginLeft: "8px", whiteSpace: "nowrap" }} // espacio entre input y botón
              >
                Import by DOI
              </button>
            </form>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
          <Sheet>
            <SheetTrigger asChild>
                <button className="auth-button green" style={{ textDecoration: "none" }}> Add Paper</button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
              <div className="py-6">
                <UserPaperEdit id={""} onSave={handleSavePaper} />
              </div>
            </SheetContent>
          </Sheet>
            <button
              onClick={() => {
                inputFileRef.current?.click();
              }}
              className="auth-button purple"
            >
              Import Papers by Excel
            </button>
          </div>
        </div>
        {isImporting && (
            <LoadingBar 
                progress={importProgress}
                size="md"
                variant="gradient"
                animation="shimmer"
                showPercentage={true}
                percentagePosition="outside"
                indeterminate={false} // Ahora es una barra con porcentaje real
                className="mb-6"
            />
        )}

        {/* Loading state */}
{/* Loading state */}
{isLoading ? (
  <Card className="w-full p-4 text-center">
    <CardContent>
      <p className="text-lg font-semibold">Loading papers...</p>
    </CardContent>
  </Card>
) : papers.length > 0 ? (
  /* Paper list */
  papers.map((paper) => (
    <><Card key={paper.id} className="w-full mb-4 shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{paper.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          <p><strong>Authors:</strong> {paper.authors}</p>
          <p><strong>Publication Year:</strong> {paper.publicationYear}</p>
          <p><strong>Type:</strong> {paper.type.name}</p>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex justify-center gap-20">
      <Sheet>
          <SheetTrigger asChild>
              <button className="auth-button blue" style={{ textDecoration: "none" }}> <PencilIcon className= "mr-1.5 h-5 w-5"/>Edit</button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
            <div className="py-6">
              <UserPaperEdit id={paper.id} onSave={handleSavePaper} />
            </div>
          </SheetContent>
        </Sheet>
        {/* <button className="auth-button blue" style={{ textDecoration: "none" }} onClick={() => handleEditClick(paper.id)}>Edit</button> */}
        {/* <Link to={`/myPapers/${paper.id}`} className="auth-button blue" style={{ textDecoration: "none" }}>
          Edit
        </Link> */}

        {/* Social media buttons */}
        <button
          onClick={() => handleGenerateText(paper.title, paper.abstractContent, paper.id, linkedIn)}
          className="auth-button linkedIn with-icon"
        >
          <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="LinkedIn">
            <path d="m132.28,479.99501l-92.88,0l0,-299.1l92.88,0l0,299.1zm-46.49,-339.9c-29.7,0 -53.79,-24.6 -53.79,-54.3a53.79,53.79 0 0 1 107.58,0c0,29.7 -24.1,54.3 -53.79,54.3zm394.11,339.9l-92.68,0l0,-145.6c0,-34.7 -0.7,-79.2 -48.29,-79.2c-48.29,0 -55.69,37.7 -55.69,76.7l0,148.1l-92.78,0l0,-299.1l89.08,0l0,40.8l1.3,0c12.4,-23.5 42.69,-48.3 87.88,-48.3c94,0 111.28,61.9 111.28,142.3l0,164.3l-0.1,0z"></path>
          </svg>
          Share on LinkedIn
        </button>

        <button
          onClick={() => handleGenerateText(paper.title, paper.abstractContent, paper.id, twitter)}
          className="auth-button twitter with-icon"
        >
          <svg className="share-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Twitter">
            <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
          </svg>
          Share on Twitter
        </button>

        <button
          onClick={() => removePaper(paper.id)}
          className="auth-button danger"
        > <Trash2 className="mr-2"/>
          Delete
        </button>
      </CardFooter>
    </Card>
    


</>
      
  ))
) : (
  <Card className="w-full p-4 text-center">
    <CardContent>
      <p className="text-lg font-semibold">No papers available</p>
    </CardContent>
  </Card>
)
}

        {/* Hidden file input for Excel import */}
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleImportExcel}
          style={{ display: "none" }}
          ref={inputFileRef}
        />

        {/* Alert Modal */}
        <Modal isOpen={modalShow} toggle={handleShow} keyboard={false} className="custom-modal">
          <ModalHeader
            toggle={handleShow}
            close={
              <button className="close" onClick={handleShow} type="button">
                &times;
              </button>
            }
            className="custom-modal-header"
          >
            <span className="custom-modal-title">Alert!</span>
          </ModalHeader>
          <ModalBody className="custom-modal-body">{message || ""}</ModalBody>
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
