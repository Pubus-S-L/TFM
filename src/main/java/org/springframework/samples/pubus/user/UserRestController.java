package org.springframework.samples.pubus.user;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.exceptions.AccessDeniedException;
import org.springframework.samples.pubus.util.RestPreconditions;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = "bearerAuth")
class UserRestController {

	private final UserService userService;
	private final AuthoritiesService authService;
	private final PasswordEncoder encoder;

	@Autowired
	public UserRestController(UserService userService, AuthoritiesService authService, PasswordEncoder encoder) {
		this.userService = userService;
		this.authService = authService;
		this.encoder = encoder;
	}

	@GetMapping
	public ResponseEntity<List<User>> findAll(@RequestParam(required = false) String auth) {
		List<User> res;
		if (auth != null) {
			res = (List<User>) userService.findAllByAuthority(auth);
		} else
			res = (List<User>) userService.findAll();
		return new ResponseEntity<>(res, HttpStatus.OK);
	}

	@GetMapping("authorities")
	public ResponseEntity<List<Authorities>> findAllAuths() {
		List<Authorities> res = (List<Authorities>) authService.findAll();
		return new ResponseEntity<>(res, HttpStatus.OK);
	}

	@GetMapping(value = "{id}")
	public ResponseEntity<User> findById(@PathVariable("id") Integer id) {
		return new ResponseEntity<>(userService.findUser(id), HttpStatus.OK);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ResponseEntity<User> create(@RequestBody @Valid User user) {
		user.setPassword(encoder.encode(user.getPassword()));
		User savedUser = userService.saveUser(user);
		return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
	}

	@PutMapping(value = "{userId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<User> update(@PathVariable("userId") Integer id, @RequestBody @Valid User user) {
		RestPreconditions.checkNotNull(userService.findUser(id), "User", "ID", id);
			return new ResponseEntity<>(this.userService.updateUser(user, id), HttpStatus.OK);
		
	}

	@DeleteMapping(value = "{userId}")
	@ResponseStatus(HttpStatus.OK)
	public ResponseEntity<MessageResponse> delete(@PathVariable("userId") int id) {
		RestPreconditions.checkNotNull(userService.findUser(id), "User", "ID", id);
		if (userService.findCurrentUser().getId() != id) {
			userService.deleteUser(id);
			return new ResponseEntity<>(new MessageResponse("User deleted!"), HttpStatus.OK);
		} else
			throw new AccessDeniedException("You can't delete yourself!");
	}

}
