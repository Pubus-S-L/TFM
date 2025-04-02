package org.springframework.samples.pubus.paper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Map;
import org.springframework.samples.pubus.model.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
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

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "paper_id")
    private Paper paper;

    @Lob
	private byte[] embeddingsBlob;


    @Transient
    private Map<String, byte[]> embeddings;

    public void setEmbeddings(Map<String, byte[]> embeddings) {
        this.embeddings = embeddings;
        this.embeddingsBlob = serializeToBytes(embeddings);
    }

    public Map<String, byte[]> getEmbeddings() {
        if (this.embeddings == null && this.embeddingsBlob != null) {
            this.embeddings = deserializeFromBytes(this.embeddingsBlob);
        }
        return this.embeddings;
    }

    private byte[] serializeToBytes(Map<String, byte[]> map) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             ObjectOutputStream out = new ObjectOutputStream(bos)) {
            out.writeObject(map);
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error serializing map", e);
        }
    }

    private Map<String, byte[]> deserializeFromBytes(byte[] data) {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(data);
             ObjectInputStream in = new ObjectInputStream(bis)) {
            return (Map<String, byte[]>) in.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException("Error deserializing map", e);
        }
    }
}