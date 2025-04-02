package org.springframework.samples.pubus.paper;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.samples.pubus.model.BaseEntity;
import org.springframework.samples.pubus.user.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "papers")
public class Paper extends BaseEntity {


	@NotBlank
	private String title;

	@NotBlank
	private String authors;

	@Column(name="publication_year")
	@NotNull
	private Integer publicationYear;

	private String DOI;

	private String publisher;

	@ManyToOne(optional = false)
	@JoinColumn(name = "type_id")
	private PaperType type;

	@Column(name="abstract_content", length = 1000)
	private String abstractContent;

	private String publicationData;

	private String notes;

	private String keywords;

	private String scopus;

	private String source;

	private Integer likes = 0;

	@Lob
    @Column(name = "embedding")
	private byte[] embedding;


	@Valid
	@ManyToOne(optional = true)
	@JoinColumn(name = "user_id")
	@OnDelete(action = OnDeleteAction.CASCADE)
	protected User user;

	@OneToMany(mappedBy = "paper", cascade = CascadeType.ALL)
    private List<PaperFile> paperFiles = new ArrayList<>();

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
