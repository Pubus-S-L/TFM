import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Send, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import '../../static/css/user/chatMessage.css';

function ChatMessage({ currentUser, chatId, receiver }) {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Desconectado');
    const [isLoading, setIsLoading] = useState(true);
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;
    const subscriptionRef = useRef(null);
    const processingMessageIdsRef = useRef(new Map());
    const API_BASE_URL = process.env.REACT_APP_API_URL;
    const connectionInProgressRef = useRef(false);
    const isMountedRef = useRef(true);
    
    // Scroll al último mensaje
    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);
  
    // Cargar mensajes del servidor
    const loadMessages = useCallback(async () => {
      if (!chatId) {
        console.error("No se pueden cargar mensajes: chatId es inválido");
        return;
      }
      
      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/message/${chatId}/messages`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar que todavía estamos en el mismo chat
        if (chatId !== chatId) {
          console.log("El chatId cambió durante la carga de mensajes, ignorando resultados");
          return;
        }
        
        if (!isMountedRef.current) return;
        
        console.log(`Mensajes cargados para chat ${chatId}:`, data.length);
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error(`Error cargando mensajes para chat ${chatId}:`, err);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }, [chatId, API_BASE_URL, scrollToBottom]);
  
    // Limpiar conexiones WebSocket existentes
    const cleanupConnection = useCallback(() => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        
        if (stompClientRef.current) {
          if (stompClientRef.current.connected) {
            stompClientRef.current.deactivate();
          }
          stompClientRef.current = null;
        }
      } catch (e) {
        console.warn("Error al limpiar conexiones:", e);
      }
      
      connectionInProgressRef.current = false;
      reconnectAttemptsRef.current = 0;
    }, []);
    
    // Función para programar reconexión con backoff exponencial
    const scheduleReconnect = useCallback(() => {
      if (!chatId || !isMountedRef.current) return;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
  
      reconnectAttemptsRef.current += 1;
  
      if (reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS) {
        const backoffTime = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 1000, 10000);
        console.log(`Intentando reconexión en ${backoffTime / 1000} segundos... (Intento ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connectWebSocket();
          }
        }, backoffTime);
      } else {
        console.error("Número máximo de intentos de reconexión alcanzado");
        if (isMountedRef.current) {
          setConnectionStatus('Conexión fallida - Recarga la página');
        }
      }
    }, [chatId]);
    
    // Procesar mensajes recibidos
    const onMessageReceived = useCallback((payload) => {
      try {
        const receivedMessage = JSON.parse(payload.body);
        console.log("Mensaje recibido:", receivedMessage);
        
        // Verificar que el mensaje sea para el chat actual
        if (!receivedMessage.chatId || 
            receivedMessage.chatId.toString() !== chatId?.toString()) {
          console.log(`Ignorando mensaje para otro chat: ${receivedMessage.chatId} (actual: ${chatId})`);
          return;
        }
        
        if (!isMountedRef.current) return;
        
        // Verificar si este mensaje lo envié yo y ya está siendo procesado
        const messageKey = receivedMessage.id || (receivedMessage.content + receivedMessage.timestamp);
        const isMyMessage = isCurrentUserMessage(receivedMessage);
        
        if (isMyMessage && processingMessageIdsRef.current.has(messageKey)) {
          console.log("Confirmado mensaje enviado, actualizando:", receivedMessage);
          processingMessageIdsRef.current.delete(messageKey);
          
          setMessages(prevMessages => prevMessages.map(msg => {
            if (msg._pending && msg.content === receivedMessage.content) {
              return {
                ...receivedMessage,
                _pending: false,
                _sendError: false
              };
            }
            return msg;
          }));
          return;
        }
        
        // Para todos los demás mensajes, verificar duplicados
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(m => 
            (m.id && m.id === receivedMessage.id) || 
            (m.content === receivedMessage.content && 
             isCurrentUserMessage(m) === isMyMessage)
          );
          
          if (!messageExists) {
            return [...prevMessages, receivedMessage];
          }
          return prevMessages;
        });
      } catch (error) {
        console.error("Error procesando mensaje recibido:", error);
      }
    }, [chatId]);
    
    // Función para crear una conexión WebSocket
    const connectWebSocket = useCallback(() => {
      // Evitar múltiples intentos de conexión simultáneos
      if (connectionInProgressRef.current || !chatId || !isMountedRef.current) {
        return;
      }
      
      connectionInProgressRef.current = true;
      
      try {
        // Limpieza de conexiones previas
        cleanupConnection();
        
        setConnectionStatus('Conectando...');
  
        const socket = new SockJS(`${API_BASE_URL}/ws`);
        const client = new Client({
          webSocketFactory: () => socket,
          debug: process.env.NODE_ENV !== 'production' ? 
            (str) => console.log("STOMP Debug:", str) : 
            () => {},
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });
  
        client.onConnect = (frame) => {
          console.log(`STOMP conectado con éxito para chat ${chatId}:`, frame);
          
          if (!isMountedRef.current) {
            client.deactivate();
            connectionInProgressRef.current = false;
            return;
          }
          
          setConnectionStatus('Conectado');
          reconnectAttemptsRef.current = 0;
  
          // Suscripción al topic de chat
          try {
            subscriptionRef.current = client.subscribe(`/topic/chat/${chatId}`, onMessageReceived);
            console.log(`Suscrito a /topic/chat/${chatId}`);
          } catch (e) {
            console.error("Error al suscribirse:", e);
          }
          
          connectionInProgressRef.current = false;
        };
  
        client.onStompError = (frame) => {
          console.error('Error STOMP:', frame);
          if (isMountedRef.current) {
            setConnectionStatus('Error de conexión');
            scheduleReconnect();
          }
          connectionInProgressRef.current = false;
        };
  
        client.onWebSocketClose = () => {
          console.log("WebSocket cerrado");
          if (isMountedRef.current) {
            setConnectionStatus('Desconectado');
            scheduleReconnect();
          }
          connectionInProgressRef.current = false;
        };
  
        client.onWebSocketError = (event) => {
          console.error("Error en WebSocket:", event);
          if (isMountedRef.current) {
            setConnectionStatus('Error de conexión');
            scheduleReconnect();
          }
          connectionInProgressRef.current = false;
        };
  
        stompClientRef.current = client;
        client.activate();
  
      } catch (error) {
        console.error("Error al crear conexión WebSocket:", error);
        if (isMountedRef.current) {
          setConnectionStatus('Error de conexión');
          scheduleReconnect();
        }
        connectionInProgressRef.current = false;
      }
    }, [API_BASE_URL, chatId, cleanupConnection, onMessageReceived, scheduleReconnect]);
    
    // Determinar si un mensaje es del usuario actual
    const isCurrentUserMessage = useCallback((msg) => {
      if (!msg || !msg.sender || !currentUser) {
        return false;
      }
      
      // Obtener ID del usuario actual
      const currentUserId = typeof currentUser === 'object' ? 
        (currentUser.id || currentUser.userId) : currentUser;
      
      if (!currentUserId) return false;
      
      // Obtener ID del remitente del mensaje
      const senderId = typeof msg.sender === 'object' ? 
        (msg.sender.id || msg.sender.userId) : msg.sender;
      
      if (!senderId) return false;
      
      return String(currentUserId) === String(senderId);
    }, [currentUser]);
  
    // Efecto principal para manejar el ciclo de vida del componente
    useEffect(() => {
      isMountedRef.current = true;
      
      // Configurar chat cuando cambia chatId
      if (chatId) {
        console.log(`Configurando chat para chatId: ${chatId}`);
        
        // Limpiar mensajes al cambiar de chat
        setMessages([]);
        setIsLoading(true);
        
        // Desconectar WebSocket actual y limpiar
        cleanupConnection();
        
        // Cargar mensajes y luego conectar WebSocket
        loadMessages().then(() => {
          if (isMountedRef.current) {
            connectWebSocket();
          }
        });
      } else {
        console.error("No se puede configurar chat: chatId es inválido");
      }
      
      // Limpieza al desmontar o cambiar chatId
      return () => {
        isMountedRef.current = false;
        cleanupConnection();
        processingMessageIdsRef.current.clear();
      };
    }, [chatId, cleanupConnection, connectWebSocket, loadMessages]);
  
    // Efecto para mantener scroll al fondo cuando llegan nuevos mensajes
    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom();
      }
    }, [messages, scrollToBottom]);
  
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
    
    // Función para obtener el nombre del receptor
    const getReceiverDisplayName = () => {
      if (!receiver) return "Chat";
      
      if (typeof receiver === 'object') {
        return receiver.username || `Usuario ${receiver.id || ''}`;
      }
      
      return `Usuario ${receiver || ''}`;
    };
    
    // Función para enviar mensaje
    const sendMessage = (event) => {
      event.preventDefault();
  
      const trimmedMessage = messageInput.trim();
      if (!trimmedMessage) return;
      
      if (!stompClientRef.current?.connected) {
        console.warn("No conectado al servidor de chat");
        setConnectionStatus('Reconectando...');
        connectWebSocket();
        return;
      }
      
      if (!chatId) {
        console.error("No se puede enviar mensaje: chatId es inválido");
        return;
      }

      try {
        setMessageInput(''); // Limpiar input inmediatamente
        
        // Obtener el ID del usuario actual
        const currentUserId = typeof currentUser === 'object' ? 
            (currentUser.id || currentUser.userId) : currentUser;
            
        const receiverId = typeof receiver === 'object' ? 
            (receiver.id || receiver.userId) : receiver;
            
        const chatMessage = {
          sender: currentUserId,
          receiver: receiverId,
          content: trimmedMessage,
          timestamp: new Date().toISOString(),
          chatId: chatId
        };

        console.log(`Enviando mensaje en chat ${chatId}:`, chatMessage);
        
        // Generar una clave única para este mensaje
        const messageKey = trimmedMessage + chatMessage.timestamp;
        processingMessageIdsRef.current.set(messageKey, Date.now());
        
        // Optimistic UI update
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            ...chatMessage,
            _tempId: tempId,
            _pending: true
          }
        ]);
        
        stompClientRef.current.publish({
          destination: `/app/chat.sendMessage/${chatId}`,
          body: JSON.stringify(chatMessage)
        });
        
        // Timeout para detectar mensajes no confirmados
        setTimeout(() => {
          if (processingMessageIdsRef.current.has(messageKey)) {
            console.warn("El servidor no confirmó la recepción del mensaje después de 5s");
            processingMessageIdsRef.current.delete(messageKey);
            
            if (isMountedRef.current) {
              setMessages(prevMessages => prevMessages.map(msg => {
                if (msg._tempId === tempId) {
                  return { ...msg, _sendError: true, _pending: false };
                }
                return msg;
              }));
            }
          }
        }, 5000);
        
      } catch (error) {
        console.error("Error enviando mensaje:", error);
        setMessageInput(trimmedMessage); // Restaurar el mensaje si falló
        alert("Error al enviar el mensaje. Por favor, inténtalo de nuevo.");
      }
    };
  
    return (
      <div className="chat-message-container">
        <div className="chat-header">
          <h3 style={{ color: 'black' }}>{getReceiverDisplayName()}</h3>
          <div className={`connection-status ${connectionStatus === 'Conectado' ? 'connected' : 'disconnected'}`}>
            {connectionStatus === 'Conectado' ? (
              <Wifi size={16} className="inline-block mr-1" />
            ) : (
              <WifiOff size={16} className="inline-block mr-1" />
            )}
            <span className="status-text">{connectionStatus}</span>
          </div>
          <button 
            onClick={loadMessages} 
            className="refresh-button"
            title="Recargar mensajes"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
  
        <div className="messages-container">
          {isLoading && messages.length === 0 ? (
            <div className="loading-messages">Cargando mensajes...</div>
          ) : messages.length === 0 ? (
            <div className="no-messages">No hay mensajes. ¡Envía el primero!</div>
          ) : (
            messages.map((msg, index) => {
              const isMine = isCurrentUserMessage(msg);
              return (
                <div
                  key={msg.id || msg._tempId || `${msg.content}-${msg.timestamp}-${index}`}
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
            placeholder="Escribe un mensaje..."
            className="message-input"
          />
          <button
            type="submit"
            disabled={!stompClientRef.current?.connected || !messageInput.trim() || isLoading}
            className="ml-1 flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-[20px] disabled:cursor-not-allowed text-white px-4 py-2 transition-colors"
            aria-label="Send"
          >
            <span className="hidden sm:inline">Enviar</span>
            <Send className="sm:hidden w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }
  
  export default ChatMessage;