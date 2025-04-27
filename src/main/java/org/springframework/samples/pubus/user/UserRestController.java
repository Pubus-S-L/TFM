package org.springframework.samples.pubus.user;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.pubus.auth.payload.response.MessageResponse;
import org.springframework.samples.pubus.exceptions.AccessDeniedException;
import org.springframework.samples.pubus.paper.Paper;
import org.springframework.samples.pubus.paper.PaperService;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/v1/users")
@SecurityRequirement(name = "bearerAuth")
class UserRestController {

	private final UserService userService;
	private final PaperService paperService;
	private final AuthoritiesService authService;
	private final PasswordEncoder encoder;

	@Autowired
	public UserRestController(UserService userService, AuthoritiesService authService, PasswordEncoder encoder, PaperService paperService) {
		this.userService = userService;
		this.authService = authService;
		this.encoder = encoder;
		this.paperService = paperService;
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

	@GetMapping("/{userId}/favorite")
	public ResponseEntity<List<Paper>> findFavourite(@PathVariable("userId") Integer id) {
		return new ResponseEntity<>(userService.findFavoritePaperByUser(id), HttpStatus.OK);
	}

	@GetMapping("/{userId}/recommended")
	public ResponseEntity<List<Paper>> findRecommended(@PathVariable("userId") Integer id) {
		List<Paper> recommendedList = new ArrayList<>();
		recommendedList = paperService.findAll().stream().sorted(Comparator.comparingInt(Paper::getLikes).reversed()).limit(3).collect(Collectors.toList());
		
		try{
			if(userService.findFavoritePaperByUser(id).size()>0){
				List<Paper> papers = userService.findFavoritePaperByUser(id);
				recommendedList = paperService.findRecommendedPapers(papers);
			}			
		}
		catch (Exception e) {
		}
		return new ResponseEntity<>(recommendedList, HttpStatus.OK);
	}

	@PostMapping("/{userId}/upload")
    public ResponseEntity<User> uploadProfilePicture(@PathVariable Integer userId, @RequestParam("file") MultipartFile file) {
        try {
            User user = userService.uploadProfilePicture(userId, file);
            return ResponseEntity.ok(user);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{userId}/delete")
    public ResponseEntity<Void> deleteProfilePicture(@PathVariable Integer userId) {
        try {
            userService.deleteProfilePicture(userId);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

	@GetMapping("/{id}/profileImage")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable Integer id) {
        User user = userService.findUser(id);
        if (user.getProfileImage() == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(user.getProfileImageType()))
            .body(user.getProfileImage());
    }



}
