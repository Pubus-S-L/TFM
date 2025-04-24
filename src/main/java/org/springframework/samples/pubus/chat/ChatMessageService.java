package org.springframework.samples.pubus.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserRepository;
import org.springframework.stereotype.Repository;

@Repository
public class ChatMessageService {
    
    private final ChatMessageRepository messageRepository;
    //private final ChatRoomRepository chatRoomRepository;
    //private final UserRepository userRepository;

    public ChatMessageService(ChatMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
        //this.chatRoomRepository = chatRoomRepository;
        //this.userRepository = userRepository;
    }

    // public void saveMessage(Message message, Integer roomId) {
    //     ChatMessage chatMessage = new ChatMessage();
    //     chatMessage.setCreatedDate(LocalDateTime.now());
    //     chatMessage.setMessage(message.getMessage());
    //     Optional<User> user = userRepository.findByUsername(message.getSenderName());
    //     chatMessage.setMessageCreator(user.get());
    //     ChatRoom chatRoom = this.chatRoomRepository.findById(roomId).get();
    //     chatMessage.setChatRoom(chatRoom);
    //     this.messageRepository.save(chatMessage);
    // }
    // public List<ChatMessage> getAllMessagesFromRoom(Integer roomId) {
    //     return this.messageRepository.findByChatRoomId(roomId);
    // }

    public List<ChatMessage> getChatMessages(Integer chatId){
        return this.messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }
    public void save(ChatMessage chatMessage){
        this.messageRepository.save(chatMessage);
    }


}
