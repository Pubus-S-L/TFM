package org.springframework.samples.pubus.paper;

import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaperFileRepository extends JpaRepository<PaperFile, Integer> {
    
	@Query("SELECT f FROM PaperFile f WHERE f.paper.id = :paperId")
    List<PaperFile> findByPaperId(@Param("paperId") int paperId) throws DataAccessException;

    @Query("SELECT f FROM PaperFile f WHERE f.paper.user.id = :userId")
    List<PaperFile> findByUserId(@Param("userId") int userId) throws DataAccessException;

}
