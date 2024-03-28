package org.springframework.samples.pubus.company;

import java.util.Map;

import org.springframework.samples.pubus.model.NamedEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "company")
public class Company extends NamedEntity {
    
    String description;

    String direction;

    Integer phone;

    String email;

    Integer supportPhone;

    String supportEmail;

}
