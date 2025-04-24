package org.springframework.samples.pubus.chat;

import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Integer> {

    @Query("SELECT c FROM ChatRoom c JOIN c.users u WHERE u.id = :userId")
    List<ChatRoom> findByUserId(@Param("userId") int userId) throws DataAccessException;
    
}
