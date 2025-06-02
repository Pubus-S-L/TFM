package org.springframework.samples.pubus.paper;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaperSummaryDTO {
    private Integer id;
    private String title;
    private String authors;
    private Integer publicationYear;
    private Integer likes;
    private String typeName;

    // Constructor para JPQL
    public PaperSummaryDTO(Integer id, String title, String authors, 
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
            ((Number) row[0]).intValue(),      // id
            (String) row[1],                    // title
            (String) row[2],                    // authors
            ((Number) row[3]).intValue(),                   // publication_year
            ((Number) row[4]).intValue(),                   // likes
            (String) row[5]                     // type_name
        );
    }
    

}

