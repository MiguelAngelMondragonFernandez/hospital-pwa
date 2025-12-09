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

    // Directorio donde se guardan los QR
    @Value("${qr.directory:src/main/resources/static/qr}")
    private String qrDirectory;

    // Dominio base para la URL pública
    @Value("${app.domain:http://localhost:8080}")
    private String appDomain;

    // Tamaño del QR en píxeles
    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    /**
     * Genera un código QR para una cama específica
     * @param bedId ID de la cama
     * @return URL pública del archivo QR generado
     * @throws IOException Si hay error al escribir el archivo
     * @throws WriterException Si hay error al generar el QR
     */
    public String generateQrForBed(Long bedId) throws IOException, WriterException {

        // Crear el directorio si no existe
        Path directory = Paths.get(qrDirectory);
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }

        // Contenido del QR: solo el ID de la cama
        String qrContent = bedId.toString();

        // Generar el código QR usando ZXing
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
                qrContent,
                BarcodeFormat.QR_CODE,
                QR_WIDTH,
                QR_HEIGHT
        );

        // Ruta del archivo donde se guardará el QR
        Path qrPath = Paths.get(qrDirectory, bedId + ".png");

        // Escribir la imagen en el archivo
        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", qrPath);

        // Retornar la URL pública del QR
        return String.format("%s/qr/%d.png", appDomain, bedId);
    }

    /**
     * Elimina el archivo QR de una cama
     * @param bedId ID de la cama
     * @return true si se eliminó correctamente
     */
    public boolean deleteQrForBed(Long bedId) {
        try {
            Path qrPath = Paths.get(qrDirectory, bedId + ".png");
            return Files.deleteIfExists(qrPath);
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Verifica si existe un QR para una cama
     * @param bedId ID de la cama
     * @return true si el archivo existe
     */
    public boolean qrExists(Long bedId) {
        Path qrPath = Paths.get(qrDirectory, bedId + ".png");
        return Files.exists(qrPath);
    }

    /**
     * Obtiene la URL del QR si existe
     * @param bedId ID de la cama
     * @return URL del QR o null si no existe
     */
    public String getQrUrl(Long bedId) {
        if (qrExists(bedId)) {
            return String.format("%s/qr/%d.png", appDomain, bedId);
        }
        return null;
    }
}