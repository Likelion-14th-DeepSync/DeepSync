package kr.deepsync.wellness.image.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.common.response.ApiResponse;
import kr.deepsync.wellness.image.dto.request.SkinImageUploadRequest;
import kr.deepsync.wellness.image.dto.response.SkinImageResponse;
import kr.deepsync.wellness.image.service.SkinImageFile;
import kr.deepsync.wellness.image.service.SkinImageService;
import kr.deepsync.wellness.security.AuthenticatedMember;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/skin-images")
public class SkinImageApi {
    private final SkinImageService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SkinImageResponse>> upload(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestPart("image") MultipartFile image,
            @Valid @RequestPart("metadata") SkinImageUploadRequest metadata) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.upload(member.memberId(), image, metadata)));
    }

    @GetMapping("/{imageId}")
    public ApiResponse<SkinImageResponse> get(@AuthenticationPrincipal AuthenticatedMember member,
                                              @PathVariable Long imageId) {
        return ApiResponse.success(service.get(member.memberId(), imageId));
    }

    @GetMapping
    public ApiResponse<List<SkinImageResponse>> getRange(
            @AuthenticationPrincipal AuthenticatedMember member,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(service.getRange(member.memberId(), startDate, endDate));
    }

    @GetMapping("/{imageId}/file")
    public ResponseEntity<org.springframework.core.io.Resource> getFile(
            @AuthenticationPrincipal AuthenticatedMember member, @PathVariable Long imageId) {
        SkinImageFile file = service.loadFile(member.memberId(), imageId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(file.resource());
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedMember member,
                                       @PathVariable Long imageId) {
        service.delete(member.memberId(), imageId);
        return ResponseEntity.noContent().build();
    }
}
