import React, { useState, useEffect, useCallback } from 'react';
import Chat from './messages.jsx';
import tokenService from "../../services/token.service";
import { Search, Send, MessageSquare } from "lucide-react"
import { Button } from "../../components/ui/button.tsx"
import { Input } from "../../components/ui/input.tsx"
import { ArrowRightSquare } from 'lucide-react';
import '../../static/css/user/chatList.css'; 
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet.tsx";
import { useNavigate } from 'react-router-dom';

function ChatList() {
    const currentUser = tokenService.getUser();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastMessages, setLastMessages] = useState({});
    const [loading, setLoading] = useState(true)
    const [messages, setMessages] = useState({})
    const [newMessage, setNewMessage] = useState("")
    const [imageUrl, setImageUrl] = useState("");
    const [unreadMessages, setUnreadMessages] = useState({});
    const[hasUnreadChats, setHasUnreadChats] = useState(false);
    const [profileImageUrls, setProfileImageUrls] = useState({});
    const [imageLoadingComplete, setImageLoadingComplete] = useState(false);
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const selectedChat = chats.find(c => c.id === selectedChatId)
    const receiver = selectedChat ? getReceiverFromChat(selectedChat, currentUser) : null;
    const receiverFirstName = receiver?.firstName;

    function useIsMobile() {
      const [isMobile, setIsMobile] = useState(false);

      useEffect(() => {
        const checkMobile = () => {
          setIsMobile(window.innerWidth < 768); // Tailwind `md` breakpoint
        };

        checkMobile(); // check initially
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
      }, []);

      return isMobile;
    }
  
    // Función para obtener mensajes no leídos
    const fetchUnreadMessages = useCallback((chatId) => {
      fetch(`${API_BASE_URL}/api/v1/message/${chatId}/unread/${currentUser.id}`)
        .then(response => response.json())
        .then(data => {
          setUnreadMessages(prev => ({
            ...prev,
            [chatId]: data.length > 0
          }));
        })
        .catch(error => console.error("Error fetching unread messages:", error));
    }, [currentUser.id]);

    useEffect(() => {
      setLoading(true)
      // Cargar lista de chats del usuario
      fetch(`${API_BASE_URL}/api/v1/chat/users/${currentUser.id}/chats`)
        .then(response => response.json())
        .then(data => {
            console.log('DATA', data);
            setChats(data);
            setLoading(false)
            
            // Obtener los mensajes no leídos para cada chat
            data.forEach(chat => {
              fetchUnreadMessages(chat.id);
            });
        })
        .catch(error => {
          console.error("Error fetching chats:", error);
          setLoading(false);
        });
    }, [currentUser.id, fetchUnreadMessages]); // Añadido fetchUnreadMessages a las dependencias

    useEffect(() => {
      const anyUnread = Object.values(unreadMessages).some(count => count > 0);
      setHasUnreadChats(anyUnread);
    }, [unreadMessages]);

    const getUserProfileImage = useCallback(async (userId) => {
      // Verificar si ya tenemos la URL de la imagen
      if (profileImageUrls[userId]) {
        return profileImageUrls[userId];
      }
      
      try {
          const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/profileImage`);
          if (response.ok) {
              const imageBlob = await response.blob();
              const imageUrl = URL.createObjectURL(imageBlob);
              return imageUrl;
          } else {
              console.error('Error al obtener la imagen de perfil');
              return null;
          }
      } catch (error) {
          console.error('Error de red al obtener la imagen de perfil:', error);
          return null;
      }
  }, [profileImageUrls]);

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.users.find(u => u.id !== currentUser.id);
    return otherUser && 
      (otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       otherUser.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Efecto para cargar las imágenes de perfil solo cuando cambian los chats o el término de búsqueda
  useEffect(() => {
    // Evitamos cargar imágenes si ya estamos en proceso de carga
    if (loading || imageLoadingComplete) return;
    
    async function loadProfileImages() {
      if (filteredChats.length === 0) return;
      
      const newUrls = {...profileImageUrls};
      let hasNewImages = false;
      
      for (const chat of filteredChats) {
        const otherUser = chat.users.find(u => u.id !== currentUser.id);
        if (otherUser && !newUrls[otherUser.id]) {
          const imageUrl = await getUserProfileImage(otherUser.id);
          if (imageUrl) {
            newUrls[otherUser.id] = imageUrl;
            hasNewImages = true;
          }
        }
      }
      
      if (hasNewImages) {
        setProfileImageUrls(newUrls);
      }
      
      setImageLoadingComplete(true);
    }
    
    loadProfileImages();
  }, [filteredChats, loading, currentUser.id, getUserProfileImage, imageLoadingComplete, profileImageUrls]);

  // Efecto para resetear el flag de carga completa cuando cambia el término de búsqueda
  useEffect(() => {
    setImageLoadingComplete(false);
  }, [searchTerm]);

    // Marcar mensajes como leídos cuando se selecciona un chat
    const handleSelectChat = (chatId) => {
      setSelectedChatId(chatId);
      
      // Marcar mensajes como leídos
      if (unreadMessages[chatId]) {
        fetch(`${API_BASE_URL}/api/v1/message/${chatId}/markread/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(() => {
          setUnreadMessages(prev => ({
            ...prev,
            [chatId]: false
          }));
        })
        .catch(error => console.error("Error marking messages as read:", error));
      }
    };

    const getLastMessage = (chat) => {
      const lastMsg = lastMessages[chat.id];
      return lastMsg ? lastMsg.content : "No messages yet";
    };

    const formatTime = (timestamp) => {
      // Placeholder - in a real app, you would format the actual timestamp
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    const formatMessageTime = (timestamp) => {
      if (!timestamp) return ""
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    const getUserDisplayName = (user) => {
      if (!user) return "Unknown User";
      return user.name? user.name: user.username;
    };

    useEffect(() => {
      // Evitamos ejecutar esto si no hay chats
      if (chats.length === 0) return;
      
      const fetchLastMessages = async () => {
        const newLastMessages = {...lastMessages};
        let updated = false;
        
        for (const chat of chats) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/v1/message/${chat.id}/messages`);
            const data = await response.json();
            
            if (data.length > 0) {
              const lastMessage = data[data.length - 1];
              // Solo actualizamos si el mensaje es diferente al que ya tenemos
              if (!newLastMessages[chat.id] || newLastMessages[chat.id].id !== lastMessage.id) {
                newLastMessages[chat.id] = lastMessage;
                updated = true;
              }
            }
          } catch (err) {
            console.error("Error cargando mensajes:", err);
          }
        }
        
        // Solo actualizamos el estado si hay cambios
        if (updated) {
          setLastMessages(newLastMessages);
        }
      };
      
      fetchLastMessages();
    }, [chats]); // Eliminada la dependencia de lastMessages para evitar bucles

    const handleSendMessage = () => {
      if (!newMessage.trim() || !selectedChatId) return
  
      const messageData = {
        chatId: selectedChatId,
        sender: currentUser.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
      }
  
      fetch(`${API_BASE_URL}/api/v1/message/${selectedChatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      })
        .then((response) => response.json())
        .then((data) => {
          // Add the new message to the messages state
          setMessages((prev) => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), data],
          }))
  
          // Update last message
          setLastMessages((prev) => ({
            ...prev,
            [selectedChatId]: data,
          }))
  
          // Clear input
          setNewMessage("")
        })
        .catch((error) => console.error("Error sending message:", error))
    }

    const handleNavigateToProfile = () => {
        if (receiver && receiver.id) {
            navigate(`/users/${receiver.id}`);
        } else {
            console.warn("Could not determine receiver ID for navigation.");
            // Optionally, provide user feedback here (e.g., a toast notification)
        }
    };
  
  
    return (
      <div className="chat-container mt-3 ml-3">
        {/* Sidebar */}
        <div className="chat-sidebar">
        <div className="chat-header">
          <h2 style={{ color: 'black' }}>Conversations</h2>
          <div className="search-container">
          <Search className="search-icon" size={16} />
          <div style={{ marginLeft: '20px' }}>
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none search-input"
            style={{border: "none !important"}}
            withBorder={false} 
          />
          </div>
        </div>
        </div>
  
          <div className="chat-list">
            {loading ? (
              <div className="loading-container">
                <div className="loading-skeleton">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="loading-item">
                      <div className="loading-avatar"></div>
                      <div className="loading-content">
                        <div className="loading-line loading-line-name"></div>
                        <div className="loading-line loading-line-message"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => {
                const otherUser = chat.users.find((u) => u.id !== currentUser.id);
                const isActive = selectedChatId === chat.id;
                const profileImageUrl = otherUser ? profileImageUrls[otherUser.id] : null;
                const hasUnread = unreadMessages[chat.id];
  
                return (
                  <div
                    key={chat.id}
                    className={`chat-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="avatar-container position-relative">
                      <div className="avatar">
                        {profileImageUrl ? (
                          <img 
                            src={profileImageUrl} 
                            alt={getUserDisplayName(otherUser)}
                            className="profile-image"
                          />
                        ) : (
                          getUserDisplayName(otherUser).charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="chat-info-container">
                      <div className="chat-top-row">
                        <span className="chat-name">{getUserDisplayName(otherUser)}</span>
                        <span className="chat-time">{formatTime(lastMessages[chat.id]?.timestamp)}</span>
                      </div>
                      <div className="chat-bottom-row">
                        <p className={`last-message ${hasUnread ? 'unread-message' : ''}`}>
                          {getLastMessage(chat)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {hasUnread && (
                        <div className="unread-dot">
                          {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-chats">{searchTerm ? "No conversations match your search" : "No conversations yet"}</div>
            )}
          </div>
        </div>
  
        {/* Main Chat Area */}
        {isMobile && (
        <Sheet open={!!selectedChatId} onOpenChange={(open) => {
            if (!open) setSelectedChatId(null)
          }}>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
              <SheetHeader>
                <SheetTitle>
                  <span>
                  Chat with{" "}
                  {/* Display the receiver's first name */}
                  {receiverFirstName}
                  </span>
                  {/* Show the button only if a chat is selected AND a receiver name is found */}
                  {selectedChatId && receiverFirstName && ( 
                      <button 
                          onClick={handleNavigateToProfile} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          aria-label={`Go to ${receiverFirstName}'s profile`}
                      >
                          <ArrowRightSquare size={24} /> {/* Adjust icon size as needed */}
                      </button>
                  )}
                </SheetTitle>
              </SheetHeader>

              {selectedChatId ? (
                <Chat
                  currentUser={currentUser}
                  chatId={selectedChatId}
                  receiver={getReceiverFromChat(chats.find(c => c.id === selectedChatId), currentUser)}
                />
              ) : (
                <div className="p-4 text-center">
                  <MessageSquare size={48} className="mx-auto mb-2 text-gray-400" />
                  <h3 className="text-lg font-semibold">Select a conversation</h3>
                  <p className="text-sm text-gray-500">Choose a conversation from the list to start chatting</p>
                </div>
              )}
            </SheetContent>
          </Sheet>
        )}
          {!selectedChatId ? (
        <div className="hidden md:flex flex-col items-center justify-center w-full h-full bg-gray-50">
          <MessageSquare size={64} className="mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-600">Select a conversation</h3>
          <p className="text-gray-500">Choose a chat from the list to start messaging</p>
        </div>
      ) : (
        <div className="hidden md:block flex-grow">
          <div className="chat-header border-b p-3">
            <h3 className="font-semibold">
              Chat with{" "}
                  {selectedChatId && getReceiverFromChat(chats.find(c => c.id === selectedChatId), currentUser)?.firstName}
            </h3>
          </div>
          <div className="h-[calc(100vh-7rem)] overflow-hidden">
            <Chat
              currentUser={currentUser}
              chatId={selectedChatId}
              receiver={getReceiverFromChat(chats.find(c => c.id === selectedChatId), currentUser)}
            />
          </div>
        </div>
      )}
      </div>
    );
  }
  
  function getReceiverFromChat(chat, currentUser) {
    // Para chats privados (1 a 1)
    return chat?.users.find(u => u.id !== currentUser.id);
  }

export default ChatList;