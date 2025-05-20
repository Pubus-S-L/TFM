import "../../../static/css/user/myPaperList.css";
import "../../../static/css/auth/authButton.css";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import like from "../../../static/images/like.png";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card.tsx"
import { Input } from "../../../components/ui/input.tsx";
import _ from "lodash"; // Asegúrate de tener lodash instalado

export default function Papers() {
  const [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [types, setTypes] = useState([]);
  const [typesSelected, setTypeSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  
  // Cargar tipos de papers una sola vez al montar el componente
  useEffect(() => {
    async function fetchTypes() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/papers/types`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch paper types');
        }
        
        const types = await response.json();
        setTypes(types);
      } catch (error) {
        console.error("Error loading paper types:", error);
      }
    }
    
    fetchTypes();
  }, [API_BASE_URL]);

  // Creamos una versión con debounce de la función para evitar múltiples llamadas
  const debouncedFetchPapers = useCallback(
    _.debounce(async (search, selectedTypes) => {
      setIsLoading(true);
      try {
        // Construimos la URL con todos los parámetros necesarios
        let url = `${API_BASE_URL}/api/v1/papers?search=${search || ''}`;
        
        // Agregamos los tipos seleccionados como parámetros de consulta
        if (selectedTypes.length > 0) {
          url += `&types=${selectedTypes.join(',')}`;
        }
        
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch papers');
        }
        
        const data = await response.json();
        setPapers(data);
      } catch (error) {
        console.error("Error loading papers:", error);
        setPapers([]);
      } finally {
        setIsLoading(false);
      }
    }, 500), // 500ms de debounce
    [API_BASE_URL]
  );

  // Manejar cambios en los filtros
  useEffect(() => {
    debouncedFetchPapers(searchTerm, typesSelected);
    
    // Limpieza al desmontar para cancelar cualquier solicitud pendiente
    return () => {
      debouncedFetchPapers.cancel();
    };
  }, [searchTerm, typesSelected, debouncedFetchPapers]);

  // Manejar cambios en los checkboxes
  const handleTypeChange = (e) => {
    const { value, checked } = e.target;
    
    setTypeSelected(prev => {
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter(type => type !== value);
      }
    });
  };

  return (
    <div>
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
       
        <Card className="flex flex-wrap items-center mt-3 p-2 shadow-lg border border-gray-200 bg-white">
          <CardHeader className="pr-1">
            <CardTitle className="text-sm font-bold whitespace-nowrap">Filter by:</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-center gap-1.5 p-0">
            {types.map((type, index) => (
              <label key={index} className="flex justify-center gap-1 text-xs">
                <input
                  type="checkbox"
                  value={type.name}
                  checked={typesSelected.includes(type.name)}
                  onChange={handleTypeChange}
                />
                {type.name}
              </label>
            ))}
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="w-4/5 p-4 text-center mx-auto mt-6">
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
                    <p><strong>Type:</strong> {paper.type?.name}</p>
                    {paper.likes != null && paper.likes > 0 && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 self-start">
                        <Heart size={16} className="text-red-500" />
                        {paper.likes}
                      </span>
                    )}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="w-4/5 p-4 text-center mx-auto mt-6">
            <CardContent>
              <p className="text-lg font-semibold">No papers available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}