import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import '../../static/css/user/chatMessage.css';
import '../../static/css/user/chatMessage.css';

function ChatMessage({ currentUser, chatId, receiver }) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Desconectado');
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const subscriptionRef = useRef(null); // Referencia para la suscripción
    const processingMessageIdsRef = useRef(new Set()); // Para rastrear mensajes en procesamiento
    
    // Referencia para debug - guardar currentUser para diagnóstico
    const currentUserRef = useRef(null);
    
    useEffect(() => {
      currentUserRef.current = currentUser;
      console.log("Current User actualizado:", currentUser);
    }, [currentUser]);
  
    // Función para hacer scroll al último mensaje
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    const connectWebSocket = () => {
      try {
        if (stompClientRef.current && stompClientRef.current.connected) {
          stompClientRef.current.deactivate();
        }
  
        setConnectionStatus('Conectando...');
  
        const socket = new SockJS('https://tfm-m1dn.onrender.com/ws');
        const client = new Client({
          webSocketFactory: () => socket,
          debug: function (str) {
            console.log("STOMP Debug:", str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });
  
        client.onConnect = (frame) => {
          console.log("STOMP conectado con éxito:", frame);
          setConnectionStatus('Conectado');
          reconnectAttemptsRef.current = 0;
  
          // Para solucionar problema #2: Carga explícita de mensajes al reconectar
          loadMessages();
  
          // Suscripción al topic de chat
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
          }
          subscriptionRef.current = client.subscribe(`/topic/chat/${chatId}`, onMessageReceived);
          console.log(`Suscrito a /topic/chat/${chatId}`, subscriptionRef.current);
        };
  
        client.onStompError = (frame) => {
          console.error('Error STOMP:', frame);
          setConnectionStatus('Error de conexión');
          scheduleReconnect();
        };
  
        client.onWebSocketClose = () => {
          console.log("WebSocket cerrado");
          setConnectionStatus('Desconectado');
          scheduleReconnect();
        };
  
        client.onWebSocketError = (event) => {
          console.error("Error en WebSocket:", event);
          setConnectionStatus('Error de conexión');
          scheduleReconnect();
        };
  
        stompClientRef.current = client;
        client.activate();
  
      } catch (error) {
        console.error("Error al crear conexión WebSocket:", error);
        setConnectionStatus('Error de conexión');
        scheduleReconnect();
      }
    };
  
    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
  
      reconnectAttemptsRef.current += 1;
  
      if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
        const backoffTime = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 10000);
        console.log(`Intentando reconexión en ${backoffTime / 1000} segundos... (Intento ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, backoffTime);
      } else {
        console.error("Número máximo de intentos de reconexión alcanzado");
        setConnectionStatus('Conexión fallida - Recarga la página');
      }
    };
  
    // Función específica para cargar mensajes del servidor
    const loadMessages = () => {
      fetch(`https://tfm-m1dn.onrender.com/api/v1/message/${chatId}/messages`)
        .then(response => response.json())
        .then(data => {
          console.log("Mensajes cargados:", data);
          // Log para depuración: verificar formato de mensajes del servidor
          if (data.length > 0) {
            console.log("Ejemplo de mensaje del servidor:", data[0]);
            console.log("Tipo de sender:", typeof data[0].sender);
            console.log("Valor de sender:", data[0].sender);
          }
          // Reemplazar completamente los mensajes en lugar de fusionar
          setMessages(data);
          setTimeout(scrollToBottom, 100);
        })
        .catch(err => console.error("Error cargando mensajes:", err));
    };
  
    useEffect(() => {
      console.log(`Configurando chat para chatId: ${chatId}`);
      console.log("Usuario actual:", currentUser);
      
      // Cargar mensajes inicialmente
      loadMessages();
      
      // Conectar WebSocket
      connectWebSocket();
  
      return () => {
        console.log("Limpiando conexión WebSocket");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
        }
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        // Limpiar el conjunto de mensajes en procesamiento
        processingMessageIdsRef.current.clear();
      };
    }, [chatId]);
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    // Solución para problema #1: Manejar mensajes duplicados
    const onMessageReceived = (payload) => {
      try {
        console.log("Payload recibido:", payload);
        const receivedMessage = JSON.parse(payload.body);
        console.log("Mensaje recibido:", receivedMessage);
        
        // Si este mensaje lo envié yo y ya está siendo procesado, ignorarlo
        if (isCurrentUserMessage(receivedMessage) && 
            processingMessageIdsRef.current.has(receivedMessage.content + receivedMessage.timestamp)) {
          console.log("Ignorando mensaje duplicado que envié:", receivedMessage);
          processingMessageIdsRef.current.delete(receivedMessage.content + receivedMessage.timestamp);
          return;
        }
        
        // Verificar si el mensaje ya existe en la lista
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(m => m.id === receivedMessage.id);
          if (!messageExists) {
            return [...prevMessages, receivedMessage];
          }
          return prevMessages;
        });
      } catch (error) {
        console.error("Error procesando mensaje recibido:", error);
      }
    };
  
    const sendMessage = (event) => {
      event.preventDefault();
  
      if (messageInput.trim() && stompClientRef.current && stompClientRef.current.connected) {
        try {
          const messageContent = messageInput;
          setMessageInput(''); // Limpiar input inmediatamente
          
          // Obtener el ID del usuario actual
          const currentUserId = typeof currentUser === 'object' ? 
              (currentUser.id || currentUser.userId) : 
              currentUser;
              
          console.log("Mensaje será enviado como usuario:", currentUserId);
          
          const chatMessage = {
            sender: currentUserId,
            receiver: typeof receiver === 'object' ? receiver.id : receiver,
            content: messageContent,
            timestamp: new Date().toISOString(),
            chatId: chatId
          };
  
          console.log("Enviando mensaje:", chatMessage);
          
          // Solución problema #1: Marcar este mensaje como en procesamiento para evitar duplicados
          const messageKey = chatMessage.content + chatMessage.timestamp;
          processingMessageIdsRef.current.add(messageKey);
          
          // No mostrar el mensaje localmente, esperaremos a recibirlo por el WebSocket
          
          stompClientRef.current.publish({
            destination: `/app/chat.sendMessage/${chatId}`,
            body: JSON.stringify(chatMessage)
          });
          
          // Eliminar la marca después de 5 segundos por si acaso no recibimos respuesta
          setTimeout(() => {
            processingMessageIdsRef.current.delete(messageKey);
          }, 5000);
          
        } catch (error) {
          console.error("Error enviando mensaje:", error);
          setMessageInput(messageInput); // Restaurar el mensaje si falló
          alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
        }
      } else if (!stompClientRef.current?.connected) {
        console.warn("No conectado al servidor de chat");
        setConnectionStatus('Reconectando...');
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
          stompClientRef.current = null;
        }
        setTimeout(() => connectWebSocket(), 1000);
      }
    };
  
    // CORRECCIÓN: Función mejorada para determinar si un mensaje es del usuario actual
    const isCurrentUserMessage = (msg) => {
      // Obtener ID del usuario actual
      let currentUserId;
      if (currentUserRef.current) {
        currentUserId = typeof currentUserRef.current === 'object' ? 
          (currentUserRef.current.id || currentUserRef.current.userId) : 
          currentUserRef.current;
      } else {
        currentUserId = typeof currentUser === 'object' ? 
          (currentUser.id || currentUser.userId) : 
          currentUser;
      }
      
      // Obtener ID del remitente del mensaje
      let senderId;
      if (typeof msg.sender === 'object') {
        senderId = msg.sender.id || msg.sender.userId;
      } else {
        senderId = msg.sender;
      }
      
      // Log para depuración
      console.log(`Comparando - currentUserId: ${currentUserId}, senderId: ${senderId}`);
      
      // Convertir ambos a string para comparación consistente
      return String(currentUserId) === String(senderId);
    };
  
    const getReceiverDisplayName = () => {
      if (!receiver) return "Chat";
      if (typeof receiver === 'object') {
        return receiver.name || receiver.username || receiver.email || `Usuario ${receiver.id}`;
      }
      return `Usuario ${receiver}`;
    };
  
    // Función para mostrar los datos de un mensaje para depuración
    const debugMessage = (msg) => {
      const isFromCurrentUser = isCurrentUserMessage(msg);
      const senderInfo = typeof msg.sender === 'object' ? 
        `objeto con id: ${msg.sender.id}` : `valor: ${msg.sender}`;
      
      return `[${isFromCurrentUser ? 'MÍO' : 'OTRO'}] - Sender: ${senderInfo}`;
    };

    const formatMessageTime = (timestamp) => {
      if (!timestamp) return ""
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  
    return (
      <div className="chat-message-container">
        <div className="chat-header">
        <h3 style={{ color: 'black' }}>{getReceiverDisplayName()}</h3>
          <div className={`connection-status ${connectionStatus === 'Conectado' ? 'connected' : 'disconnected'}`}>
            {connectionStatus}
          </div>
          {/* Botón para refrescar mensajes manualmente */}
          <button 
            onClick={loadMessages} 
            className="refresh-button"
            title="Recargar mensajes"
          >
            🔄
          </button>
        </div>
  
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="no-messages">No hay mensajes. ¡Envía el primero!</div>
          ) : (
            messages.map((msg, index) => {
              const isMine = isCurrentUserMessage(msg);
              return (
                <div
                  key={msg.id || index}
                  className={`message ${isMine ? 'outgoing' : 'incoming'}`}
                >
                  <div className="message-content mr-4">{msg.content}</div>
                  <div className="message-time">
                    <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
  
        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="message-input"
          />
          <button
            type="submit"
            className="send-button"
            disabled={!stompClientRef.current?.connected}
          >
            Enviar
          </button>
        </form>
      </div>
    );
  }
  
  export default ChatMessage;