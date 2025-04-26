package org.springframework.samples.pubus.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.samples.pubus.user.User;
import org.springframework.samples.pubus.user.UserRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class ChatMessageService {
    
    private final ChatMessageRepository messageRepository;

    public ChatMessageService(ChatMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public List<ChatMessage> getChatMessages(Integer chatId){
        return this.messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }
    public void save(ChatMessage chatMessage){
        chatMessage.setIsRead(false);
        this.messageRepository.save(chatMessage);
    }

    public List<ChatMessage> getUnreadMessagesByChatIdAndUserId(Integer chatId, Integer userId) {
        // Buscar mensajes en el chat especificado que no fueron enviados por el usuario y que no están leídos
        return messageRepository.findByChatIdAndSenderIdNotAndIsReadFalse(chatId, userId);
    }
    
    // Nuevo método para marcar mensajes como leídos
    @Transactional
    public void markMessagesAsRead(Integer chatId, Integer userId) {
        // Marcar como leídos todos los mensajes del chat que no fueron enviados por el usuario
        messageRepository.updateMessagesSetReadByChatIdAndSenderIdNot(chatId, userId);
    }

}
