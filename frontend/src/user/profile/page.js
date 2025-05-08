import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar.tsx"
import { Button } from "../../components/ui/button.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.tsx"
import { User, Edit, Upload, Trash2  } from "lucide-react"
import tokenService from "../../services/token.service";
import { useState, useEffect, useRef } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu.tsx"
import { toast } from "../../components/ui/use-toast.tsx"
import "../../styles/globals.css"
import { SimpleProfileForm } from "./simpleForm.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet.tsx";
import { UserIcon, PencilIcon } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function UserProfile() {
  const user = tokenService.getUser();
  const [userData,setUserData] = useState({});
  const [message, setMessage] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [userId, setUserId] = useState(user.id);
  const [isUploading, setIsUploading] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState()
  const fileInputRef = useRef(null)
  const [favouritePapers, setFavoritePapers] = useState([])
  const [recommendedPapers, setRecommendedPapers] = useState([])
  const [profile, setProfile] = useState(userData);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(favouritePapers.length / itemsPerPage);
  const navigate = useNavigate();

  // Reiniciar la página si la lista de papers cambia
  useEffect(() => {
    setCurrentPage(0);
  }, [favouritePapers]);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const papersToShow = favouritePapers.slice(startIndex, endIndex);

  useEffect(() => {
    if (user && user.id) {
      setUpUser();
    } else {
      // Manejo de error si user.id no está disponible
      setMessage("Usuario no encontrado");
      setModalShow(true);
    }
 }, [userData]);

  async function setUpUser() {
    try {
      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}`, {
        headers: {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const userData = await response.json();
      setUserData(userData);
      setUserId(user.id);

    } catch (error) {
      setUserData({});
      setMessage(error.message);
      setModalShow(true);
    }
  }

  async function setUpAvatar() {
    try {
      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}/profileImage`, {
        headers: {},
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      const imageData = await response.blob();
      const imageUrl = URL.createObjectURL(imageData);
      setAvatarSrc(imageUrl);

    } catch (error) {
      setMessage(error.message);
      setModalShow(true);
    }
  }

  async function saveProfile(updatedProfile) {
    console.log("Profile being sent:", updatedProfile);
    try {

      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      setUserData(updatedProfile);
      navigate(0);
    } catch (error) {
      setMessage(error.message);
      setModalShow(true);
    }
  }

  async function setUpFavorite() {
    try {
      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}/favorite`, {
        headers: {
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const favorite = await response.json();
      setFavoritePapers(favorite);

    } catch (error) {
      setFavoritePapers([]);
      setMessage(error.message);
      setModalShow(true);
    }
  }

  useEffect(() => {
    if (userId) {
      setUpRecommended();
      setUpFavorite();
      setUpAvatar()
    }
  }, [userId]);

  async function setUpRecommended() {
    try {
      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}/recommended`, {
        headers: {
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const recommended = await response.json();
      setRecommendedPapers(recommended);

    } catch (error) {
      setRecommendedPapers([]);
      setMessage(error.message);
      setModalShow(true);
    }
  }

  const handleUploadAvatar = async (file) => {
    // Validar tipo de archivo
    if (!file.type.match(/image\/(jpeg|png)/)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos PNG o JPEG",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (opcional, por ejemplo 5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${user.id}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      await setUpAvatar()
      navigate(0);


      toast({
        title: "Imagen actualizada",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Función para eliminar la foto de perfil
  const handleDeleteAvatar = async () => {
    try {
      const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${user.id}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar la imagen")
      }

      // Restablecer a imagen por defecto o placeholder
      setAvatarSrc("/placeholder.svg?height=100&width=100")

      toast({
        title: "Imagen eliminada",
        description: "Tu foto de perfil ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error deleting avatar:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto de perfil",
        variant: "destructive",
      })
    }
  }

  // Manejador para cuando se selecciona un archivo
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUploadAvatar(file)
    }
  }

  // Función para abrir el selector de archivos
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="dark flex flex-col gap-4 max-w-5xl mx-auto p-4">
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />

      {/* Header Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative cursor-pointer group">
                  <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                    <AvatarImage src={avatarSrc} alt={`${userData.firstName} ${userData.lastName}`} />
                    <AvatarFallback className="bg-white-800 text-black">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-white bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={triggerFileInput} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>{isUploading ? "Subiendo..." : "Cambiar foto"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteAvatar} disabled={isUploading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Eliminar foto</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div>
              <h1 className="text-2xl font-bold text-black">
                {userData.firstName} {userData.lastName}
              </h1>
              <p className="text-gray-600">
              {userData.job && userData.job.title && userData.job.company ? `${userData.job.title} at ${userData.job.company}` 
                  : "No job specified"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 bg-white-800 text-black">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <PencilIcon className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
                  <SheetHeader>
                    <SheetTitle>Edit Your Profile</SheetTitle>
                    <SheetDescription>
                      Make changes to your profile information here. Click save when you're done.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6">
                  <SimpleProfileForm profile={userData || {}} onSave={saveProfile} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
        {/* Personal Info Section */}
        <div className="bg-white rounded-lg border border-gray-900 p-6" >
          <h2 className="text-xl font-semibold text-black mb-6">Personal Info</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-black-400 mb-2">Current Position</h3>
              <p className="text-gray-500">
                {userData?.job && userData.job.company? `${userData.job.title} in ${userData.job.company} for ${userData.job.years} year/s` : "No company information"}
              </p>
            </div>

            <div>
              <h3 className="text-black-400 mb-2">Studies</h3>
              <div className="space-y-4">
                {userData?.studies?.map((study, index) => (
                  <div key={index}>
                    <p className="text-gray font-medium">{study.degree}</p>
                    <p className="text-gray-500">
                      {study.institution}, {study.graduationYear}
                    </p>
                  </div>
                )) || <p className="text-gray-500">No studies available</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Research Papers Section */}
        <div className="bg-gray rounded-lg p-6 border border-gray-900">
          <h2 className="text-xl font-semibold text-black mb-6">Research Papers</h2>

          <Tabs defaultValue="favorite">
            <TabsList className="w-full bg-gray-200 mb-4 border border-gray-900">
              <TabsTrigger value="favorite" className="flex-1 data-[state=active]:bg-white">
                Favorite Papers
              </TabsTrigger>
              <TabsTrigger value="recommended" className="flex-1 data-[state=active]:bg-white">
                Recommended Papers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favorite" className="space-y-4 bg-white-900">
            {papersToShow.map((paper, index) => (
               <Link to={`/papers/${paper.id}`} key={index}>
              <div className="bg-white-900 rounded-lg p-4 border border-gray-900 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-black font-medium">{paper.title}</h3>
                    <p className="text-gray-500">{paper.authors}</p>
                  </div>
                  <span className="bg-black text-white text-xs px-2 py-1 rounded">
                    {paper.publicationYear}
                  </span>
                </div>
              </div>
              </Link>
            ))}

            {/* Controles de paginación */}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="text-black">Página {currentPage + 1} de {totalPages==0? totalPages + 1: totalPages}</span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </TabsContent>

            <TabsContent value="recommended" className="space-y-4 bg-white-900">
              {recommendedPapers.map((paper, index) => (
                <Link to={`/papers/${paper.id}`} key={index}>
                <div className="bg-white-900 rounded-lg p-4 border border-gray-900 mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-black font-medium">{paper.title}</h3>
                      <p className="text-gray-500">{paper.authors}</p>
                    </div>
                    <span className="bg-black text-white text-xs px-2 py-1 rounded">
                    {paper.publicationYear}
                  </span>
                  </div>
                </div>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

