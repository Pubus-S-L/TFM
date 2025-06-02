package org.springframework.samples.pubus.paper;

public class PaperSummaryDTO {
    private Long id;
    private String title;
    private String authors;
    private Integer publicationYear;
    private Integer likes;
    private String typeName;

    // Constructor para JPQL
    public PaperSummaryDTO(Long id, String title, String authors, 
                          Integer publicationYear, Integer likes, String typeName) {
        this.id = id;
        this.title = title;
        this.authors = authors;
        this.publicationYear = publicationYear;
        this.likes = likes;
        this.typeName = typeName;
    }
    
    // Constructor para consulta nativa
    public static PaperSummaryDTO fromObjectArray(Object[] row) {
        return new PaperSummaryDTO(
            ((Number) row[0]).longValue(),      // id
            (String) row[1],                    // title
            (String) row[2],                    // authors
            (Integer) row[3],                   // publication_year
            (Integer) row[4],                   // likes
            (String) row[5]                     // type_name
        );
    }
    
    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getAuthors() { return authors; }
    public void setAuthors(String authors) { this.authors = authors; }
    
    public Integer getPublicationYear() { return publicationYear; }
    public void setPublicationYear(Integer publicationYear) { this.publicationYear = publicationYear; }
    
    public Integer getLikes() { return likes; }
    public void setLikes(Integer likes) { this.likes = likes; }
    
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
}

