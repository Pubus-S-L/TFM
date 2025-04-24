"use client"

import { useState } from "react"
import { Button } from "../components/ui/button.tsx"
import { X } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
}

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New message",
      message: "You have a new message from John",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
    },
    {
      id: "2",
      title: "System update",
      message: "The chat system has been updated",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
    },
    {
      id: "3",
      title: "Welcome!",
      message: "Welcome to the chat application",
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: false,
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Notifications</h3>
        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No notifications</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md ${notification.read ? "bg-white" : "bg-blue-50"} border border-gray-100`}
            >
              <div className="flex justify-between">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
              {!notification.read && (
                <Button variant="ghost" size="sm" className="text-xs mt-2" onClick={() => markAsRead(notification.id)}>
                  Mark as read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

