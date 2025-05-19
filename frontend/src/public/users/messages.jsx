import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import '../../static/css/user/chatMessage.css';

function ChatMessage({ currentUser, chatId, receiver }) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [isLoading, setIsLoading] = useState(true);
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const subscriptionRef = useRef(null);
    const processingMessageIdsRef = useRef(new Map());
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const currentUserRef = useRef(null);
    const currentChatIdRef = useRef(null);
    const connectionInProgressRef = useRef(false);
    
    // Actualizar las referencias cuando cambian los props
    useEffect(() => {
      currentUserRef.current = currentUser;
      console.log("Current User actualizado:", currentUser);
    }, [currentUser]);

    useEffect(() => {
      currentChatIdRef.current = chatId;
      console.log("Chat ID actualizado:", chatId);
    }, [chatId]);
  
    // Función para hacer scroll al último mensaje
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    // Función mejorada para conectar WebSocket
    const connectWebSocket = async () => {
      // Evitar múltiples intentos de conexión simultáneos
      if (connectionInProgressRef.current) {
        console.log("Conexión ya en progreso, ignorando solicitud");
        return;
      }
      
      connectionInProgressRef.current = true;
      
      try {
        // Asegurarse de cerrar correctamente conexiones anteriores
        if (stompClientRef.current) {
          try {
            if (subscriptionRef.current) {
              subscriptionRef.current.unsubscribe();
              subscriptionRef.current = null;
            }
            
            if (stompClientRef.current.connected) {
              await new Promise((resolve) => {
                stompClientRef.current.deactivate();
                setTimeout(resolve, 300); // Dar tiempo para desconexión limpia
              });
            }
          } catch (error) {
            console.warn("Error al cerrar conexión anterior:", error);
          }
        }
  
        if (!currentChatIdRef.current) {
          console.error("No se puede conectar: chatId es inválido");
          setConnectionStatus('Error: Chat inválido');
          connectionInProgressRef.current = false;
          return;
        }
  
        setConnectionStatus('Connecting...');
  
        const socket = new SockJS(`${API_BASE_URL}/ws`);
        const client = new Client({
          webSocketFactory: () => socket,
          debug: function (str) {
            // Reducir logs en producción
            if (process.env.NODE_ENV !== 'production') {
              console.log("STOMP Debug:", str);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });
  
        client.onConnect = (frame) => {
          console.log(`STOMP Connected con éxito para chat ${currentChatIdRef.current}:`, frame);
          
          // Verificar que todavía estamos en el mismo chat que solicitó la conexión
          if (currentChatIdRef.current !== chatId) {
            console.log(`El chatId cambió durante la conexión (${currentChatIdRef.current} -> ${chatId}), desconectando`);
            client.deactivate();
            connectionInProgressRef.current = false;
            return;
          }
          
          setConnectionStatus('Connected');
          reconnectAttemptsRef.current = 0;
  
          // Suscripción al topic de chat
          try {
            subscriptionRef.current = client.subscribe(`/topic/chat/${currentChatIdRef.current}`, onMessageReceived);
            console.log(`Suscrito a /topic/chat/${currentChatIdRef.current}`, subscriptionRef.current);
          } catch (e) {
            console.error("Error al suscribirse:", e);
          }
          
          connectionInProgressRef.current = false;
        };
  
        client.onStompError = (frame) => {
          console.error('Error STOMP:', frame);
          setConnectionStatus('Error de conexión');
          scheduleReconnect();
          connectionInProgressRef.current = false;
        };
  
        client.onWebSocketClose = () => {
          console.log("WebSocket cerrado");
          setConnectionStatus('Disconnected');
          scheduleReconnect();
          connectionInProgressRef.current = false;
        };
  
        client.onWebSocketError = (event) => {
          console.error("Error en WebSocket:", event);
          setConnectionStatus('Error de conexión');
          scheduleReconnect();
          connectionInProgressRef.current = false;
        };
  
        stompClientRef.current = client;
        client.activate();
  
      } catch (error) {
        console.error("Error al crear conexión WebSocket:", error);
        setConnectionStatus('Error de conexión');
        scheduleReconnect();
        connectionInProgressRef.current = false;
      }
    };
  
    const scheduleReconnect = () => {
      // Solo programar reconexión si estamos en un chat válido
      if (!currentChatIdRef.current) return;
      
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
  
    // Función mejorada para cargar mensajes del servidor
    const loadMessages = async () => {
      if (!currentChatIdRef.current) {
        console.error("No se pueden cargar mensajes: chatId es inválido");
        return;
      }
      
      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/message/${currentChatIdRef.current}/messages`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar que todavía estamos en el mismo chat que solicitó los mensajes
        if (currentChatIdRef.current !== chatId) {
          console.log(`El chatId cambió durante la carga de mensajes (${currentChatIdRef.current} -> ${chatId}), ignorando resultados`);
          return;
        }
        
        console.log(`Mensajes cargados para chat ${currentChatIdRef.current}:`, data.length);
        
        if (data.length > 0) {
          console.log("Ejemplo de mensaje del servidor:", data[0]);
        }
        
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error(`Error cargando mensajes para chat ${currentChatIdRef.current}:`, err);
      } finally {
        setIsLoading(false);
      }
    };
  
    // Efecto principal para configurar el chat al cambiar chatId
    useEffect(() => {
      console.log(`Configurando chat para chatId: ${chatId}`);
      
      if (!chatId) {
        console.error("No se puede configurar chat: chatId es inválido");
        return;
      }
      
      // Limpiar inmediatamente los mensajes al cambiar de chat para evitar mostrar mensajes del chat anterior
      setMessages([]);
      setIsLoading(true);
      
      // Actualizar la referencia del chatId actual
      currentChatIdRef.current = chatId;
      
      // Desconectamos la conexión WebSocket actual si existe
      const cleanupPrevious = async () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        if (subscriptionRef.current) {
          try {
            subscriptionRef.current.unsubscribe();
          } catch (e) {
            console.warn("Error al desubscribirse durante cambio de chat:", e);
          }
          subscriptionRef.current = null;
        }
        
        if (stompClientRef.current && stompClientRef.current.connected) {
          try {
            await new Promise((resolve) => {
              stompClientRef.current.deactivate();
              setTimeout(resolve, 300); // Pequeña pausa para asegurar desconexión limpia
            });
          } catch (e) {
            console.warn("Error al desconectar durante cambio de chat:", e);
          }
        }
        
        // Resetear estado de conexión
        reconnectAttemptsRef.current = 0;
        connectionInProgressRef.current = false;
        
        // Limpiar el mapa de mensajes en procesamiento
        processingMessageIdsRef.current.clear();
      };
      
      // Ejecutar limpieza y luego iniciar nueva conexión
      cleanupPrevious().then(() => {
        // Cargar mensajes primero, luego conectar WebSocket
        loadMessages().then(() => connectWebSocket());
      });
      
      return () => {
        console.log(`Limpiando conexión WebSocket para chat ${chatId}`);
        cleanupPrevious();
      };
    }, [chatId]);
  
    // Mantener scroll al fondo cuando llegan nuevos mensajes
    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom();
      }
    }, [messages]);
  
    // Mejorado el manejo de mensajes recibidos
    const onMessageReceived = (payload) => {
      try {
        const receivedMessage = JSON.parse(payload.body);
        console.log("Mensaje recibido:", receivedMessage);
        
        // Verificar que el mensaje sea para el chat actual
        if (!receivedMessage.chatId || 
            receivedMessage.chatId.toString() !== currentChatIdRef.current?.toString()) {
          console.log(`Ignorando mensaje para otro chat: ${receivedMessage.chatId} (actual: ${currentChatIdRef.current})`);
          return;
        }
        
        // Si este mensaje lo envié yo y ya está siendo procesado, ignorarlo
        const messageKey = receivedMessage.id || (receivedMessage.content + receivedMessage.timestamp);
        if (isCurrentUserMessage(receivedMessage) && processingMessageIdsRef.current.has(messageKey)) {
          console.log("Confirmado mensaje enviado:", receivedMessage);
          processingMessageIdsRef.current.delete(messageKey);
          return;
        }
        
        // Verificar si el mensaje ya existe en la lista
        setMessages(prevMessages => {
          // Verificar por ID (preferido) o por combinación de contenido y timestamp
          const messageExists = prevMessages.some(m => 
            (m.id && m.id === receivedMessage.id) || 
            (m.content === receivedMessage.content && 
             m.timestamp === receivedMessage.timestamp)
          );
          
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
  
      const trimmedMessage = messageInput.trim();
      if (!trimmedMessage) {
        return;
      }
      
      if (!stompClientRef.current?.connected) {
        console.warn("No conectado al servidor de chat");
        setConnectionStatus('Reconectando...');
        connectWebSocket();
        return;
      }
      
      if (!currentChatIdRef.current) {
        console.error("No se puede enviar mensaje: chatId es inválido");
        return;
      }

      try {
        setMessageInput(''); // Limpiar input inmediatamente
        
        // Obtener el ID del usuario actual
        const currentUserId = typeof currentUserRef.current === 'object' ? 
            (currentUserRef.current.id || currentUserRef.current.userId) : 
            currentUserRef.current;
            
        console.log("Mensaje será enviado como usuario:", currentUserId);
        
        const receiverId = typeof receiver === 'object' ? 
            (receiver.id || receiver.userId) : 
            receiver;
            
        console.log("Mensaje será enviado a usuario:", receiverId);
        
        const chatMessage = {
          sender: currentUserId,
          receiver: receiverId,
          content: trimmedMessage,
          timestamp: new Date().toISOString(),
          chatId: currentChatIdRef.current
        };

        console.log(`Enviando mensaje en chat ${currentChatIdRef.current}:`, chatMessage);
        
        // Generar una clave única para este mensaje
        const messageKey = trimmedMessage + chatMessage.timestamp;
        processingMessageIdsRef.current.set(messageKey, Date.now());
        
        // Optimistic UI update - Mostrar mensaje inmediatamente
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            ...chatMessage,
            _pending: true // Marcarlo como pendiente para UI
          }
        ]);
        
        stompClientRef.current.publish({
          destination: `/app/chat.sendMessage/${currentChatIdRef.current}`,
          body: JSON.stringify(chatMessage)
        });
        
        // Establecer un timeout para eliminar la marca después de 5 segundos 
        setTimeout(() => {
          if (processingMessageIdsRef.current.has(messageKey)) {
            console.warn("El servidor no confirmó la recepción del mensaje después de 5s");
            processingMessageIdsRef.current.delete(messageKey);
            
            // Opcional: Actualizar la UI para indicar que el mensaje podría no haberse enviado
            setMessages(prevMessages => prevMessages.map(msg => {
              if (msg.content === trimmedMessage && msg.timestamp === chatMessage.timestamp) {
                return { ...msg, _sendError: true };
              }
              return msg;
            }));
          }
        }, 5000);
        
      } catch (error) {
        console.error("Error enviando mensaje:", error);
        setMessageInput(trimmedMessage); // Restaurar el mensaje si falló
        alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
      }
    };
  
    // Función mejorada para determinar si un mensaje es del usuario actual
    const isCurrentUserMessage = (msg) => {
      if (!msg || !msg.sender) {
        return false;
      }
      
      // Obtener ID del usuario actual - usar ref para tener el valor más actualizado
      let currentUserId = null;
      if (currentUserRef.current) {
        currentUserId = typeof currentUserRef.current === 'object' ? 
          (currentUserRef.current.id || currentUserRef.current.userId) : 
          currentUserRef.current;
      }
      
      if (!currentUserId) {
        console.error("No se puede determinar el ID del usuario actual");
        return false;
      }
      
      // Obtener ID del remitente del mensaje
      let senderId = null;
      if (typeof msg.sender === 'object') {
        senderId = msg.sender.id || msg.sender.userId;
      } else {
        senderId = msg.sender;
      }
      
      if (!senderId) {
        console.error("No se puede determinar el ID del remitente del mensaje");
        return false;
      }
      
      // Convertir ambos a string para comparación consistente
      return String(currentUserId) === String(senderId);
    };
  
    // Función mejorada para obtener el nombre del receptor
    const getReceiverDisplayName = () => {
      if (!receiver) return "Chat";
      
      if (typeof receiver === 'object') {
        return receiver.username || 
               `Usuario ${receiver.username}`;
      }
      
      return `Usuario ${receiver.username}`;
    };
  
    // Función para formatear la hora del mensaje
    const formatMessageTime = (timestamp) => {
      if (!timestamp) return "";
      try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } catch (error) {
        console.error("Error al formatear la hora:", error);
        return "";
      }
    };
  
    return (
      <div className="chat-message-container">
        <div className="chat-header">
          <h3 style={{ color: 'black' }}>{getReceiverDisplayName()}</h3>
          <div className={`connection-status ${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}>
            {connectionStatus === 'Connected' ? (
              <Wifi size={16} className="inline-block mr-1" />
            ) : (
              <WifiOff size={16} className="inline-block mr-1" />
            )}
            <span className="status-text">{connectionStatus}</span>
          </div>
          <button 
            onClick={loadMessages} 
            className="refresh-button"
            title="Reload messages"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
  
        <div className="messages-container">
          {isLoading && messages.length === 0 ? (
            <div className="loading-messages">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">Theres is no messages. ¡Send the first one!</div>
          ) : (
            messages.map((msg, index) => {
              const isMine = isCurrentUserMessage(msg);
              return (
                <div
                  key={msg.id || `${msg.content}-${msg.timestamp}-${index}`}
                  className={`message ${isMine ? 'outgoing' : 'incoming'} ${msg._pending ? 'pending' : ''} ${msg._sendError ? 'send-error' : ''}`}
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
            placeholder="Write a message..."
            className="message-input"
          />
          <button
            type="submit"
            disabled={!stompClientRef.current?.connected || !messageInput.trim() || isLoading}
            className="ml-1 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-[20px] disabled:cursor-not-allowed text-white px-4 py-2 transition-colors"
            aria-label="Send"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="sm:hidden w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }
  
  export default ChatMessage;