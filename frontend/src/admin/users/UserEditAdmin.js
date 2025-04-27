import { useEffect,useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "reactstrap";
import tokenService from "../../services/token.service";
import FormGenerator from "../../components/formGenerator/formGenerator";
import "../../static/css/admin/adminPage.css";
import getErrorModal from "../../util/getErrorModal";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchData from "../../util/useFetchData";
import useFetchState from "../../util/useFetchState";
import 'bootstrap/dist/css/bootstrap.min.css';
import { userEditFormInputs} from "./form/userEditFormInputs";
import {userCreateFormInputs } from "./form/userCreateFormInputs";
import { useNavigate } from 'react-router-dom';

export default function UserEditAdmin() {
  let pathArray = window.location.pathname.split("/");
    const emptyItem = {
      id: null,
      firstName: "",
      lastName: "",
      username: "",
      studies: "",
      job: "",
      email: "",
      password: "",
      authority: {},
    };
  
    const [message, setMessage] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [user, setUser] = useState(emptyItem);
    const [userId, setUserId] = useState();
    const [isEdit, setIsEdit] = useState(false);
    const [authority, setAuthority] = useState([])
    const editUserFormRef = useRef();
    const navigate = useNavigate();
  
    useEffect(() => {
      setUpUser();
    }, []);
  
    async function setUpUser() {
    if (pathArray[3] !== "new" && user.id==null){
      setIsEdit(true);
      const user = fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${pathArray[3]}`, {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
        },
      })
          .then((p) => p.json())
          .then((p) => {
            if(p.message){ 
              setMessage(user.message);
              setModalShow( true );
            }else {
              setUser(p);
              setUserId(p.id);                
            }
          }).catch(m =>{
            setMessage(m);
            setModalShow( true );
          });          

      // Configurar los valores por defecto después de cargar los datos del usuario

    } 
    if(authority.length===0){
      fetch(`https://tfm-m1dn.onrender.com/api/v1/users/authorities`, {
        headers: {
          Authorization: `Bearer ${tokenService.getLocalAccessToken()}`,
        },
        }
      ).then(data => data.json()).then((data) => {
        if(!data.message)
          setAuthority(data);
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
      let newUser = { ...user };
      if (name === "authority")
        newUser.authority= authority.filter(
                (authority) => authority.id === Number(value))[0];
      else 
        newUser.username = value;
        setUser(newUser);
    }
  
    async function handleSubmit({ values }) {

        if (!editUserFormRef.current.validate()) return;

        let myuser;

        if(isEdit){
          myuser = {
            id: userId,
            firstName: values["firstName"],
            lastName: values["lastName"],
            username: values["username"],
            studies: values["studies"],
            job: values['job'],
            email: values["email"],
            authority: authority.filter((authority) => authority.authority === values["authority"])[0],
            password: user.password
  
        }}
        else{
          myuser = {
            id: userId,
            firstName: values["firstName"],
            lastName: values["lastName"],
            username: values["username"],
            studies: values["studies"],
            job: values['job'],
            email: values["email"],
            authority: authority.filter((authority) => authority.authority === values["authority"])[0],
            password: values["password"],
  
        }
      }

        const response = await (await fetch("https://tfm-m1dn.onrender.com/api/v1/users" + (user.id ? "/" + userId : ""),

        {
          method:  pathArray[3] === "new" ? "POST" : "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(myuser),
        }));
  
        if (response.message){
          setMessage(response.message);
          setModalShow(true);
        }
        else navigate(`/users`);
      }
  
    const title = (
      <h2 className="text-center">{user.id ? "Edit User" : "Add User"}</h2>
    );
    userEditFormInputs.forEach((i) => (i.handleChange = handleChange));



    if (userEditFormInputs[6].values.length < 2) {
      userEditFormInputs[6].values = [
        ...userEditFormInputs[6].values,
        ...authority.map((authority) => authority.authority),
      ];
    }

    userEditFormInputs[0].defaultValue = user.username || "";
    userEditFormInputs[1].defaultValue = user.firstName || "";
    userEditFormInputs[2].defaultValue = user.lastName || "";
    userEditFormInputs[3].defaultValue = user.studies || "";
    userEditFormInputs[4].defaultValue = user.job || "";
    userEditFormInputs[5].defaultValue = user.email || "";
    userEditFormInputs[6].defaultValue = user.authority.authority || "";

      




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
              <Button color="primary" tag={Link} to={`/users`}>
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
            inputs={isEdit ? userEditFormInputs : userCreateFormInputs}
            onSubmit={handleSubmit}
            buttonText="Save"
            buttonClassName="auth-button"
          />
        </div>
        {modal}
      </div>
    );
}
