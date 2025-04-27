import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import like from "../../../static/images/like.png";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card.tsx"
import { Input } from "../../../components/ui/input.tsx";

export default function Papers() {
  let [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [types, setTypes] = useState([]);
  const [typesSelected, setTypeSelected] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
  
  async function setUpTypes() {
    let types = await (
      await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/types`, {
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
    setIsLoading(true);
    let papersFilteredByType = []
    if (typesSelected.length > 0) {
      for(const paperType of typesSelected){
        console.log(paperType)
        let papersByType = await (
          await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/types/${paperType}`, {
            headers: {
              "Content-Type": "application/json",
            },
          })
        ).json();
        papersFilteredByType= papersFilteredByType.concat(papersByType)
      }   
    }
  
    let papersFiltered = await (
      await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers?search=${searchTerm}`, {
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
    setIsLoading(false);
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
        <Input
          type="text"
          placeholder="Search papers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{
            maxWidth: "800px",
          }}
        />
       
       <Card className="flex items-center mt-3 p-2 shadow-lg border border-gray-200 bg-white">
        <CardHeader className="pr-1">
          <CardTitle className="text-sm font-bold whitespace-nowrap">Filter by:</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row items-center justify-center gap-1.5 p-0">
          {types.map((type, index) => (
            <label key={index} className="flex justify-center gap-1 text-xs">
              <input
                type="checkbox"
                value={type.name}
                checked={typesSelected.includes(type.name)}
                onChange={(e) => changeCheckbox(e)}
              />
              {type.name}
            </label>
          ))}
        </CardContent>
      </Card>

    {isLoading ? (
      <Card className="w-4/5 p-4 text-center mx-auto">
        <CardContent>
          <p className="text-lg font-semibold">Loading papers...</p>
        </CardContent>
      </Card>
        ) : papers && papers.length > 0 ? (
          papers.map((paper) => (
            <Link
              key={paper.id}
              to={"/papers/" + paper.id}
              style={{ textDecoration: "none", display: "block", width: "100%" }}
            >
              <Card className="w-4/5 mx-auto mt-6 mb-1 shadow-lg border border-gray-200 hover:bg-gray-200 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">{paper.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-0">
                  <CardDescription>
                    <p><strong>Authors:</strong> {paper.authors}</p>
                    <p><strong>Publication Year:</strong> {paper.publicationYear}</p>
                    <p><strong>Type:</strong> {paper.type.name}</p>
                    <strong
                      className="paper-name"
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      {paper.likes != null && paper.likes > 0 ? paper.likes : null}
                      {paper.likes != null && paper.likes > 0 ? (
                        <img src={like} alt="Like" style={{ height: 15, width: 15 }} />
                      ) : null}
                    </strong>
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))
          ) : (
            <Card className="w-full p-4 text-center">
              <CardContent>
                <p className="text-lg font-semibold">No papers available</p>
              </CardContent>
            </Card>
              )
                  }
                </div>
                
              </div>
            );

}
