import type { Message } from "ai"
import { generateId } from "ai"

// In a real application, this would use a database
// For this example, we'll use localStorage in the browser
export async function createChat(): Promise<string> {
  const id = generateId()
  if (typeof window !== "undefined") {
    localStorage.setItem(`chat-${id}`, JSON.stringify([]))
  }
  return id
}

export async function loadChat(id: string): Promise<Message[]> {
  if (typeof window !== "undefined") {
    const chat = localStorage.getItem(`chat-${id}`)
    return chat ? JSON.parse(chat) : []
  }
  return []
}

export async function saveChat({
  id,
  messages,
}: {
  id: string
  messages: Message[]
}): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(`chat-${id}`, JSON.stringify(messages))
  }
}

// Helper function to append AI response messages to the chat
export function appendResponseMessages({
  messages,
  responseMessages,
}: {
  messages: Message[]
  responseMessages: Message[]
}): Message[] {
  return [...messages, ...responseMessages]
}

