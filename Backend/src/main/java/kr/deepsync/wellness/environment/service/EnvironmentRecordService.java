package kr.deepsync.wellness.environment.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;
import kr.deepsync.wellness.environment.dto.request.EnvironmentRecordRequest;
import kr.deepsync.wellness.environment.dto.response.EnvironmentRecordResponse;
import kr.deepsync.wellness.environment.exception.EnvironmentRecordNotFoundException;
import kr.deepsync.wellness.environment.repository.EnvironmentRecordRepository;
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
public class EnvironmentRecordService {
    private final EnvironmentRecordRepository repository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    @Transactional
    public EnvironmentRecordResponse create(Long memberId, EnvironmentRecordRequest request) {
        validateDate(request.recordDate());
        if (repository.existsByMemberIdAndRecordDate(memberId, request.recordDate())) {
            throw new BusinessException(ErrorCode.DUPLICATE_ENVIRONMENT_RECORD);
        }
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        EnvironmentRecord record = EnvironmentRecord.create(member, request.recordDate(), request.uvIndex(),
                request.temperature(), request.humidity(), request.fineDust(), request.sourceType());
        return EnvironmentRecordResponse.from(repository.save(record));
    }

    public EnvironmentRecordResponse get(Long memberId, LocalDate date) {
        return EnvironmentRecordResponse.from(find(memberId, date));
    }

    public List<EnvironmentRecordResponse> getRange(Long memberId, LocalDate startDate, LocalDate endDate) {
        validateRange(startDate, endDate);
        return repository.findAllByMemberIdAndRecordDateBetweenOrderByRecordDateAsc(memberId, startDate, endDate)
                .stream().map(EnvironmentRecordResponse::from).toList();
    }

    @Transactional
    public EnvironmentRecordResponse update(Long memberId, LocalDate date, EnvironmentRecordRequest request) {
        if (!date.equals(request.recordDate())) throw new BusinessException(ErrorCode.INVALID_INPUT);
        validateDate(date);
        EnvironmentRecord record = find(memberId, date);
        record.update(date, request.uvIndex(), request.temperature(), request.humidity(),
                request.fineDust(), request.sourceType());
        return EnvironmentRecordResponse.from(record);
    }

    private EnvironmentRecord find(Long memberId, LocalDate date) {
        return repository.findByMemberIdAndRecordDate(memberId, date)
                .orElseThrow(EnvironmentRecordNotFoundException::new);
    }

    private void validateDate(LocalDate date) {
        if (date.isAfter(LocalDate.now(clock))) throw new BusinessException(ErrorCode.FUTURE_RECORD_DATE);
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) throw new BusinessException(ErrorCode.INVALID_DATE_RANGE);
    }
}
