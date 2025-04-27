import React, { useState, useEffect } from "react";
import secret from "../../secret.json"
import "../../static/css/user/chat.css";

const Chat = () => {
  let pathArray = window.location.pathname.split("/"); 
  const [userId,setUserId] = useState(pathArray[2]);
  const [messages, setMessages] = useState([]); // Lista de mensajes del chat
  const [input, setInput] = useState(""); // Mensaje que escribe el usuario
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const prompt = async function createPrompt(userMessage) {
    const params = new URLSearchParams({ text: userMessage });
    let data = [{}];
    try {
        let response = await fetch(`https://tfm-m1dn.onrender.com/api/v1/papers/users/${userId}/prompt?${params.toString()}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }
        data = await response.json();
        
    } catch (error) {
        console.error("Error during data fetching:", error);
    }
    return data;
}

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    const model = "gpt-3.5-turbo";

    const contextResponse = await prompt(input);
    console.log(contextResponse)

    const context = contextResponse? contextResponse.prompt : input;
    console.log(context)
    const reference = contextResponse? contextResponse.reference : input;
    console.log(reference)

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: `${context}` },
          ...messages.map((msg) => ({ role: msg.sender === "user" ? "user" : "assistant", content: msg.text })),
          { role: "user", content: input },
        ],
      })
    };


    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
      // Agregar la respuesta de la API a la lista de mensajes
      const data = await response.json();
      const botMessage = { sender: "bot", text: data.choices[0].message.content, reference: reference };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error al comunicarse con OpenAI:", error);
      const errorMessage = { sender: "bot", text: "Hubo un error al procesar tu mensaje." };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setInput(""); // Limpiar el input
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    const welcomeMessage = {
      sender: "bot",
      text: "¡Hola! Soy Pubus 🤖. ¿En qué puedo ayudarte hoy?",
    };
    setMessages([welcomeMessage]);
  }, []);

  return (
    <div className="pubus-chat-container">
      <div className="pubus-chat-header">Chat con Pubus</div>
      <div className="pubus-chat-messages">
      {messages.map((msg, index) => (
        <div key={index} className={`pubus-message ${msg.sender}`}>
          <div className="pubus-message-bubble">
            {msg.text}
            {/* Mostrar referencia si existe */}
            {msg.sender === "bot" && msg.reference && (
              <div className="pubus-reference">
                📚 <strong>Referencia:</strong> {msg.reference}
              </div>
            )}
          </div>
        </div>
      ))}
      </div>
      <div className="pubus-chat-footer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
};

export default Chat;
