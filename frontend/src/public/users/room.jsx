import React, { useState, useEffect, useCallback } from 'react';
import Chat from './messages.jsx';
import tokenService from "../../services/token.service";
import { Search, Send, MessageSquare } from "lucide-react"
import { Button } from "../../components/ui/button.tsx"
import { Input } from "../../components/ui/input.tsx"
import '../../static/css/user/chatList.css'; 


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
  
    // Función para obtener mensajes no leídos
    const fetchUnreadMessages = useCallback((chatId) => {
      fetch(`https://tfm-m1dn.onrender.com/api/v1/message/${chatId}/unread/${currentUser.id}`)
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
      fetch(`https://tfm-m1dn.onrender.com/api/v1/chat/users/${currentUser.id}/chats`)
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

    const getUserProfileImage = useCallback(async (user) => {
      try {
          const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/users/${user.id}/profileImage`);
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
  }, []);

  const filteredChats = chats.filter(chat => {
    const otherUser = chat.users.find(u => u.id !== currentUser.id);
    return otherUser && 
      (otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       otherUser.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  });

    useEffect(() => {
      async function loadProfileImages() {
          const urls = {};
          for (const chat of filteredChats) {
              const otherUser = chat.users.find(u => u.id !== currentUser.id);
              if (otherUser) {
                  const imageUrl = await getUserProfileImage(otherUser);
                  if (imageUrl) {
                      urls[otherUser.id] = imageUrl;
                  }
              }
          }
          setProfileImageUrls(urls);
      }
  
      if (filteredChats.length > 0) {
          loadProfileImages();
      }
  }, [filteredChats, getUserProfileImage, currentUser.id]); // Cambiado currentUser por currentUser.id

    // Marcar mensajes como leídos cuando se selecciona un chat
    const handleSelectChat = (chatId) => {
      setSelectedChatId(chatId);
      
      // Marcar mensajes como leídos
      if (unreadMessages[chatId]) {
        fetch(`https://tfm-m1dn.onrender.com/api/v1/message/${chatId}/markread/${currentUser.id}`, {
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
      return user.name || user.username || user.email || `User ${user.id}`;
    };

    useEffect(() => {
      // Evitamos ejecutar esto si no hay chats
      if (chats.length === 0) return;
      
      const fetchLastMessages = async () => {
        const newLastMessages = {...lastMessages};
        let updated = false;
        
        for (const chat of chats) {
          try {
            const response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/message/${chat.id}/messages`);
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
  
      fetch(`https://tfm-m1dn.onrender.com/api/v1/message/${selectedChatId}`, {
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
  
  
    return (
      <div className="chat-container mt-3">
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
                const profileImageUrl = profileImageUrls[otherUser?.id];
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
        <div className="chat-main">
          {selectedChatId ? (
            <Chat 
              currentUser={currentUser} 
              chatId={selectedChatId} 
              receiver={getReceiverFromChat(chats.find(c => c.id === selectedChatId), currentUser)}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="placeholder-icon">
                <MessageSquare size={48} />
              </div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  function getReceiverFromChat(chat, currentUser) {
    // Para chats privados (1 a 1)
    return chat?.users.find(u => u.id !== currentUser.id);
  }

export default ChatList;