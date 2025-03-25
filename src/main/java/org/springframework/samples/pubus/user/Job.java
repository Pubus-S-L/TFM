package org.springframework.samples.pubus.user;

import org.springframework.samples.pubus.model.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "job")
public class Job extends BaseEntity{
    
    String title;
    String company;
    String years;
}
