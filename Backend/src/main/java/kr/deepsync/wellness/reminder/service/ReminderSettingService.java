package kr.deepsync.wellness.reminder.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.MemberNotFoundException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import kr.deepsync.wellness.reminder.domain.*;
import kr.deepsync.wellness.reminder.dto.request.ReminderSettingRequest;
import kr.deepsync.wellness.reminder.dto.response.ReminderSettingResponse;
import kr.deepsync.wellness.reminder.repository.ReminderSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReminderSettingService {
    private final ReminderSettingRepository repository;
    private final MemberRepository memberRepository;

    @Transactional
    public ReminderSettingResponse put(Long memberId, ReminderType type, ReminderSettingRequest request) {
        validateTimezone(request.timezone());
        Member member = memberRepository.findById(memberId).orElseThrow(MemberNotFoundException::new);
        ReminderSetting setting = repository.findByMemberIdAndReminderType(memberId, type)
                .map(existing -> {
                    existing.update(request.enabled(), request.reminderTime(), request.daysOfWeek(), request.timezone());
                    return existing;
                }).orElseGet(() -> ReminderSetting.create(member, type, request.enabled(), request.reminderTime(),
                        request.daysOfWeek(), request.timezone()));
        return ReminderSettingResponse.from(repository.save(setting));
    }

    public List<ReminderSettingResponse> getAll(Long memberId) {
        return repository.findAllByMemberIdOrderByReminderTypeAsc(memberId).stream()
                .map(ReminderSettingResponse::from).toList();
    }

    @Transactional
    public ReminderSettingResponse disable(Long memberId, ReminderType type) {
        ReminderSetting setting = find(memberId, type);
        setting.disable();
        return ReminderSettingResponse.from(setting);
    }

    @Transactional
    public void delete(Long memberId, ReminderType type) {
        repository.delete(find(memberId, type));
    }

    private ReminderSetting find(Long memberId, ReminderType type) {
        return repository.findByMemberIdAndReminderType(memberId, type)
                .orElseThrow(() -> new BusinessException(ErrorCode.REMINDER_SETTING_NOT_FOUND));
    }

    private void validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
        } catch (DateTimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_REMINDER_TIMEZONE);
        }
    }
}
