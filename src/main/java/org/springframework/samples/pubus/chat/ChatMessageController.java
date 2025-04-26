package org.springframework.samples.pubus.chat;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.samples.pubus.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/message")
@Tag(name = "Message", description = "The Message management API")
@SecurityRequirement(name = "bearerAuth")
public class ChatMessageController {

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ChatMessageService messageService;

    @Autowired
    public ChatMessageController(SimpMessagingTemplate simpMessagingTemplate, ChatMessageService messageService) {
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.messageService = messageService;
    }

    @MessageMapping("/chat.sendMessage/{chatId}")
    @SendTo("/topic/chat/{chatId}")
    public ChatMessage sendMessage(@DestinationVariable Integer chatId, ChatMessage chatMessage) {
        messageService.save(chatMessage);
        return chatMessage;
    }
    
    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Integer chatId) {
        return ResponseEntity.ok(messageService.getChatMessages(chatId));
    }

    @GetMapping("/{chatId}/unread/{userId}")
    public ResponseEntity<List<ChatMessage>> getUnreadMessages(@PathVariable Integer chatId, @PathVariable Integer userId) {
        return ResponseEntity.ok(messageService.getUnreadMessagesByChatIdAndUserId(chatId, userId));
    }

    // Nuevo endpoint para marcar mensajes como leídos
    @PutMapping("/{chatId}/markread/{userId}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable Integer chatId, @PathVariable Integer userId) {
        messageService.markMessagesAsRead(chatId, userId);
        return ResponseEntity.ok().build();
    }
}
