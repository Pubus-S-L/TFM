package org.springframework.samples.pubus.paper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.Errors;

public class PaperValidatorTest {
    private PaperValidator paperValidator;

    @BeforeEach
    public void setUp() {
        paperValidator = new PaperValidator();
    }

    @Test
    public void testSupports() {
        assertTrue(paperValidator.supports(Paper.class));
        assertFalse(paperValidator.supports(Object.class));
    }

    @Test
    public void testValidate_TitleMissing() {
        Paper paper = new Paper();
        paper.setTitle("");
        paper.setType(new PaperType());

        Errors errors = new BeanPropertyBindingResult(paper, "paper");
        paperValidator.validate(paper, errors);

        assertTrue(errors.hasErrors());
        assertNotNull(errors.getFieldError("title"));
        assertEquals("required and between 3 and 50 characters", errors.getFieldError("title").getCode());
    }

    @Test
    public void testValidate_TitleTooShort() {
        Paper paper = new Paper();
        paper.setTitle("Hi");
        paper.setType(new PaperType());

        Errors errors = new BeanPropertyBindingResult(paper, "paper");
        paperValidator.validate(paper, errors);

        assertTrue(errors.hasErrors());
        assertNotNull(errors.getFieldError("title"));
        assertEquals("required and between 3 and 50 characters", errors.getFieldError("title").getCode());
    }

    @Test
    public void testValidate_TitleTooLong() {
        Paper paper = new Paper();
        paper.setTitle("A".repeat(176));
        paper.setType(new PaperType());

        Errors errors = new BeanPropertyBindingResult(paper, "paper");
        paperValidator.validate(paper, errors);

        assertTrue(errors.hasErrors());
        assertNotNull(errors.getFieldError("title"));
        assertEquals("required and between 3 and 50 characters", errors.getFieldError("title").getCode());
    }

    @Test
    public void testValidate_TypeMissingForNewPaper() {
        Paper paper = new Paper();
        paper.setTitle("Valid Title");

        Errors errors = new BeanPropertyBindingResult(paper, "paper");
        paperValidator.validate(paper, errors);

        assertTrue(errors.hasErrors());
        assertNotNull(errors.getFieldError("type"));
        assertEquals("required", errors.getFieldError("type").getCode());
    }

    @Test
    public void testValidate_ValidPaper() {
        Paper paper = new Paper();
        paper.setTitle("Valid Title");
        paper.setType(new PaperType());

        Errors errors = new BeanPropertyBindingResult(paper, "paper");
        paperValidator.validate(paper, errors);

        assertFalse(errors.hasErrors());
    }
}
