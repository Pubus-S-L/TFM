package org.springframework.samples.pubus.chat;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    // @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId")
    // List<ChatMessage> findByChatRoomId(@Param("roomId") Integer roomId);

    @Query("SELECT m FROM ChatMessage m WHERE m.chatId = :chatId ORDER BY timestamp ASC")
    List<ChatMessage> findByChatIdOrderByTimestampAsc(Integer chatId);
    
}
