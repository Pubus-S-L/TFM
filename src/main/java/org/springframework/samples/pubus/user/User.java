package org.springframework.samples.pubus.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

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


	@Column(unique = true)
	String email;

	String password;

	@NotNull
	String authority;

	public Boolean hasAuthority(String auth) {
		return this.getAuthority().equals(auth);
	}

}
