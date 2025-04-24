package org.springframework.samples.pubus.chat;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.websocket.server.PathParam;

@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "Chat", description = "The Chat management API")
@SecurityRequirement(name = "bearerAuth")
public class ChatRoomController {
    
    private final ChatRoomService chatRoomService;
    private final UserService userService;

    @Autowired
    public ChatRoomController(ChatRoomService chatRoomService, UserService userService) {
        this.chatRoomService = chatRoomService;
        this.userService = userService;
    }

    @PostMapping("/create/{userId}/{userId2}")
    public ResponseEntity<ChatRoom> createChatRoom(@PathVariable("userId") Integer userId, @PathVariable("userId2") Integer userId2) {
        ChatRoom chatRoom = chatRoomService.createRoom(userId , userId2);
        return ResponseEntity.ok(chatRoom);
    }

    @GetMapping("/users/{userId}/chats")
    public ResponseEntity<List<ChatRoom>> getUserRooms(@PathVariable("userId") Integer userId) {
        List<ChatRoom> chatRooms = this.chatRoomService.getChatRoomsByUserId(userId);
        return ResponseEntity.ok(chatRooms);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ChatRoom> getChatRoom(@PathVariable("roomId") Integer roomId) {
        ChatRoom chatRoom = this.chatRoomService.findChatRoomById(roomId);
        return ResponseEntity.ok(chatRoom);
    }
}
