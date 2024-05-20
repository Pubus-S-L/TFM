package org.springframework.samples.pubus.paper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.text.ParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@AutoConfigureTestDatabase
public class PaperTypeFormatterTest {
@Mock
    private PaperService paperService;

    @InjectMocks
    private PaperTypeFormatter paperTypeFormatter;

    private List<PaperType> paperTypes;

    @BeforeEach
    public void setUp() {
        PaperType type1 = new PaperType();
        type1.setName("Article");
        
        PaperType type2 = new PaperType();
        type2.setName("Book");

        paperTypes = Arrays.asList(type1, type2);
    }

    @Test
    public void testPrint() {
        PaperType paperType = new PaperType();
        paperType.setName("Article");

        String result = paperTypeFormatter.print(paperType, Locale.getDefault());
        assertEquals("Article", result);
    }

    @Test
    public void testParse() throws ParseException {
        when(paperService.findPaperTypes()).thenReturn(paperTypes);

        PaperType result = paperTypeFormatter.parse("Book", Locale.getDefault());
        assertNotNull(result);
        assertEquals("Book", result.getName());
    }

    @Test
    public void testParseTypeNotFound() {
        when(paperService.findPaperTypes()).thenReturn(paperTypes);

        ParseException exception = assertThrows(ParseException.class, () -> {
            paperTypeFormatter.parse("NonExistentType", Locale.getDefault());
        });

        assertEquals("type not found: NonExistentType", exception.getMessage());
    }
}
