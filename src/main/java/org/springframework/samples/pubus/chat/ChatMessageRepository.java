package org.springframework.samples.pubus.chat;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    @Query("SELECT m FROM ChatMessage m WHERE m.chatId = :chatId ORDER BY timestamp ASC")
    List<ChatMessage> findByChatIdOrderByTimestampAsc(Integer chatId);

    @Query("SELECT m FROM ChatMessage m WHERE m.chatId= :chatId AND m.sender <> :userId AND m.isRead = false")
    List<ChatMessage> findByChatIdAndSenderIdNotAndIsReadFalse(Integer chatId, Integer userId);
    
    // Nuevo método para marcar como leídos todos los mensajes en un chat que no fueron enviados por el usuario
    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.chatId = :chatId AND m.sender != :userId AND m.isRead = false")
    void updateMessagesSetReadByChatIdAndSenderIdNot(@Param("chatId") Integer chatId, @Param("userId") Integer userId);

}
