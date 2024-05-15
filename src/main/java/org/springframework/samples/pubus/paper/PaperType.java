package org.springframework.samples.pubus.paper;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import org.springframework.samples.pubus.model.NamedEntity;

@Entity
@Table(name = "types")
public class PaperType extends NamedEntity {

}
