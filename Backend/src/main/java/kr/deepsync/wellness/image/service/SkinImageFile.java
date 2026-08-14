package kr.deepsync.wellness.image.service;

import org.springframework.core.io.Resource;

public record SkinImageFile(Resource resource, String contentType) {
}
