package org.springframework.samples.pubus.paper;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

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

	@ManyToOne(optional = false)
	@JoinColumn(name = "type_id")
	private PaperType type;

	@Column(name="abstract_content")
	private String abstractContent;

	private String publicationData;

	private String notes;

	private String keywords;

	private String Scopus;


	@Valid
	@ManyToOne(optional = true)
	@JoinColumn(name = "user_id")
	@OnDelete(action = OnDeleteAction.CASCADE)
	protected User user;

	@OneToMany(mappedBy = "paper", cascade = CascadeType.ALL)
    private List<PaperFile> paperFiles = new ArrayList<>();




}
