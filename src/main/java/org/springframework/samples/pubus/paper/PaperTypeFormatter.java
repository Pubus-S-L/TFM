package org.springframework.samples.pubus.paper;

import java.text.ParseException;
import java.util.Collection;
import java.util.Locale;

import org.springframework.format.Formatter;
import org.springframework.stereotype.Component;

@Component
public class PaperTypeFormatter implements Formatter<PaperType> {

	private final PaperService peService;

	public PaperTypeFormatter(PaperService paperService) {
		this.peService = paperService;
	}

	@Override
	public String print(PaperType paperType, Locale locale) {
		return paperType.getName();
	}

	@Override
	public PaperType parse(String text, Locale locale) throws ParseException {
		Collection<PaperType> findPaperTypes = this.peService.findPaperTypes();
		for (PaperType type : findPaperTypes) {
			if (type.getName().equals(text)) {
				return type;
			}
		}
		throw new ParseException("type not found: " + text, 0);
	}

}
