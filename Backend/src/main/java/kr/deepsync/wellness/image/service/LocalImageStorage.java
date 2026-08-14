package kr.deepsync.wellness.image.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.UUID;

@Component
public class LocalImageStorage implements ImageStorage {
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Path root;
    private final long maxSizeBytes;

    public LocalImageStorage(@Value("${storage.skin-image.directory:uploads/skin-images}") String directory,
                             @Value("${storage.skin-image.max-size-bytes:10485760}") long maxSizeBytes) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        this.maxSizeBytes = maxSizeBytes;
    }

    @Override
    public StoredImage store(MultipartFile file) {
        validateBasic(file);
        DetectedImage detected = detect(file);
        validateImageStructure(file);
        String storageKey = UUID.randomUUID() + detected.extension();
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(root);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredImage(storageKey, detected.contentType(), file.getSize());
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.IMAGE_STORAGE_ERROR);
        }
    }

    @Override
    public Resource load(String storageKey) {
        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path)) throw new BusinessException(ErrorCode.IMAGE_STORAGE_ERROR);
        return new FileSystemResource(path);
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.IMAGE_STORAGE_ERROR);
        }
    }

    private void validateBasic(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BusinessException(ErrorCode.EMPTY_IMAGE_FILE);
        if (file.getSize() > maxSizeBytes) throw new BusinessException(ErrorCode.IMAGE_FILE_TOO_LARGE);
    }

    private DetectedImage detect(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(8);
            if (isJpeg(header)) return new DetectedImage(".jpg", "image/jpeg");
            if (isPng(header)) return new DetectedImage(".png", "image/png");
            throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_FORMAT);
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.IMAGE_STORAGE_ERROR);
        }
    }

    private void validateImageStructure(MultipartFile file) {
        try (ImageInputStream imageInput = ImageIO.createImageInputStream(file.getInputStream())) {
            if (imageInput == null) throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_FORMAT);
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_FORMAT);
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0) throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_FORMAT);
            } finally {
                reader.dispose();
            }
        } catch (BusinessException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_FORMAT);
        }
    }

    private boolean isJpeg(byte[] header) {
        return header.length >= 3 && (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] header) {
        if (header.length < PNG_SIGNATURE.length) return false;
        for (int i = 0; i < PNG_SIGNATURE.length; i++) {
            if (header[i] != PNG_SIGNATURE[i]) return false;
        }
        return true;
    }

    private Path resolve(String storageKey) {
        Path path = root.resolve(storageKey).normalize();
        if (!path.startsWith(root)) throw new BusinessException(ErrorCode.IMAGE_STORAGE_ERROR);
        return path;
    }

    private record DetectedImage(String extension, String contentType) {
    }
}
