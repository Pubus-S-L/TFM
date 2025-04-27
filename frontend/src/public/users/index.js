import React from "react";
import { useEffect, useState, useRef } from "react";
import "../../static/css/user/myProfile.css";
import "../../static/css/auth/authButton.css";
import { Link } from "react-router-dom";
import Chat from "./chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.tsx"
import { Button } from "../../components/ui/button.tsx"
import { User} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar.tsx"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet.tsx";
import tokenService from "../../services/token.service";
import ChatMessage from "./messages"


export default function UserDetail() {
    let pathArray = window.location.pathname.split("/");
    const [user,setUser] = useState();  
    const [userId, setUserId]= useState(pathArray[2]);
    const [papers,setPapers] = useState([]); 
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 2;
    const totalPages = Math.ceil(papers.length / itemsPerPage);
    const [imageUrl, setImageUrl] = useState("");
    const currentUser = tokenService.getUser()
    const [otherUserId,setOtherUserId] = useState(currentUser ? currentUser.id : null);
    const [room, setRoom] = useState(null)
    const [roomExist, setRoomExist] = useState(false)
    const [hasFetched, setHasFetched] = useState(false);
    const [contactSheetOpen, setContactSheetOpen] = useState(false);
  
    // Reiniciar la página si la lista de papers cambia
    useEffect(() => {
      setCurrentPage(0);
    }, [papers]);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const papersToShow = papers
    .filter(
        (paper) =>
            paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            paper.authors.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(startIndex, endIndex);

    async function setUp() {
        try {
            let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${userId}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }
    
            let user = await response.json();
            setUser(user);
        } catch (error) {
            console.error("Error during data fetching:", error);
        }
    }
    

    useEffect(() => {
        setUp();
    },);


    async function setUpPapers() {
        try {
            let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/users/${userId}?search=${searchTerm}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
    
           
    
            let papers = await response.json();
            setPapers(papers);
        } catch (error) {
            console.error("Error during data fetching:", error);
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
        setImageUrl(imageUrl);
  
      } catch (error) {
      }
    }

    useEffect(() => {
        setUpPapers();
        setUpAvatar();
    },  [userId]);


    useEffect(() => {
      if (currentUser && !hasFetched) {
        // Cargar lista de chats del usuario
        fetch(`https://tfm-m1dn.onrender.com/api/v1/chat/users/${currentUser.id}/chats`)
          .then(response => response.json())
          .then(data => {
            console.log('DATA', data);
            // Verificar si en alguno de los chats está el usuario con id igual a userId
            const roomExists = data.some(chat =>
              chat.users?.some(user => user.id === parseFloat(userId))
            )
            setRoomExist(roomExists);
            if(roomExists){
              const chatRoomEncontrado = data.find(chatRoom =>
                chatRoom.users.some(user => user.id === currentUser.id)
              );
              setRoom(chatRoomEncontrado)
          }
            setHasFetched(true); // Marca que la petición se ha realizado
          })
          .catch(error => console.error('Error al cargar chats:', error));
      }
    }, [currentUser, userId, hasFetched]);

    const handleCreateChat = async () => {
      try {
        const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/chat/create/${userId}/${otherUserId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        })
        const data = await response.json()
        console.log(data)
        setRoom(data)
        setRoomExist(true)
        console.log("Room ID:", data.id)
      } catch (error) {
        console.error("Error creating chat room:", error)
      }
    }

    

    return (
    <div className="dark flex flex-col gap-4 max-w-5xl mx-auto p-4">
      {/* Header Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
          <div className="relative group">
                <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                    <AvatarImage src={imageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                    <AvatarFallback className="bg-white-800 text-black">
                    <User className="h-8 w-8" />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600">
              {user?.job && user?.job?.title && user?.job?.company ? `${user.job.title} at ${user.job.company}` 
                  : "No job specified"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 bg-white-800 text-black">
              <Sheet>
                <SheetTrigger asChild>
                    <Button className="bg-white text-black hover:bg-gray-800 transition-colors border border-black"> 
                    ChatE
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
                <SheetHeader>
                    <SheetTitle>Chat with PubusChat</SheetTitle>
                    <SheetDescription>
                      You can ask anything about papers published by {user?.firstName} {user?.lastName}
                    </SheetDescription>
                  </SheetHeader>
                  <div style={{ width: '100%' }}>
                  <Chat/>
                </div>
                </SheetContent>
              </Sheet>
              <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
                <SheetTrigger asChild>
                  <Button onClick={(e) => {
                    if (!currentUser){
                      e.preventDefault();
                      alert("You have to log in to use this feature");
                    }else{
                      if (!roomExist) handleCreateChat()
                        setContactSheetOpen(true)
                    }
                  }}
                  className="bg-black text-white hover:bg-gray-800 transition-colors">
                    Contact Me
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
                <SheetHeader>
                    <SheetTitle>Chat with {user?.firstName} {user?.lastName}</SheetTitle>
                  </SheetHeader>
                  { roomExist ? (
                    <ChatMessage
                      currentUser={currentUser} 
                      chatId={room.id} 
                      receiver={user}
                    />
                ): (<p>Loading chat...</p>)} 
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
                {user?.job && user.job.company? `${user.job.title} in ${user.job.company} for ${user.job.years} year/s` : "No company information"}
              </p>
            </div>

            <div>
              <h3 className="text-black-400 mb-2">Studies</h3>
              <div className="space-y-4">
                {user?.studies?.map((study, index) => (
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
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search"
                    className="w-full p-2 border border-gray-300 rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <Tabs defaultValue="myPapers">
                <TabsContent value= "myPapers" className="space-y-4 bg-white-900">
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

                    <span className="text-black">Página {currentPage + 1} de {totalPages}</span>

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 bg-gray-200 text-black rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
                </TabsContent>
            </Tabs> 
        </div>
    </div>
</div>
);
}
