
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
    paperFiles: [] // Asegurarse de que paperFiles esté inicializado
  }
  const user = tokenService.getUser()
  const jwt = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem("jwt") || '""') : ""
  const [modalShow, setModalShow] = useState(false)
  const [types, setTypes] = useState([])
  const [paper, setPaper] = useState(emptyItem)
  const [paperId, setPaperId] = useState(id)
  const [userId, setUserId] = useState(user.id)
  const editPaperFormRef = useRef()
  const [files, setFiles] = useState([]) // Archivos seleccionados para subir
  const [formErrors, setFormErrors] = useState({})
  const [paperLoaded, setPaperLoaded] = useState(false)
  const [touchedFields, setTouchedFields] = useState({})
  const [isSaving, setIsSaving] = useState(false) // Estado para controlar el spinner de carga
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL;

  // NUEVOS ESTADOS PARA POLLING
  const [uploadedFileProcessingStatus, setUploadedFileProcessingStatus] = useState([]); // Estado para archivos recién subidos y su estado de procesamiento
  const pollingIntervals = useRef({}); // Para almacenar los intervalos de polling por archivo

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
      return `The field can not be longer than 200 characters (actual: ${value.length})`
    }
    if (name === "authors" && value && value.length > 500) {
      return `The field can not be longer than 500 characters (actual: ${value.length})`
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
      const newFiles = filesArray.filter(newFile => 
        !prevFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
      );
      return [...prevFiles, ...newFiles];
    });
  };

  // Nueva función para eliminar un archivo seleccionado (antes de subirlo)
  const removeSelectedFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove))
  }

  // useEffect mejorado para limpiar intervalos
  useEffect(() => {
    // Función de limpieza que se ejecuta al desmontar
    return () => {
        console.log('Limpiando intervalos de polling...');
        Object.entries(pollingIntervals.current).forEach(([fileId, interval]) => {
            console.log(`Limpiando intervalo para archivo ${fileId}`);
            clearInterval(interval);
        });
        pollingIntervals.current = {};
    };
  }, []); // Solo al desmontar

  // Limpiar intervalos cuando no hay archivos procesándose
  useEffect(() => {
    if (uploadedFileProcessingStatus.length === 0) {
        Object.values(pollingIntervals.current).forEach(clearInterval);
        pollingIntervals.current = {};
    }
  }, [uploadedFileProcessingStatus]);

  useEffect(() => {
    if (paperId !== "" && paper.id == null) {
      fetch(`${API_BASE_URL}/api/v1/papers/${paperId}`, {
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
            setPaperLoaded(true) // Marcar que el paper se ha cargado
          }
        })
        .catch((m) => {
          setModalShow(true)
        })
    } else {
      setPaperLoaded(true) // Si no hay paperId, estamos creando uno nuevo
    }

    if (types.length === 0) {
      fetch(`${API_BASE_URL}/api/v1/papers/types`, {
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
  }, [paperId, types.length, jwt, API_BASE_URL]); // Dependencias para useEffect

  // Función para eliminar un archivo adjunto existente (ya en la DB)
   function removePaperFile(id) {
    // Eliminar inmediatamente el archivo de la UI
    setPaper((prevPaper) => ({
      ...prevPaper,
      paperFiles: prevPaper.paperFiles.filter((file) => file.id !== id),
    }))

    // Luego enviar la solicitud al servidor para eliminar el archivo
    fetch(`${API_BASE_URL}/api/v1/papers/${paperId}/delete/${id}`, {
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
        fetch(`${API_BASE_URL}/api/v1/papers/${paperId}`, {
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

  // Función para cancelar el polling de un archivo específico
  const cancelPolling = (fileIdToCancel) => {
    if (pollingIntervals.current[fileIdToCancel]) {
        console.log(`Cancelando polling para archivo ${fileIdToCancel}`);
        clearInterval(pollingIntervals.current[fileIdToCancel]);
        delete pollingIntervals.current[fileIdToCancel];
        
        setUploadedFileProcessingStatus(prevStatuses => 
            prevStatuses.filter(file => file.fileId !== fileIdToCancel)
        );
    }
  };

  // Función startPolling mejorada
  const startPolling = (paperIdToPoll, fileIdToPoll, fileName) => {
    // Verificar si ya existe un intervalo para este archivo
    if (pollingIntervals.current[fileIdToPoll]) {
        console.log(`Ya existe polling para archivo ${fileName}, saltando...`);
        return;
    }

    console.log(`Iniciando polling para archivo ${fileName} (ID: ${fileIdToPoll})`);
    
    let attemptCount = 0;
    const maxAttempts = 120; // 10 minutos máximo (120 * 5 segundos)

    const interval = setInterval(async () => {
        attemptCount++;
        
        // Timeout de seguridad
        if (attemptCount >= maxAttempts) {
            console.warn(`Polling timeout para archivo ${fileName} después de ${maxAttempts} intentos`);
            clearInterval(interval);
            delete pollingIntervals.current[fileIdToPoll];
            
            setUploadedFileProcessingStatus(prevStatuses =>
                prevStatuses.map(file =>
                    file.fileId === fileIdToPoll 
                        ? { ...file, status: "TIMEOUT" } 
                        : file
                )
            );
            return;
        }

        try {
            console.log(`Polling intento ${attemptCount} para archivo ${fileName}`);
            
            const statusResponse = await fetch(
                `${API_BASE_URL}/api/v1/papers/${paperIdToPoll}/files/${fileIdToPoll}/status`, 
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                    // Agregar timeout a la request si el navegador lo soporta
                    ...(AbortSignal.timeout && { signal: AbortSignal.timeout(10000) })
                }
            );

            // Manejar respuesta 404 específicamente
            if (statusResponse.status === 404) {
                console.warn(`Archivo ${fileName} no encontrado en el servidor`);
                setUploadedFileProcessingStatus(prevStatuses =>
                    prevStatuses.map(file =>
                        file.fileId === fileIdToPoll 
                            ? { ...file, status: "NOT_FOUND" } 
                            : file
                    )
                );
                clearInterval(interval);
                delete pollingIntervals.current[fileIdToPoll];
                return;
            }

            if (!statusResponse.ok) {
                throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
            }

            const statusData = await statusResponse.json();
            console.log(`Estado recibido para ${fileName}:`, statusData.status);

            // Actualizar el estado de `uploadedFileProcessingStatus`
            setUploadedFileProcessingStatus(prevStatuses => {
                const updated = prevStatuses.map(file =>
                    file.fileId === fileIdToPoll 
                        ? { ...file, status: statusData.status, lastUpdate: new Date().toISOString() } 
                        : file
                );
                
                // Si el archivo no estaba en la lista, añadirlo
                if (!updated.some(file => file.fileId === fileIdToPoll)) {
                    updated.push({ 
                        fileId: fileIdToPoll, 
                        fileName: fileName, 
                        status: statusData.status,
                        lastUpdate: new Date().toISOString()
                    });
                }
                return updated;
            });

            // Si el procesamiento ha terminado, detener el polling
            if (statusData.status === "COMPLETED" || statusData.status === "FAILED") {
                console.log(`Polling completado para ${fileName}. Estado final: ${statusData.status}`);
                clearInterval(interval);
                delete pollingIntervals.current[fileIdToPoll];
                
                // Recargar el paper para obtener la lista actualizada
                try {
                    const paperResponse = await fetch(`${API_BASE_URL}/api/v1/papers/${paperIdToPoll}`, {
                        headers: { Authorization: `Bearer ${jwt}` },
                    });
                    
                    if (paperResponse.ok) {
                        const updatedPaper = await paperResponse.json();
                        if (!updatedPaper.message) {
                            setPaper(updatedPaper);
                            // Remover de la lista de procesamiento después de un delay
                            setTimeout(() => {
                                setUploadedFileProcessingStatus(prevStatuses => 
                                    prevStatuses.filter(file => file.fileId !== fileIdToPoll)
                                );
                            }, 2000); // Dar tiempo para que el usuario vea el estado final
                        }
                    }
                } catch (error) {
                    console.error("Error al recargar paper después de polling:", error);
                }
            }
        } catch (error) {
            console.error(`Error en polling para archivo ${fileName} (intento ${attemptCount}):`, error);
            
            // Si es un error de timeout, no detener inmediatamente
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                console.log(`Timeout en intento ${attemptCount} para ${fileName}, continuando...`);
                return; // Continúa con el siguiente intento
            }
            
            // Para otros errores, detener después de varios intentos fallidos
            if (attemptCount >= 3) {
                console.error(`Deteniendo polling para ${fileName} después de ${attemptCount} errores`);
                clearInterval(interval);
                delete pollingIntervals.current[fileIdToPoll];
                setUploadedFileProcessingStatus(prevStatuses =>
                    prevStatuses.map(file =>
                        file.fileId === fileIdToPoll 
                            ? { ...file, status: "FAILED" } 
                            : file
                    )
                );
            }
        }
    }, 5000); // Poll cada 5 segundos

    pollingIntervals.current[fileIdToPoll] = interval;
  };

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
        doi: paper.doi,
        scopus: paper.scopus,
        user: paper.user,
    };

    const f = new FormData();
    f.append("title", mypaper.title);
    f.append("authors", mypaper.authors);
    f.append("publicationYear", mypaper.publicationYear);
    f.append("type", JSON.stringify(mypaper.type)); // Si 'type' es un objeto
    f.append("publisher", mypaper.publisher || ""); // Asegurarse de que no sea 'null' si es opcional
    f.append("publicationData", mypaper.publicationData || "");
    f.append("abstractContent", mypaper.abstractContent || "");
    f.append("keywords", mypaper.keywords || "");
    f.append("notes", mypaper.notes || "");
    f.append("source", mypaper.source || "");
    f.append("doi", mypaper.doi || "");
    f.append("scopus", mypaper.scopus || "");
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

        const url = `${API_BASE_URL}/api/v1/papers${paperId ? "/" + paperId : ""}`;
        
        console.log("URL de la solicitud:", url);
        
        const response = await fetch(url, {
            method: mypaper.id ? "PUT" : "POST",
            headers: {
                'Authorization': `Bearer ${jwt}`,
            },
            body: f,
        });

        console.log("Estado de la respuesta:", response.status);
        
        setIsSaving(false);

        if (response.ok) {
            const responseText = await response.text();
            console.log("Respuesta del servidor (texto):", responseText);
            
            if (!responseText || responseText.trim() === "") {
                console.log("Respuesta vacía del servidor, pero el estado es OK. Recargando...");
                navigate(0); // Recargar la página si no hay contenido.
                return;
            }
            
            try {
                const responseData = JSON.parse(responseText);
                console.log("Respuesta del servidor (JSON):", responseData);
                
                if (responseData.message) {
                    console.error("Error en la respuesta:", responseData.message);
                    setModalShow(true);
                } else {
                    // Si se creó un nuevo paper, actualiza paperId para futuras operaciones de edición
                    if (!paperId && responseData.paper && responseData.paper.id) {
                        setPaperId(responseData.paper.id);
                        setPaper(prevPaper => ({...prevPaper, id: responseData.paper.id, paperFiles: responseData.paper.paperFiles || []}));
                    } else if (paperId && responseData.paper) {
                        // Si es una actualización, refresca los datos del paper por si los paperFiles cambiaron
                        setPaper(responseData.paper);
                    }

                    // *** Lógica clave para manejar la respuesta asíncrona de archivos ***
                    if (responseData.uploadedFiles && responseData.uploadedFiles.length > 0) {
                        // Actualizar el estado de archivos recién subidos para su visualización de progreso
                        setUploadedFileProcessingStatus(responseData.uploadedFiles);
                        // Limpiar los archivos en el estado 'files' (los que están en el input de file)
                        setFiles([]);

                        // Iniciar el polling para cada archivo
                        responseData.uploadedFiles.forEach(fileInfo => {
                            // Asegurarse de que tenemos el paper.id real (podría ser recién creado)
                            const currentPaperId = responseData.paper ? responseData.paper.id : paper.id;
                            if (currentPaperId) {
                                startPolling(currentPaperId, fileInfo.fileId, fileInfo.fileName);
                            }
                        });

                        alert("Archivos subidos exitosamente. Procesando embeddings en segundo plano. Podrás ver el estado en la lista de archivos.");
                        // No navegamos, esperamos el polling para actualizar la UI

                    } else {
                        // Si no hay archivos nuevos, simplemente navegamos
                        navigate(0); // Recargar la página para reflejar los cambios básicos del paper
                    }
                }
            } catch (error) {
                console.error("Error al parsear la respuesta JSON:", error);
                if (response.status >= 200 && response.status < 300) {
                    navigate(0);
                } else {
                    setModalShow(true);
                }
            }
        } else {
            const errorText = await response.text();
            console.error(`Error del servidor (${response.status}):`, errorText);
            setModalShow(true);
        }
    } catch (error) {
        setIsSaving(false);
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
    paperEditFormInputs[11].defaultValue = paper.doi || ""
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

  const publicationInfoInputs = [paperEditFormInputs[2], paperEditFormInputs[3], paperEditFormInputs[4], paperEditFormInputs[11]]
  const contentInfoInputs = [paperEditFormInputs[6], paperEditFormInputs[7], paperEditFormInputs[8]]
  const additionalInfoInputs = [paperEditFormInputs[9], paperEditFormInputs[10]]

  const handleSaveClick = () => {
    handleSubmit()
  }

  // Función para validar todos los campos al cargar el formulario
  useEffect(() => {
    if (paperLoaded) {
      if (paperId) {
        // No validamos en la carga inicial para papers existentes
      } else {
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
  }, [paperLoaded]);

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
        <div className="overlay-spinner">
          <span className="loader"></span>
          <p>Guardando paper y subiendo archivos...</p>
        </div>
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
            <p className="upload-hint">PDF, DOC, DOCX (MAX. 199MB)</p> {/* Updated max size hint */}
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

        {/* Display for files selected for upload (before actual upload) */}
        {files && files.length > 0 && (
          <div className="selected-files-list">
            <h4 className="files-list-title">Files to Upload</h4>
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

        {/* Display for files that are currently processing (recently uploaded) */}
        {uploadedFileProcessingStatus.length > 0 && (
          <div className="processing-files-list">
            <h4 className="files-list-title">Processing Files</h4>
            {uploadedFileProcessingStatus.map((file, index) => (
              <div key={index} className="processing-file-item">
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span className="file-name">{truncateFileName(file.fileName)}</span>
                </div>
                <div className="file-processing-status">
                  {file.status === "PROCESSING" && (
                    <>
                      <Loader className="spinner" size={18} /> Procesando...
                    </>
                  )}
                  {file.status === "COMPLETED" && (
                    <span className="text-success">Completado &#10003;</span>
                  )}
                  {file.status === "FAILED" && (
                    <span className="text-danger">Fallido <X size={18} /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Display for already attached files (from backend) */}
        {paper.paperFiles && paper.paperFiles.length > 0 && (
          <div className="files-list">
            <h4 className="files-list-title">Attached Files</h4>
            {paper.paperFiles.map((paperFile, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <FileText className="file-icon" />
                  <span className="file-name">{truncateFileName(paperFile.name)}</span>
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
          {isSaving ? (
            <>
              <span className="loader"></span> Guardando...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  )
}