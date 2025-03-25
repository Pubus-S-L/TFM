import React, { useState } from "react";
import axios from "axios";
import secret from "../../secret.json"
import "../../static/css/user/chat.css";
// import CohereClient from "cohere-ai";

const Chat = () => {
  let pathArray = window.location.pathname.split("/"); 
  const [userId,setUserId] = useState(pathArray[2]);
  const [messages, setMessages] = useState([]); // Lista de mensajes del chat
  const [input, setInput] = useState(""); // Mensaje que escribe el usuario
  const apiKey = secret.OPENAI_API_KEY;
  // const cohereKey = secret.COHERE_API_KEY;

  const prompt = async function createPrompt(userMessage) {
    const params = new URLSearchParams({ text: userMessage });
    let data = "";
    try {
        let response = await fetch(`/api/v1/papers/users/${userId}/prompt?${params.toString()}`, {
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
    return data.prompt;
}

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    const model = "gpt-3.5-turbo";

    const contextResponse = await prompt(input);
    console.log(contextResponse)

    const context = contextResponse? contextResponse : input;

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
      const botMessage = { sender: "bot", text: data.choices[0].message.content };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error al comunicarse con OpenAI:", error);
      const errorMessage = { sender: "bot", text: "Hubo un error al procesar tu mensaje." };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setInput(""); // Limpiar el input
  };

  return (
    <div className="chat-container">
      <div className="chat-header">Chat con Pubus</div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-bubble">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
};

export default Chat;
