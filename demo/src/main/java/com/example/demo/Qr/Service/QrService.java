package com.example.demo.Qr.Service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class QrService {

    @Value("${qr.directory:src/main/resources/static/qr}")
    private String qrDirectory;

    @Value("${app.domain:http://localhost:8080}")
    private String appDomain;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    /**
     * Genera un código QR para una cama específica
     * El QR contiene la URL completa de login: https://miapp.com/qr-login?bedId=12
     * @param bedId ID de la cama
     * @return URL pública del archivo QR generado
     */
    public String generateQrForBed(Long bedId) throws IOException, WriterException {

        // Crear el directorio si no existe
        Path directory = Paths.get(qrDirectory);
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }

        // Contenido del QR: URL completa con el bedId como parámetro
        String qrContent = String.format("%s/qr-login?bedId=%d", frontendUrl, bedId);

        // Generar el código QR usando ZXing
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
                qrContent,
                BarcodeFormat.QR_CODE,
                QR_WIDTH,
                QR_HEIGHT
        );

        // Ruta del archivo donde se guardará el QR
        Path qrPath = Paths.get(qrDirectory, "bed_" + bedId + ".png");

        // Escribir la imagen en el archivo
        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", qrPath);

        // Retornar la URL pública del QR
        return String.format("%s/qr/bed_%d.png", appDomain, bedId);
    }

    /**
     * Elimina el archivo QR de una cama
     */
    public boolean deleteQrForBed(Long bedId) {
        try {
            Path qrPath = Paths.get(qrDirectory, "bed_" + bedId + ".png");
            return Files.deleteIfExists(qrPath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Verifica si existe un QR para una cama
     */
    public boolean qrExists(Long bedId) {
        Path qrPath = Paths.get(qrDirectory, "bed_" + bedId + ".png");
        return Files.exists(qrPath);
    }

    /**
     * Obtiene la URL del QR si existe
     */
    public String getQrUrl(Long bedId) {
        if (qrExists(bedId)) {
            return String.format("%s/qr/bed_%d.png", appDomain, bedId);
        }
        return null;
    }
}