import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import like from "../../../static/images/like.png";

export default function Papers() {
  let [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [types, setTypes] = useState([]);
  const [typesSelected, setTypeSelected] = useState([]);
  
  async function setUpTypes() {
    let types = await (
      await fetch(`/api/v1/papers/types`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();
    setTypes(types)
  }


  const changeCheckbox = (e) => {
    const selectedValue = e.target.value;
    const newTypesSelected = [...typesSelected];
  
    if (e.target.checked) {
      newTypesSelected.push(selectedValue);
    } else {
      const index = newTypesSelected.indexOf(selectedValue);
      if (index !== -1) {
        newTypesSelected.splice(index, 1);
      }
    }
  
    setTypeSelected(newTypesSelected);
  };



  async function setUp() {
    let papersFilteredByType = []
    if (typesSelected.length > 0) {
      for(const paperType of typesSelected){
        console.log(paperType)
        let papersByType = await (
          await fetch(`/api/v1/papers/types/${paperType}`, {
            headers: {
              "Content-Type": "application/json",
            },
          })
        ).json();
        papersFilteredByType= papersFilteredByType.concat(papersByType)
      }   
    }
  
    let papersFiltered = await (
      await fetch(`/api/v1/papers?search=${searchTerm}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();

    let papersRes = []
    if(typesSelected.length > 0){ 
      console.log(typesSelected)
      console.log(papersFilteredByType)
      console.log(papersFiltered)
      papersRes = papersFilteredByType.filter(elemento =>
        papersFiltered.some(paper => paper.id === elemento.id))
    }
    else{
      papersRes = papersFiltered
    }


    setPapers(papersRes)
  }

  useEffect(() => {
    async function fetchData() {
      await setUpTypes();
      await setUp();
    }

    fetchData();
  }, [typesSelected, searchTerm]);

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
         <div className="type-row">
      <span>
        <strong>Filter by Type:  </strong>
      </span>
            {types.map((type, index) => (
      <label key={index}>
          <strong>  </strong>
        <input
          type="checkbox"
          value={type.name}
          checked={typesSelected.includes(type.name)}
          onChange={(e) => changeCheckbox(e)}
        />
        {type.name}
        <strong className="separator"> </strong>
      </label>
    ))}
    </div>
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
                  <h7 className="paper-name">{paper.likes!=null && paper.likes>0? paper.likes: null}
                    {paper.likes!=null && paper.likes>0?
                    <img src={like} alt="Like" style={{ height: 15, width: 15 }} />:null}
                  </h7>
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
