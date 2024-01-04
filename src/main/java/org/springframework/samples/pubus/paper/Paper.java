package org.springframework.samples.pubus.paper;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.springframework.samples.pubus.model.BaseEntity;
import org.springframework.samples.pubus.user.User;


import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "papers")
@Getter
@Setter
public class Paper extends BaseEntity {

	@NotBlank
	private String title;

	@NotBlank
	private String authors;

	@NotBlank
	private Integer year;

	@ManyToOne(optional = false)
	@JoinColumn(name = "type_id")
	private PaperType type;

	@Column(name="abstract_content")
	@NotBlank
	private String abstractContent;

	private String notes;

	@NotBlank
	private String keywords;

	@Valid
	@ManyToOne(optional = true)
	@JoinColumn(name = "user_id")
	@OnDelete(action = OnDeleteAction.CASCADE)
	protected User user;

}
