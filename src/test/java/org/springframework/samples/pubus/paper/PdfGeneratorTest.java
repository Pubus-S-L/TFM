package org.springframework.samples.pubus.paper;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public class PdfGeneratorTest {

    public static File generateSamplePdf(String fileName, String content) throws IOException {
        PDDocument document = new PDDocument();
        PDPage page = new PDPage();
        document.addPage(page);

        PDPageContentStream contentStream = new PDPageContentStream(document, page);
        contentStream.beginText();
        contentStream.setFont(PDType1Font.HELVETICA, 12);
        contentStream.newLineAtOffset(50, 750);
        contentStream.showText(content);
        contentStream.endText();
        contentStream.close();

        File pdfFile = new File("src/test/resources/test-files/" + fileName);
        pdfFile.getParentFile().mkdirs(); // Crea la carpeta si no existe
        document.save(pdfFile);
        document.close();
        return pdfFile;
    }

    public static byte[] generateSamplePdfAsBytes(String content) throws IOException {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(PDType1Font.HELVETICA, 12);
                contentStream.newLineAtOffset(50, 750);
                contentStream.showText(content);
                contentStream.endText();
            }

            File tempFile = File.createTempFile("temp-test", ".pdf");
            document.save(tempFile);
            byte[] data = Files.readAllBytes(tempFile.toPath());
            tempFile.delete();
            return data;
        }
    }
}

