package kr.deepsync.wellness.lifestyle.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import kr.deepsync.wellness.common.domain.DataSourceType;

import java.time.LocalDate;
import java.time.LocalTime;

public record LifestyleRecordRequest(
        @NotNull LocalDate recordDate,
        @Min(0) @Max(1440) Integer sleepDurationMinutes,
        LocalTime bedtime,
        LocalTime wakeUpTime,
        Boolean lateNightMeal,
        @Min(0) @Max(10000) Integer waterIntakeMl,
        @NotNull DataSourceType sourceType
) {
}
