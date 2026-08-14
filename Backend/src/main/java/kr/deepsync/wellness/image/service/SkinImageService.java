package kr.deepsync.wellness.image.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.image.domain.SkinImage;
import kr.deepsync.wellness.image.dto.request.SkinImageUploadRequest;
import kr.deepsync.wellness.image.dto.response.SkinImageResponse;
import kr.deepsync.wellness.image.exception.SkinImageNotFoundException;
import kr.deepsync.wellness.image.repository.SkinImageRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SkinImageService {
    private final SkinImageRepository repository;
    private final MemberRepository memberRepository;
    private final ImageStorage storage;
    private final Clock clock;

    @Transactional
    public SkinImageResponse upload(Long memberId, MultipartFile file, SkinImageUploadRequest request) {
        if (request.capturedAt().isAfter(LocalDateTime.now(clock))) {
            throw new BusinessException(ErrorCode.FUTURE_CAPTURED_AT);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        StoredImage stored = storage.store(file);
        try {
            SkinImage image = SkinImage.create(member, stored.storageKey(), stored.contentType(), stored.size(),
                    request.capturedAt(), request.direction(), request.makeupApplied());
            return SkinImageResponse.from(repository.save(image));
        } catch (RuntimeException exception) {
            storage.delete(stored.storageKey());
            throw exception;
        }
    }

    public SkinImageResponse get(Long memberId, Long imageId) {
        return SkinImageResponse.from(find(memberId, imageId));
    }

    public List<SkinImageResponse> getRange(Long memberId, LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) throw new BusinessException(ErrorCode.INVALID_DATE_RANGE);
        return repository.findAllByMemberIdAndCapturedAtGreaterThanEqualAndCapturedAtLessThanOrderByCapturedAtDesc(
                        memberId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay())
                .stream().map(SkinImageResponse::from).toList();
    }

    public SkinImageFile loadFile(Long memberId, Long imageId) {
        SkinImage image = find(memberId, imageId);
        return new SkinImageFile(storage.load(image.getStorageKey()), image.getContentType());
    }

    @Transactional
    public void delete(Long memberId, Long imageId) {
        SkinImage image = find(memberId, imageId);
        storage.delete(image.getStorageKey());
        repository.delete(image);
    }

    private SkinImage find(Long memberId, Long imageId) {
        return repository.findByIdAndMemberId(imageId, memberId).orElseThrow(SkinImageNotFoundException::new);
    }
}
