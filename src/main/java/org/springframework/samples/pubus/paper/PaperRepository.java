package org.springframework.samples.pubus.paper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.dao.DataAccessException;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaperRepository extends CrudRepository<Paper, Integer> {

	@Query("SELECT ptype FROM PaperType ptype ORDER BY ptype.name")
	List<PaperType> findPaperTypes() throws DataAccessException;

	@Query("SELECT ptype FROM PaperType ptype WHERE ptype.name LIKE :name")
	Optional<PaperType> findPaperTypeByName(String name) throws DataAccessException;

	@Query("SELECT p FROM Paper p WHERE LOWER(p.abstractContent) LIKE %:word%")
	List<Paper> findAllPapersByAbstractWord(@Param("word") String word);

	@Query("SELECT p FROM Paper p WHERE LOWER(p.keywords) LIKE %:word%")
	List<Paper> findAllPapersByKeyWord(@Param("word") String word);

	@Query("SELECT p FROM Paper p WHERE p.title = :title")
	Paper findByExactTitle(@Param("title")String title);

	@Query("SELECT p FROM Paper p WHERE LOWER(p.title) LIKE %:title%")
	List<Paper> findByTitle(@Param("title")String title);

	@Query("SELECT p FROM Paper p WHERE p.type.name LIKE :name")
	List<Paper> findAllPapersByPaperType(@Param("name") String name) throws DataAccessException;

	@Query(("SELECT p FROM Paper p WHERE p.user.id = :id"))
	List<Paper> findAllPapersByUserId(@Param("id") int id) throws DataAccessException;

	@Query(("SELECT p FROM Paper p WHERE p.user.id = :id"))
	List<Paper> findAllPapersLikedByUserId(@Param("id") int id) throws DataAccessException;

	@Query(("SELECT p FROM Paper p WHERE LOWER(p.authors) LIKE %:author%"))
	List<Paper> findAllPapersByAuthor(@Param("author") String author);

	@Query(("SELECT COUNT(p) FROM Paper p WHERE p.user.id = :id"))
	public Integer countPapersByUser(int id);

	@Query("SELECT COUNT(p) FROM Paper p")
	public Integer countAll();

	@Query("SELECT COUNT(u) FROM User u")
	public Integer countAllUsers();

	@Query("SELECT NEW MAP(p.type.name as type, cast(COUNT(p) as string) as papers) FROM Paper p GROUP BY p.type")
	public List<Map<String, String>> countPapersGroupedByType();

	@Query("SELECT p FROM Paper p WHERE LOWER(p.abstractContent) LIKE %:word% AND p.user.id = :id")
	List<Paper> findAllPapersByAbstractWordAndUser(@Param("word") String word, @Param("id") int id);

	@Query("SELECT p FROM Paper p WHERE LOWER(p.keywords) LIKE %:word AND p.user.id = :id")
	List<Paper> findAllPapersByKeyWordAndUser(@Param("word") String word, @Param("id") int id);

	@Query("SELECT p FROM Paper p WHERE LOWER(p.title) LIKE %:title AND p.user.id = :id")
	List<Paper> findByTitleAndUser(@Param("title")String title, @Param("id") int id);

	@Query(("SELECT p FROM Paper p WHERE LOWER(p.authors) LIKE %:author AND p.user.id = :id"))
	List<Paper> findAllPapersByAuthorAndUser(@Param("author") String author, @Param("id") int id);

}
