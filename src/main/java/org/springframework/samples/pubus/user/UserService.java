package org.springframework.samples.pubus.user;



import jakarta.validation.Valid;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.samples.pubus.exceptions.ResourceNotFoundException;
import org.springframework.samples.pubus.paper.Paper;
import org.springframework.samples.pubus.paper.PaperRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.samples.pubus.configuration.services.UserDetailsImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

	private UserRepository userRepository;
	private JobRepository jobRepository;
	private StudiesRepository studiesRepository;
	private PaperRepository paperRepository;
	private final String uploadDir = "src/main/resources/static/uploads/";

	@Autowired
	public UserService(UserRepository userRepository, JobRepository jobRepository, StudiesRepository studiesRepository, PaperRepository paperRepository) {
		this.userRepository = userRepository;
		this.jobRepository = jobRepository;
		this.studiesRepository = studiesRepository;
		this.paperRepository = paperRepository;
		
	}

	@Transactional
	public User saveUser(User user) throws DataAccessException {
		userRepository.save(user);
		return user;
	}

	@Transactional(readOnly = true)
	public User findUser(String email) {
		return userRepository.findByEmail(email)
				.orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
	}

	@Transactional(readOnly = true)
	public User findUser(Integer id) {
		return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
	}

	@Transactional(readOnly = true)
	public List<String> findAllAuthorities() {
		return userRepository.findAllAuthorities();
	}

	@Transactional(readOnly = true)
	public User findCurrentUser() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null)
			throw new ResourceNotFoundException("Nobody authenticated!");
		else{
			Object principal = auth.getPrincipal();
			if (principal instanceof UserDetailsImpl) {
				UserDetailsImpl userDetails = (UserDetailsImpl) principal;
				return userRepository.findByUsername(userDetails.getUsername())
					.orElseThrow(() -> new ResourceNotFoundException("User", "username", userDetails.getUsername()));
			}
			else{
				return userRepository.findByUsername(auth.getName())
					.orElseThrow(() -> new ResourceNotFoundException("User", "username", auth.getName()));
			}
		}
	}

	public Boolean existsUser(String username) {
		return userRepository.existsByUsername(username);
	}

	@Transactional(readOnly = true)
	public Iterable<User> findAll() {
		return userRepository.findAll();
	}

	public Iterable<User> findAllByAuthority(String auth) {
		return userRepository.findAllByAuthority(auth);
	}

	@Transactional
	public User updateUser(@Valid User new_user, Integer id) {
		User old_user = findUser(id);
		if (new_user.getJob() != null){
			if(new_user.getJob().getId() == null){
				Job newJob = new_user.getJob();
				jobRepository.save(newJob);
				old_user.setJob(newJob);
			}else{
				updateJob(new_user.getJob());
			}

		}
		if (new_user.getStudies() != null && !new_user.getStudies().isEmpty()) {
			for (Studies study : new_user.getStudies()) {
				if( study.id ==null){
					studiesRepository.save(study);  
				}else{
					updateStudies(study);
				}
					
			}
		}
		BeanUtils.copyProperties(new_user, old_user, "id");
		userRepository.save(old_user);

		return old_user;
	}
	@Transactional
	private void updateStudies(@Valid Studies studies){
		Studies old_study = studiesRepository.findById(studies.id).get();
		BeanUtils.copyProperties(studies, old_study, "id");
		studiesRepository.save(old_study);
	}

	@Transactional
	private void updateJob(@Valid Job job){
		Job old_job = jobRepository.findById(job.id).get();
		BeanUtils.copyProperties(job, old_job, "id");
		jobRepository.save(old_job);
	}


	@Transactional
	public void deleteUser(Integer id) {
		User user_delete = findUser(id);
		this.userRepository.delete(user_delete);
	}

	@Transactional(readOnly = true)
	public List<Paper> findFavoritePaperByUser(Integer userId) {
		List<Paper> favoritePaper = new ArrayList<>();
		List<Integer> favoritePaperId = findUser(userId).getFavorites();
		if(favoritePaperId.size()>0){
			Collections.reverse(favoritePaperId);
			Iterable<Paper> itPaper = paperRepository.findAllById(favoritePaperId);	
			favoritePaper = StreamSupport.stream(itPaper.spliterator(), false).collect(Collectors.toList());	
		}
		return favoritePaper;
	}

	public User uploadProfilePicture(Integer userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
		user.setProfileImage(file.getBytes());
		user.setProfileImageType(file.getContentType());
        return userRepository.save(user);
    }

    public void deleteProfilePicture(Integer userId) throws IOException {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

		if (user.getProfileImage() != null) {
			user.setProfileImage(null);
			userRepository.save(user);
		}
    }
}
