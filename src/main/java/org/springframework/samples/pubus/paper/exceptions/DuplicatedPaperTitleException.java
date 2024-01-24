package org.springframework.samples.pubus.paper.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 *
 * @author Lucperrrom
 */
@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class DuplicatedPaperTitleException extends RuntimeException{

	private static final long serialVersionUID = -3330551940727004798L;
	
	public DuplicatedPaperTitleException() {
		super("You can't have two papers with the same name.");
	}
    
}
