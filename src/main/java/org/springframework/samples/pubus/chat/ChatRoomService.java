package org.springframework.samples.pubus.chat;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

@Service
public class ChatRoomService {
    
    private final ChatRoomRepository chatRoomRepository;
    private final UserService userService;

    @Autowired
    public ChatRoomService(ChatRoomRepository chatRoomRepository, UserService userService) {
        this.chatRoomRepository = chatRoomRepository;
        this.userService = userService;
    }

    public ChatRoom createRoom(Integer userId, Integer userId2) {
        List<Integer> userIds = new ArrayList<>();
        userIds.add(userId);
        userIds.add(userId2);
        ChatRoom chatRoom = new ChatRoom();
        User user = this.userService.findUser(userId);
        User user2 = this.userService.findUser(userId2);
        chatRoom.setUsers(List.of(user, user2));
        chatRoom = this.chatRoomRepository.save(chatRoom);
        return chatRoom;
    }

    public List<ChatRoom> getChatRoomsByUserId(Integer userId) {
        List<ChatRoom> chatRooms = this.chatRoomRepository.findByUserId(userId);
        return chatRooms;
    }


    public List<User> getUsersChatRoom(@PathVariable Integer roomId) {
        List<User> users = this.chatRoomRepository.findById(roomId).get().getUsers();
        return users;
    }

    public ChatRoom findChatRoomById(Integer roomId) {
        return this.chatRoomRepository.findById(roomId).orElseThrow();
    }

}
