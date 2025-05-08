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
import FormGenerator from "../../components/formGenerator/formGenerator";
import { userEditFormInputs } from "./form/userEditFormInputs";
import "../../static/css/user/myPaperEdit.css";
import "../../static/css/auth/authButton.css";
import tokenService from "../../services/token.service";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';


export default function EditProfile() {
    const user = tokenService.getUser();
    const jwt = tokenService.getLocalAccessToken();
    const navigate = useNavigate();
  
    const emptyItem = {
      id: null,
      firstName: user.firstName,
      lastName: user.lastName,
      username: null,
      studies: user.studies,
      job: user.job,
      papers: {},
      email: null,
      password: null,
      authority: null,
    };
  
    const [message, setMessage] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [userEdited, setUserEdited] = useState(emptyItem);
    const [userId, setUserId] = useState(user.id);
    const editUserFormRef = useRef();
  
    useEffect(() => {
      setUpUser();
    }, []);
  
    async function setUpUser() {
      try {
        const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}`, {
          headers: {
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
  
        const userData = await response.json();
        setUserEdited(userData);
        setUserId(user.id);
  
        // Configurar los valores por defecto después de cargar los datos del usuario
        configureDefaultValues(userData);
      } catch (error) {
        setMessage(error.message);
        setModalShow(true);
      }
    }
  
    function configureDefaultValues(userData) {
      if (userData) {
        userEditFormInputs[0].defaultValue = userData.firstName || "";
        userEditFormInputs[1].defaultValue = userData.lastName || "";
        userEditFormInputs[2].defaultValue = userData.studies || "";
        userEditFormInputs[3].defaultValue = userData.job || "";
      }
    }
  
    function handleChange(event) {
      const { name, value } = event.target;
      setUserEdited((prevUser) => ({ ...prevUser, [name]: value }));
    }
  
    async function handleSubmit({ values }) {
      try {
        if (!editUserFormRef.current.validate()) return;
  
        const myuser = {
          id: user.id,
          firstName: values["firstName"],
          lastName: values["lastName"],
          username: userEdited.username,
          studies: values["studies"],
          job: values['job'],
          papers: userEdited.papers,
          email: userEdited.email,
          password: userEdited.password,
          authority: userEdited.authority,
        };

        console.log(myuser)
  
        const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}`, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(myuser),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
  
        navigate(0);
      } catch (error) {
        setMessage(error.message);
        setModalShow(true);
      }
    }
  
    const title = <h2 className="text-center">{"Profile"}</h2>;
  
    userEditFormInputs.forEach((i) => (i.handleChange = handleChange));
  
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
            ref={editUserFormRef}
            inputs={userEditFormInputs}
            onSubmit={handleSubmit}
            buttonText="Save"
            buttonClassName="auth-button"
          />
        </div>
        {modal}
      </div>
    );
  }
  