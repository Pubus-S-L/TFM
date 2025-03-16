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
import useFetchState from "../../util/useFetchState";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

export default function UserProfile() {
    const user = tokenService.getUser();
    const jwt = tokenService.getLocalAccessToken();
    const [message, setMessage] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [userId, setUserId] = useState(user.id);
    const editUserFormRef = useRef();
  
    useEffect(() => {
      setUpPapers();
    }, []);
  
    async function setUpPapers() {
      try {
        const response = await fetch(`/api/v1/users/${userId}`, {
          headers: {
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }
  
        const userData = await response.json();
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
  
  
    const title = <h2 className="text-center">{"Profile"}</h2>;
  
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
            buttonText="Save"
            buttonClassName="auth-button"
          />
        </div>
        {modal}
      </div>
    );
  }
  