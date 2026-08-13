package kr.deepsync.wellness.lifestyle.dto.response;

import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.lifestyle.domain.LifestyleRecord;

import java.time.LocalDate;
import java.time.LocalTime;

public record LifestyleRecordResponse(Long recordId, LocalDate recordDate, Integer sleepDurationMinutes,
                                      LocalTime bedtime, LocalTime wakeUpTime, Boolean lateNightMeal,
                                      Integer waterIntakeMl, DataSourceType sourceType) {
    public static LifestyleRecordResponse from(LifestyleRecord record) {
        return new LifestyleRecordResponse(record.getId(), record.getRecordDate(),
                record.getSleepDurationMinutes(), record.getBedtime(), record.getWakeUpTime(),
                record.getLateNightMeal(), record.getWaterIntakeMl(), record.getSourceType());
    }
}
