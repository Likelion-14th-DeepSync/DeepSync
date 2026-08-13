package kr.deepsync.wellness.lifestyle.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;
import kr.deepsync.wellness.lifestyle.dto.request.LifestyleRecordRequest;
import kr.deepsync.wellness.lifestyle.dto.response.LifestyleRecordResponse;
import kr.deepsync.wellness.lifestyle.exception.LifestyleRecordNotFoundException;
import kr.deepsync.wellness.lifestyle.repository.LifestyleRecordRepository;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LifestyleRecordService {
    private final LifestyleRecordRepository repository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    @Transactional
    public LifestyleRecordResponse create(Long memberId, LifestyleRecordRequest request) {
        validateDate(request.recordDate());
        if (repository.existsByMemberIdAndRecordDate(memberId, request.recordDate())) {
            throw new BusinessException(ErrorCode.DUPLICATE_LIFESTYLE_RECORD);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        LifestyleRecord record = LifestyleRecord.create(member, request.recordDate(),
                request.sleepDurationMinutes(), request.bedtime(), request.wakeUpTime(),
                request.lateNightMeal(), request.waterIntakeMl(), request.sourceType());
        return LifestyleRecordResponse.from(repository.save(record));
    }

    public LifestyleRecordResponse get(Long memberId, LocalDate date) {
        return LifestyleRecordResponse.from(find(memberId, date));
    }

    public List<LifestyleRecordResponse> getRange(Long memberId, LocalDate startDate, LocalDate endDate) {
        validateRange(startDate, endDate);
        return repository.findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, startDate, endDate)
                .stream().map(LifestyleRecordResponse::from).toList();
    }

    @Transactional
    public LifestyleRecordResponse update(Long memberId, LocalDate date, LifestyleRecordRequest request) {
        if (!date.equals(request.recordDate())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        validateDate(date);
        LifestyleRecord record = find(memberId, date);
        record.update(date, request.sleepDurationMinutes(), request.bedtime(), request.wakeUpTime(),
                request.lateNightMeal(), request.waterIntakeMl(), request.sourceType());
        return LifestyleRecordResponse.from(record);
    }

    private LifestyleRecord find(Long memberId, LocalDate date) {
        return repository.findByMemberIdAndRecordDate(memberId, date)
                .orElseThrow(LifestyleRecordNotFoundException::new);
    }

    private void validateDate(LocalDate date) {
        if (date.isAfter(LocalDate.now(clock))) throw new BusinessException(ErrorCode.FUTURE_RECORD_DATE);
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) throw new BusinessException(ErrorCode.INVALID_DATE_RANGE);
    }
}
