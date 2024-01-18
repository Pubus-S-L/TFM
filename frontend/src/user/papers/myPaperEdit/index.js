import React from "react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import FormGenerator from "../../../components/formGenerator/formGenerator";
import { paperEditFormInputs } from "./form/paperEditFormInputs";
import "../../../static/css/user/myPaperEdit.css";
import "../../../static/css/auth/authButton.css"
import useFetchState from "../../../util/useFetchState";

export default function UserPaperEdit(){
  let pathArray = window.location.pathname.split("/");
  const emptyItem = {
    id: null,
    title: "",
    authors: "",
    publicationYear: "",
    type: {},
    abstractContent: "",
    keywords: "",
    notes: "",
    user: {},
  };  
  const jwt = JSON.parse(window.localStorage.getItem("jwt"));
  const [message,setMessage] = useState(null);
  const [modalShow,setModalShow] = useState(false);
  const [types, setTypes] = useState([])
  const [paper,setPaper] = useState(emptyItem);  
  const [paperId,setPaperId] = useState(pathArray[2]);
  const editPaperFormRef=useRef();
  
  useEffect( () => setupPaper(),[]);  
  
  function setupPaper(){
      if (paperId !== "new" && paper.id==null) { 
        const paper = fetch(
            `/api/v1/papers/${paperId}`, 
            {
              headers: {
              Authorization: `Bearer ${jwt}`,
            },
          })
          .then((p) => p.json())
          .then((p) => {
            if(p.message){ 
              setMessage(paper.message);
              setModalShow( true );
            }else {
              setPaper(p);
              setPaperId(p.id);                
            }
          }).catch(m =>{
            setMessage(m);
            setModalShow( true );
          });          
    }    
    if(types.length===0){
      fetch(`/api/v1/papers/types`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      ).then(data => data.json()).then((data) => {
        if(!data.message)
          setTypes(data);
        else{
          setMessage(data.message);
          setModalShow(true);
        }
      }).catch(error => {setMessage(error);setModalShow(true);});
      }
  }

  function handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    let newPaper = { ...paper };
    if (name === "type")
      newPaper.type= types.filter(
                (type) => type.id === Number(value))[0];
    else 
      newPaper.title = value;
    setPaper(newPaper);
  }  

  async function handleSubmit({ values }) {

    if (!editPaperFormRef.current.validate()) return;

    const mypaper = {
      id: paper.id,
      title: values["title"],
      authors: values['authors'],
      publicationYear: values["publicationYear"],
      type: types.filter((type) => type.name === values["type"])[0],
      abstractContent: values['abstractContent'],
      keywords: values['keywords'],
      notes: values['notes'],
      user: paper.user,
    };

    const submit = await (await fetch("/api/v1/papers" + (paper.id ? "/" + paperId : ""), 
      {
        method: mypaper.id ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mypaper),
      }
    )).json();

    if (submit.message){
      setMessage(submit.message);
      setModalShow(true);
    }
    else window.location.href = `/myPapers`;
  }
  
    const title = (
      <h2 className="text-center">{paper.id ? "Edit Paper" : "Add Paper"}</h2>
    );

    paperEditFormInputs.forEach(i => i.handleChange=handleChange);
    

    if (paperEditFormInputs[3].values.length < 2) {
      paperEditFormInputs[3].values = [
        ...paperEditFormInputs[3].values,
        ...types.map((type) => type.name),
      ];
    }

    if (paper && paperEditFormInputs[3].values.length >= 2) {
      paperEditFormInputs[0].defaultValue = paper.title || "";
      paperEditFormInputs[1].defaultValue = paper.authors || "";
      paperEditFormInputs[2].defaultValue = paper.publicationYear || "";
      paperEditFormInputs[3].defaultValue = paper.type.name || "None";
      paperEditFormInputs[4].defaultValue = paper.abstractContent || "";
      paperEditFormInputs[5].defaultValue = paper.keywords || "";
      paperEditFormInputs[6].defaultValue = paper.notes || "";
    }

    function handleShow() {
      setModalShow(false);
      setMessage(null);
    }

    let modal = <></>;
    if (message) {
      const show = modalShow;
      const closeBtn = (
        <button className="close" onClick={handleShow} type="button">
          &times;
        </button>
      );
      const cond = message.includes("limit");
      modal = (
        <div>
          <Modal isOpen={show} toggle={handleShow} keyboard={false}>
            {cond ? (
              <ModalHeader>Warning!</ModalHeader>
            ) : (
              <ModalHeader toggle={handleShow} close={closeBtn}>
                Error!
              </ModalHeader>
            )}
            <ModalBody>{message || ""}</ModalBody>
            <ModalFooter>
              <Button color="primary" tag={Link} to={`/myPapers`}>
                Back
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      );
    }

    return (
      <div className="edit-paper-page-container">
        <div className="edit-paper-form-container">
          {title}
          <FormGenerator
            ref={editPaperFormRef}
            inputs={paperEditFormInputs}
            onSubmit={handleSubmit}
            buttonText="Save"
            buttonClassName="auth-button"
          />
        </div>
        {modal}
      </div>
    );
  }

