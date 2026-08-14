package kr.deepsync.wellness.image.service;

public record StoredImage(String storageKey, String contentType, long size) {
}
