package kr.deepsync.wellness.image.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface ImageStorage {
    StoredImage store(MultipartFile file);
    Resource load(String storageKey);
    void delete(String storageKey);
}
