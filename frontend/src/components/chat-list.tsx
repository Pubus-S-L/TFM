import type { Message } from "ai"
import { Avatar } from "../components/ui/avatar.tsx"
import { cn } from "../lib/utils.ts"

interface ChatListProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatList({ messages, isLoading }: ChatListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 p-4 rounded-lg",
            message.role === "user" ? "bg-blue-50" : "bg-white border border-gray-100",
          )}
        >
          <Avatar className={cn("h-8 w-8", message.role === "user" ? "bg-blue-500" : "bg-gray-500")}>
            <span className="text-xs text-white">{message.role === "user" ? "U" : "AI"}</span>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium mb-1">{message.role === "user" ? "You" : "Assistant"}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 p-4 rounded-lg bg-white border border-gray-100">
          <Avatar className="h-8 w-8 bg-gray-500">
            <span className="text-xs text-white">AI</span>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium mb-1">Assistant</div>
            <div className="text-sm text-gray-700">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div
                  className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

