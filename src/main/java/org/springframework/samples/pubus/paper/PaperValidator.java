package org.springframework.samples.pubus.paper;

import org.springframework.util.StringUtils;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;


public class PaperValidator implements Validator {

	private static final String REQUIRED = "required";

	@Override
	public void validate(Object obj, Errors errors) {
		Paper paper = (Paper) obj;
		String title = paper.getTitle();
		// title validation
		if (!StringUtils.hasLength(title) || title.length()>175 || title.length()<3) {
			errors.rejectValue("title", REQUIRED+" and between 3 and 50 characters", REQUIRED+" and between 3 and 50 character");
		}

		// type validation
		if (paper.isNew() && paper.getType() == null) {
			errors.rejectValue("type", REQUIRED, REQUIRED);
		}

	}

	@Override
	public boolean supports(Class<?> clazz) {
		return Paper.class.isAssignableFrom(clazz);
	}

}
