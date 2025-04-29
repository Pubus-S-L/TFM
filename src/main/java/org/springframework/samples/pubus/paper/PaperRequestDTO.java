package org.springframework.samples.pubus.paper;

public class PaperRequestDTO {
    private Paper paper;
    private Integer userId;
    
    // Getters y setters
    public Paper getPaper() {
        return paper;
    }
    
    public void setPaper(Paper paper) {
        this.paper = paper;
    }
    
    public Integer getUserId() {
        return userId;
    }
    
    public void setUserId(Integer userId) {
        this.userId = userId;
    }
    
    @Override
    public String toString() {
        return "PaperRequestDTO [paper=" + paper + ", userId=" + userId + "]";
    }
}
