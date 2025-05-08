"use client"
import { useEffect, useState, useRef } from "react"
import { paperEditFormInputs } from "./form/paperEditFormInputs"
import "bootstrap/dist/css/bootstrap.min.css"
import tokenService from "../../../services/token.service"
import { FileText, Upload, Trash2, Loader, X } from "lucide-react"
import "../../../static/css/user/myPaperEdit.css"
import { useNavigate } from 'react-router-dom';

export default function UserPaperEdit({ id, onSave }) {
  // Estilo para los mensajes de error
  const errorStyle = {
    color: "red",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  }

  const pathArray = window.location.pathname.split("/")
  const emptyItem = {
    id: null,
    title: "",
    authors: "",
    publicationYear: "",
    type: { name: "None" },
    abstractContent: "",
    keywords: "",
    notes: "",
    user: {},
  }
  const user = tokenService.getUser()
  const jwt = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem("jwt") || '""') : ""
  const [modalShow, setModalShow] = useState(false)
  const [types, setTypes] = useState([])
  const [paper, setPaper] = useState(emptyItem)
  const [paperId, setPaperId] = useState(id)
  const [userId, setUserId] = useState(user.id)
  const editPaperFormRef = useRef()
  const [files, setFiles] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [paperLoaded, setPaperLoaded] = useState(false)
  const [touchedFields, setTouchedFields] = useState({})
  // Estado para controlar el spinner de carga
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate();

  const validateField = (name, value, isEditing = false, isTouched = false) => {
    const field = paperEditFormInputs.find((input) => input.name === name)
    if (!field) return ""

    // Si estamos editando y el campo no ha sido tocado, no mostrar error
    if (isEditing && !isTouched && paperId) {
      return ""
    }

    let errorMessage = ""

    // Validación para campos requeridos
    if (field.isRequired) {
      if (name === "type") {
        // Caso especial para el campo type que es un objeto
        if (!value || value === "None") {
          errorMessage = `${field.tag} is required.`
        }
      } else {
        // Para otros campos requeridos
        if (value === undefined || value === null || value === "") {
          errorMessage = `${field.tag} is required.`
        }
      }
    }

    // Si no hay error de campo requerido, ejecutar los validadores personalizados
    if (!errorMessage && field.validators && field.validators.length > 0) {
      for (const validatorObject of field.validators) {
        // Solo ejecutar el validador si hay un valor o si el campo es requerido
        if ((value !== undefined && value !== null && value !== "") || field.isRequired) {
          const isValid = validatorObject.validate(value)
          if (!isValid) {
            errorMessage = validatorObject.message
            break
          }
        }
      }
    }

    // Validación específica para abstractContent - límite de 1000 caracteres
    if (name === "abstractContent" && value && value.length > 1000) {
      return `The field can not be longer than 1000 caracteres (actual: ${value.length})`
    }
    if (name === "title" && value && value.length > 200) {
      return `The field can not be longer than 200 characteres (actual: ${value.length})`
    }
    if (name === "authors" && value && value.length > 500) {
      return `The field can not be longer than 500 characteres (actual: ${value.length})`
    }

    return errorMessage
  }

  // Funciones para manejar el drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add("drag-over")
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add("drag-over")
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("drag-over")
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("drag-over")

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }

  // Modificar la función uploadFiles para manejar mejor los archivos
  const uploadFiles = (fileList) => {
    // Convertir FileList a Array para mejor manejo
    const filesArray = Array.from(fileList);
  
    // Concatenar los archivos nuevos a los existentes, evitando duplicados
    setFiles(prevFiles => {
      // Filtrar los archivos ya existentes (si quieres evitar duplicados)
      const newFiles = filesArray.filter(newFile => 
        !prevFiles.some(existingFile => existingFile.name === newFile.name)
      );
      return [...prevFiles, ...newFiles];
    });
  };
  // Nueva función para eliminar un archivo seleccionado
  const removeSelectedFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  useEffect(() => setupPaper(), [])

  function removePaperFile(id) {
    // Eliminar inmediatamente el archivo de la UI
    setPaper((prevPaper) => ({
      ...prevPaper,
      paperFiles: prevPaper.paperFiles.filter((file) => file.id !== id),
    }))

    // Luego enviar la solicitud al servidor para eliminar el archivo
    fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${paperId}/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al eliminar el archivo")
        }
        return response.json()
      })
      .catch((error) => {
        console.error("Error al eliminar archivo:", error)
        setModalShow(true)

        // Si hay un error, restaurar el archivo en la UI
        fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${paperId}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        })
          .then((response) => response.json())
          .then((updatedPaper) => {
            if (!updatedPaper.message) {
              setPaper(updatedPaper)
            }
          })
          .catch((error) => console.error("Error al recuperar datos del paper:", error))
      })
  }
  function setupPaper() {
    if (paperId !== "" && paper.id == null) {
      const paper = fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/${paperId}`, {
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
              p.type = { name: "None" }
            }
            // Marcar que el paper se ha cargado completamente
            setPaperLoaded(true)
          }
        })
        .catch((m) => {
          setModalShow(true)
        })
    } else {
      // Si no hay paperId, estamos creando uno nuevo, así que también marcamos como cargado
      setPaperLoaded(true)
    }

    if (types.length === 0) {
      fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/types`, {
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

  // Función handleChange mejorada para validar en tiempo real
  function handleChange(event) {
    const { name, value } = event.target

    // Marcar el campo como tocado
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Actualizar el estado del paper
    setPaper((prevPaper) => {
      const updatedPaper = {
        ...prevPaper,
        [name]: name === "type" ? types.find((t) => t.name === value) || { name: "None", id: -1 } : value,
      }

      // Validar el campo con el nuevo valor
      const error = validateField(
        name,
        name === "type" ? updatedPaper.type.name : updatedPaper[name],
        !!paperId, // isEditing
        true, // isTouched (siempre true en handleChange)
      )

      // Actualizar el estado de errores
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: error,
      }))

      return updatedPaper
    })
  }

  // Función handleSubmit mejorada para validar todos los campos antes de enviar
  async function handleSubmit() {
    // Activar el spinner de carga
    setIsSaving(true);

    // Marcar todos los campos como tocados para la validación
    const allTouched = {};
    paperEditFormInputs.forEach((input) => {
        allTouched[input.name] = true;
    });
    setTouchedFields(allTouched);

    const currentFormErrors = {};
    let hasErrors = false;

    // Validar todos los campos
    paperEditFormInputs.forEach((input) => {
        const fieldName = input.name;
        const fieldValue = fieldName === "type" ? paper.type?.name : paper[fieldName];
        const error = validateField(
            fieldName,
            fieldValue,
            false,
            true,
        );

        if (error) {
            currentFormErrors[fieldName] = error;
            hasErrors = true;
        }
    });

    setFormErrors(currentFormErrors);

    // Si hay errores de validación, detener aquí
    if (hasErrors) {
        console.log("Form has validation errors, database call prevented:", currentFormErrors);
        setIsSaving(false); // Desactivar el spinner
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
    f.append("title", mypaper.title);
    f.append("authors", mypaper.authors);
    f.append("publicationYear", mypaper.publicationYear);
    f.append("type", JSON.stringify(mypaper.type)); // Si 'type' es un objeto
    f.append("publisher", mypaper.publisher);
    f.append("publicationData", mypaper.publicationData);
    f.append("abstractContent", mypaper.abstractContent);
    f.append("keywords", mypaper.keywords);
    f.append("notes", mypaper.notes);
    f.append("source", mypaper.source);
    f.append("scopus", mypaper.scopus);
    f.append("userId", userId.toString());


    // Añadir archivos al FormData
    if (files && files.length > 0) {
        files.forEach(file => {
            f.append("files", file);
        });
    }

    try {
        console.log("FormData a enviar:", f);
        console.log("paper:", JSON.stringify(mypaper));
        console.log("userId:", userId);

        // Usar la URL completa en lugar de relativa
        const baseUrl = "https://tfm-m1dn.onrender.com";
        const url = `${baseUrl}/api/v1/papers${paperId ? "/" + paperId : ""}`;
        
        console.log("URL de la solicitud:", url);
        
        const response = await fetch(url, {
            method: mypaper.id ? "PUT" : "POST",
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
            body: f,
        });

        console.log("Estado de la respuesta:", response.status);
        
        // Desactivar el spinner
        setIsSaving(false);

        if (response.ok) {
            // Primero verifiquemos si la respuesta es vacía
            const responseText = await response.text();
            console.log("Respuesta del servidor (texto):", responseText);
            
            if (!responseText || responseText.trim() === "") {
                console.log("Respuesta vacía del servidor, pero el estado es OK");
                // Si la operación fue exitosa pero no hay respuesta JSON, redirigir
                navigate(0);
                return;
            }
            
            try {
                const responseData = JSON.parse(responseText);
                console.log("Respuesta del servidor (JSON):", responseData);
                
                if (responseData.message) {
                    // Si hay un mensaje de error en la respuesta
                    console.error("Error en la respuesta:", responseData.message);
                    setModalShow(true);
                } else {
                    // Operación exitosa, redirigir
                    navigate(0);
                }
            } catch (error) {
                console.error("Error al parsear la respuesta JSON:", error);
                // Si no podemos parsear pero el status es OK, asumimos éxito
                if (response.status >= 200 && response.status < 300) {
                    navigate(0);
                } else {
                    setModalShow(true);
                }
            }
        } else {
            // Error en la respuesta
            const errorText = await response.text();
            console.error(`Error del servidor (${response.status}):`, errorText);
            setModalShow(true);
        }
    } catch (error) {
        // Error de conexión
        setIsSaving(false);
        console.error("Error de conexión:", error);
        setModalShow(true);
    }
    
    // Función auxiliar para manejar la respuesta
    async function handleResponse(response) {
        console.log("Estado de la respuesta:", response.status);
        
        // Desactivar el spinner
        setIsSaving(false);
        
        if (response.ok) {
            // Primero verifiquemos si la respuesta es vacía
            const responseText = await response.text();
            console.log("Respuesta del servidor (texto):", responseText);
            
            if (!responseText || responseText.trim() === "") {
                console.log("Respuesta vacía del servidor, pero el estado es OK");
                // Si la operación fue exitosa pero no hay respuesta JSON, redirigir
                navigate(0);
                return;
            }
            
            try {
                const responseData = JSON.parse(responseText);
                console.log("Respuesta del servidor (JSON):", responseData);
                
                if (responseData.message) {
                    // Si hay un mensaje de error en la respuesta
                    console.error("Error en la respuesta:", responseData.message);
                    setModalShow(true);
                } else {
                    // Operación exitosa, redirigir
                    navigate(0);
                }
            } catch (error) {
                console.error("Error al parsear la respuesta JSON:", error);
                // Si no podemos parsear pero el status es OK, asumimos éxito
                if (response.status >= 200 && response.status < 300) {
                    navigate(0);
                } else {
                    setModalShow(true);
                }
            }
        } else {
            // Error en la respuesta
            const errorText = await response.text();
            console.error(`Error del servidor (${response.status}):`, errorText);
            setModalShow(true);
        }
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

  // Reorganizar los inputs para que el título esté primero
  const titleInput = paperEditFormInputs.find((input) => input.name === "title")
  const authorsInput = paperEditFormInputs.find((input) => input.name === "authors")
  const typeInput = paperEditFormInputs.find((input) => input.name === "type")

  // Crear un nuevo array con el orden deseado
  const basicInfoInputs = titleInput
    ? [titleInput, authorsInput, typeInput]
    : [paperEditFormInputs[0], paperEditFormInputs[1], paperEditFormInputs[5]]

  const publicationInfoInputs = [paperEditFormInputs[2], paperEditFormInputs[3], paperEditFormInputs[4]]
  const contentInfoInputs = [paperEditFormInputs[6], paperEditFormInputs[7], paperEditFormInputs[8]]
  const additionalInfoInputs = [paperEditFormInputs[9], paperEditFormInputs[10]]

  const handleSaveClick = () => {
    handleSubmit()
  }

  // Función para validar todos los campos al cargar el formulario
  // Ahora solo se ejecuta cuando paperLoaded cambia a true
  useEffect(() => {
    if (paperLoaded) {
      // Si estamos editando un paper existente, no mostramos errores inicialmente
      if (paperId) {
        // No hacemos nada, esperamos a que el usuario interactúe con los campos
        console.log("Paper cargado para edición, esperando interacción del usuario")
      } else {
        // Si es un nuevo paper, podemos validar los campos requeridos
        const initialErrors = {}
        let hasInitialErrors = false

        paperEditFormInputs.forEach((input) => {
          if (input.isRequired) {
            const fieldName = input.name
            const fieldValue = fieldName === "type" ? paper.type?.name : paper[fieldName]
            const error = validateField(fieldName, fieldValue, false, false)

            if (error) {
              initialErrors[fieldName] = error
              hasInitialErrors = true
            }
          }
        })

        if (hasInitialErrors) {
          setFormErrors(initialErrors)
        }
      }
    }
  }, [paperLoaded])

  // Helper para truncar nombres de archivo largos
  const truncateFileName = (fileName, maxLength = 25) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExtension.substring(0, maxLength - extension.length - 3) + '...';
    return `${truncatedName}.${extension}`;
  };

  return (
    <div className="paper-edit-container">
      {/* Loading Spinner */}
      {isSaving && (
        <span class="loader"></span>
      )}

      <h2 className="page-title">{paper.id ? "Edit Paper" : "Add Paper"}</h2>
      <p className="page-description">Make changes to your paper information here. Click save when you're done.</p>

      <div className="paper-section-card">
        <h3 className="section-title">Basic Information</h3>
        <p className="section-description">Update your paper's basic details</p>

        <div className="form-fields">
          {basicInfoInputs.map((input, index) => (
            <div
              key={index}
              className={`form-field-wrapper ${input.name === "title" ? "full-width" : ""}`}
              data-field={input.name}
            >
              <label htmlFor={input.name} className="form-label">
                {input.tag} {input.isRequired && <span className="text-danger">*</span>}
              </label>
              {input.type === "select" ? (
                <>
                  <select
                    id={input.name}
                    name={input.name}
                    className={`form-input ${formErrors[input.name] ? "is-invalid" : ""}`}
                    value={paper.type.name}
                    onChange={input.handleChange}
                    required={input.isRequired}
                  >
                    {input.values.map((value, i) => (
                      <option key={i} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  {formErrors[input.name] && <div style={errorStyle}>{formErrors[input.name]}</div>}
                </>
              ) : (
                <>
                  <input
                    type={input.type}
                    id={input.name}
                    name={input.name}
                    className={`form-input ${formErrors[input.name] ? "is-invalid" : ""}`}
                    defaultValue={input.defaultValue}
                    onChange={input.handleChange}
                    required={input.isRequired}
                  />
                  {formErrors[input.name] && <div style={errorStyle}>{formErrors[input.name]}</div>}
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
                {input.tag} {input.isRequired && <span className="text-danger">*</span>}
              </label>
              <>
                <input
                  type={input.type}
                  id={input.name}
                  name={input.name}
                  className={`form-input ${formErrors[input.name] ? "is-invalid" : ""}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div style={errorStyle}>{formErrors[input.name]}</div>}
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
                {input.tag} {input.isRequired && <span className="text-danger">*</span>}
              </label>
              <>
                <textarea
                  id={input.name}
                  name={input.name}
                  className={`form-textarea ${formErrors[input.name] ? "is-invalid" : ""}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div style={errorStyle}>{formErrors[input.name]}</div>}
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
                {input.tag} {input.isRequired && <span className="text-danger">*</span>}
              </label>
              <>
                <input
                  type={input.type}
                  id={input.name}
                  name={input.name}
                  className={`form-input ${formErrors[input.name] ? "is-invalid" : ""}`}
                  defaultValue={input.defaultValue}
                  onChange={input.handleChange}
                  required={input.isRequired}
                />
                {formErrors[input.name] && <div style={errorStyle}>{formErrors[input.name]}</div>}
              </>
            </div>
          ))}
        </div>
      </div>

      <div className="paper-section-card">
        <h3 className="section-title">Files</h3>
        <p className="section-description">Upload or manage paper files</p>

        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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

        {/* Modified file selection display - now shows each file with a delete button */}
        {files && files.length > 0 && (
          <div className="selected-files-list">
            {files.map((file, index) => (
              <div key={index} className="selected-file-item">
                <div className="selected-file-info">
                  <FileText className="file-icon" />
                  <span className="selected-file-name">{truncateFileName(file.name)}</span>
                </div>
                <button
                  className="remove-file-button"
                  onClick={() => removeSelectedFile(index)}
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
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
        <button className="save-button" onClick={handleSaveClick} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Save"}
        </button>
      </div>
    </div>
  )
}
