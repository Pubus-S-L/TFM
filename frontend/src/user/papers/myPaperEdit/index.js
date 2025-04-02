"use client"
import { useEffect, useState, useRef } from "react"
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import FormGenerator from "../../../components/formGenerator/formGenerator"
import { paperEditFormInputs } from "./form/paperEditFormInputs"
import "bootstrap/dist/css/bootstrap.min.css"
import tokenService from "../../../services/token.service"
import { FileText, Upload, Trash2 } from "lucide-react"
import "../../../static/css/user/myPaperEdit.css";

export default function UserPaperEdit({ id, onSave }) {
  const pathArray = window.location.pathname.split("/")
  const emptyItem = {
    id: null,
    title: "",
    authors: "",
    publicationYear: "",
    type: {name: "None"},
    abstractContent: "",
    keywords: "",
    notes: "",
    user: {},
  }
  const user = tokenService.getUser()
  const jwt = JSON.parse(window.localStorage.getItem("jwt"))
  const [modalShow, setModalShow] = useState(false)
  const [types, setTypes] = useState([])
  const [paper, setPaper] = useState(emptyItem)
  const [paperId, setPaperId] = useState(id)
  const [userId, setUserId] = useState(user.id)
  const editPaperFormRef = useRef()
  const [files, setFiles] = useState([])
  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    const field = paperEditFormInputs.find((input) => input.name === name);
    if (!field) return "";

    let errorMessage = "";

    if (field.isRequired && !value) {
      errorMessage = `${field.tag} is required.`;
    }

    for (const validatorObject of field.validators || []) {
      const isValid = validatorObject.validate(value);
      if (!isValid) {
        errorMessage = validatorObject.message;
        break;
      }
    }

    return errorMessage;
  };

  const uploadFiles = (e) => {
    setFiles(e)
  }

  useEffect(() => setupPaper(), [])

  function removePaperFile(id) {
    fetch(`/api/v1/papers/${paperId}/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 200) {
          const updatedFiles = [...files].filter((i) => i.id !== id)
          setFiles(updatedFiles)
        }
        return response.json()
      })
      .then((data) => {
        setModalShow(true)
      })
  }

  function setupPaper() {
    if (paperId !== "" && paper.id == null) {
      const paper = fetch(`/api/v1/papers/${paperId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
        .then((p) => p.json())
        .then((p) => {
          if (p.message) {
            setModalShow(true)
          } else {
            setPaper(p)
            setPaperId(p.id)
            if (!p.type || !p.type.name) {
              p.type = { name: "None" };
            }
          }
        })
        .catch((m) => {
          setModalShow(true)
        })
    }
    if (types.length === 0) {
      fetch(`/api/v1/papers/types`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      })
        .then((data) => data.json())
        .then((data) => {
          if (!data.message) setTypes(data)
          else {
            setModalShow(true)
          }
        })
        .catch((error) => setModalShow(true))
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const error = validateField(name, value);
    setFormErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
    setPaper((prevPaper) => ({
      ...prevPaper,
      [name]: name === "type" ? types.find((t) => t.name === value) || { name: "None", id: -1 } : value,
    }));
  }

  async function handleSubmit() {
    const currentFormErrors = {};
    let hasErrors = false;
    paperEditFormInputs.forEach(input => {
      const error = validateField(input.name, paper[input.name]);
      if (error) {
        currentFormErrors[input.name] = error;
        hasErrors = true;
      }
    });
    setFormErrors(currentFormErrors);

    if (hasErrors) {
      console.log("Formulario con errores, no se envía al backend.");
      return;
    }

    const mypaper = {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      publicationYear: paper.publicationYear,
      type: paper.type,
      publisher: paper.publisher,
      publicationData: paper.publicationData,
      abstractContent: paper.abstractContent,
      keywords: paper.keywords,
      notes: paper.notes,
      source: paper.source,
      scopus: paper.scopus,
      user: paper.user,
    };

    const f = new FormData();
    if (files != null) {
      for (let index = 0; index < files.length; index++) {
        f.append("files", files[index]);
      }
    } else {
      const nofiles = [];
      f.append("files", nofiles);
    }

    f.append("paper", new Blob([JSON.stringify(mypaper)], { type: "application/json" }));
    f.append("userId", userId.toString());

    try {
      const response = await fetch("/api/v1/papers" + (paperId !== "" ? "/" + paperId : ""), {
        method: mypaper.id ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/json",
        },
        body: f,
      });

      if (response.ok) {
        const submit = await response.json();
        if (submit.message) {
          setModalShow(true);
        } else window.location.href = `/myPapers`;
      } else if (response.status === 400) {
        const errorData = await response.json();
        console.error("Errores de validación del backend:", errorData);
        setModalShow(true);
      } else if (response.status === 500) {
        console.error("Error del servidor:", response);
        setModalShow(true);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setModalShow(true);
    }
  }

  paperEditFormInputs.forEach((i) => (i.handleChange = handleChange))

  if (paperEditFormInputs[5].values.length < 2) {
    paperEditFormInputs[5].values = [...paperEditFormInputs[5].values, ...types.map((type) => type.name)]
  }

  if (paper && paperEditFormInputs[5].values.length >= 2) {
    paperEditFormInputs[0].defaultValue = paper.title || ""
    paperEditFormInputs[1].defaultValue = paper.authors || ""
    paperEditFormInputs[2].defaultValue = paper.publisher || ""
    paperEditFormInputs[3].defaultValue = paper.publicationData || ""
    paperEditFormInputs[4].defaultValue = paper.publicationYear || ""
    paperEditFormInputs[5].defaultValue = paper.type && paper.type.name ? paper.type.name : "None"
    paperEditFormInputs[6].defaultValue = paper.abstractContent || ""
    paperEditFormInputs[7].defaultValue = paper.notes || ""
    paperEditFormInputs[8].defaultValue = paper.keywords || ""
    paperEditFormInputs[9].defaultValue = paper.scopus || ""
    paperEditFormInputs[10].defaultValue = paper.source || ""
  }

  function handleShow() {
    setModalShow(false)
  }

  const basicInfoInputs = [paperEditFormInputs[0], paperEditFormInputs[1], paperEditFormInputs[5]]
  const publicationInfoInputs = [paperEditFormInputs[2], paperEditFormInputs[3], paperEditFormInputs[4]]
  const contentInfoInputs = [paperEditFormInputs[6], paperEditFormInputs[7], paperEditFormInputs[8]]
  const additionalInfoInputs = [paperEditFormInputs[9], paperEditFormInputs[10]]

  const handleSaveClick = () => {
    handleSubmit();
  };

  return (
    <div className="paper-edit-container">
      <h2 className="page-title">{paper.id ? "Edit Paper" : "Add Paper"}</h2>
      <p className="page-description">Make changes to your paper information here. Click save when you're done.</p>

      <div className="paper-section-card">
        <h3 className="section-title">Basic Information</h3>
        <p className="section-description">Update your paper's basic details</p>

        <div className="form-fields">
          {basicInfoInputs.map((input, index) => (
            <div key={index} className="form-field-wrapper">
              <label htmlFor={input.name} className="form-label">
                {input.tag}
              </label>
              {input.type === "select" ? (
                <select
                  id={input.name}
                  name={input.name}
                  className="form-input"
                  value={paper.type.name}
                  onChange={input.handleChange}
                >
                  {input.values.map((value, i) => (
                    <option key={i} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type={input.type}
                    id={input.name}
                    name={input.name}
                    className={`form-input ${formErrors[input.name] ? 'is-invalid' : ''}`}
                    defaultValue={input.defaultValue}
                    onChange={input.handleChange}
                    required={input.isRequired}
                  />
                  {formErrors[input.name] && <div className="invalid-feedback">{formErrors[input.name]}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="paper-section-card">
        <h3 className="section-title">Publication Information</h3>
        <p className="section-description">Update publication details</p>

        <div className="form-fields">
          {publicationInfoInputs.map((input, index) => (
            <div key={index} className="form-field-wrapper">
              <label htmlFor={input.name} className="form-label">
                {input.tag}
              </label>
              <>
                <input
                  type={input.type}
                  id={input.name}
                  name={input.name}
                  className={`form-input ${formErrors[input.name] ? 'is-invalid' : ''}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div className="invalid-feedback">{formErrors[input.name]}</div>}
              </>
            </div>
          ))}
        </div>
      </div>

      <div className="paper-section-card">
        <h3 className="section-title">Content Information</h3>
        <p className="section-description">Update abstract, notes and keywords</p>

        <div className="form-fields">
          {contentInfoInputs.map((input, index) => (
            <div key={index} className="form-field-wrapper full-width">
              <label htmlFor={input.name} className="form-label">
                {input.tag}
              </label>
              <>
                <textarea
                  id={input.name}
                  name={input.name}
                  className={`form-textarea ${formErrors[input.name] ? 'is-invalid' : ''}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div className="invalid-feedback">{formErrors[input.name]}</div>}
              </>
            </div>
          ))}
        </div>
      </div>

      <div className="paper-section-card">
        <h3 className="section-title">Additional Information</h3>
        <p className="section-description">Update scopus and source details</p>

        <div className="form-fields">
          {additionalInfoInputs.map((input, index) => (
            <div key={index} className="form-field-wrapper">
              <label htmlFor={input.name} className="form-label">
                {input.tag}
              </label>
              <>
                <input
                  type={input.type}
                  id={input.name}
                  name={input.name}
                  className={`form-input ${formErrors[input.name] ? 'is-invalid' : ''}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div className="invalid-feedback">{formErrors[input.name]}</div>}
              </>
            </div>
          ))}
        </div>
      </div>

      <div className="paper-section-card">
        <h3 className="section-title">Files</h3>
        <p className="section-description">Upload or manage paper files</p>

        <div className="upload-area">
          <label htmlFor="file-upload" className="upload-label">
            <Upload className="upload-icon" />
            <p className="upload-text">Click to upload or drag and drop</p>
            <p className="upload-hint">PDF, DOC, DOCX (MAX. 10MB)</p>
            <input
              id="file-upload"
              type="file"
              name="files"
              multiple
              className="hidden-input"
              onChange={(e) => uploadFiles(e.target.files)}
            />
          </label>
        </div>

        {files && files.length > 0 && (
          <div className="files-selected">
            <p>{files.length} file(s) selected</p>
          </div>
        )}

        {paper.paperFiles && paper.paperFiles.length > 0 && (
          <div className="files-list">
            <h4 className="files-list-title">Attached Files</h4>
            {paper.paperFiles.map((paperFile, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span className="file-name">{paperFile.name}</span>
                </div>
                <button className="delete-button" onClick={() => removePaperFile(paperFile.id)}>
                  <Trash2 className="delete-icon" />
                  <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="save-button-container">
        <button
          className="save-button"
          onClick={handleSaveClick}
        >
          Save
        </button>
      </div>
    </div>
  );
}
