package org.springframework.samples.pubus.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.pubus.model.BaseEntity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

	@Column(name = "first_name")
	@NotEmpty
	protected String firstName;

	@Column(name = "last_name")
	@NotEmpty
	protected String lastName;

	@Column(unique = true)
	@NotEmpty
	protected String username;

	@OneToMany
	List<Studies> studies;

	@OneToOne
	Job job;

	@Column(unique = true)
	String email;

	String password;

	String profilePicture;

	@Lob
    @Column(columnDefinition = "MEDIUMBLOB")
    private byte[] profileImage;

	private String profileImageType;

	@NotNull
	@ManyToOne(optional = false)
	@JoinColumn(name = "authority")
	Authorities authority;

	List<Integer> favorites = new ArrayList<>();


}
