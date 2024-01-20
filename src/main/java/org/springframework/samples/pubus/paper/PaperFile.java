package org.springframework.samples.pubus.paper;

import org.springframework.samples.pubus.model.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "paper_file")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaperFile extends BaseEntity {

    @Lob
    @Column(name = "data", nullable = false)
    private byte[] data;

    @NotBlank
    private String name;

    private String type;

    @ManyToOne(optional = false)
    @JoinColumn(name = "paper_id")
    private Paper paper;
}