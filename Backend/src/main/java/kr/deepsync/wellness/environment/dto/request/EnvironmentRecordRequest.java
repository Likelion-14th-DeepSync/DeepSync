package kr.deepsync.wellness.environment.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import kr.deepsync.wellness.common.domain.DataSourceType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EnvironmentRecordRequest(
        @NotNull LocalDate recordDate,
        @DecimalMin("0.0") @DecimalMax("20.0") BigDecimal uvIndex,
        @DecimalMin("-60.0") @DecimalMax("60.0") BigDecimal temperature,
        @Min(0) @Max(100) Integer humidity,
        @Min(0) Integer fineDust,
        @NotNull DataSourceType sourceType
) {
}
