import React, { useState, useEffect } from 'react';
import Chat from './messages.jsx';
import tokenService from "../../services/token.service";
import '../../static/css/user/chatList.css'; // We'll create this file for styling

function ChatList() {
    const currentUser = tokenService.getUser();
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
  
    useEffect(() => {
      // Cargar lista de chats del usuario
      fetch(`/api/v1/chat/users/${currentUser.id}/chats`)
        .then(response => response.json())
        .then(data => {
            console.log('DATA', data);
            setChats(data);
        })
        .catch(error => console.error("Error fetching chats:", error));
    }, [currentUser]);

    // Filter chats based on search term
    const filteredChats = chats.filter(chat => {
      const otherUser = chat.users.find(u => u.id !== currentUser.id);
      return otherUser && 
        (otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         otherUser.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const getLastMessage = (chat) => {
      // Placeholder for last message - in a real app, you would get this from your chat data
      return chat.lastMessage || "No messages yet";
    };

    const formatTime = (timestamp) => {
      // Placeholder - in a real app, you would format the actual timestamp
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    const getUserDisplayName = (user) => {
      if (!user) return "Unknown User";
      return user.name || user.username || user.email || `User ${user.id}`;
    };
  
    return (
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-header">
            <h2>Conversations</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
            </div>
          </div>
          
          <div className="chat-list">
            {filteredChats.length > 0 ? (
              filteredChats.map(chat => {
                const otherUser = chat.users.find(u => u.id !== currentUser.id);
                const isActive = selectedChatId === chat.id;
                
                return (
                  <div 
                    key={chat.id} 
                    className={`chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className="avatar">
                      {/* Use the first letter of the user's name as avatar placeholder */}
                      {getUserDisplayName(otherUser).charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-info">
                      <div className="chat-top-row">
                        <span className="chat-name">{getUserDisplayName(otherUser)}</span>
                        <span className="chat-time">{formatTime(chat.lastMessageTime)}</span>
                      </div>
                      <div className="chat-bottom-row">
                        <p className="last-message">{getLastMessage(chat)}</p>
                        {chat.unreadCount > 0 && (
                          <span className="unread-badge">{chat.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-chats">
                {searchTerm ? "No conversations match your search" : "No conversations yet"}
              </div>
            )}
          </div>
        </div>
        
        <div className="chat-main">
          {selectedChatId ? (
            <Chat 
              currentUser={currentUser} 
              chatId={selectedChatId} 
              receiver={getReceiverFromChat(chats.find(c => c.id === selectedChatId), currentUser)}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="placeholder-icon">💬</div>
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