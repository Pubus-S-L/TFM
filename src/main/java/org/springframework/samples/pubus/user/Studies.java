package org.springframework.samples.pubus.user;

import org.springframework.samples.pubus.model.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "studies")
public class Studies extends BaseEntity{
    
    String degree;
    String institution;
    @Column(name = "graduation_year")
    String graduationYear;
}
