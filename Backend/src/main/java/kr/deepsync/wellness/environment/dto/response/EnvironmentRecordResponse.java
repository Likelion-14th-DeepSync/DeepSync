package kr.deepsync.wellness.environment.dto.response;

import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.environment.domain.EnvironmentRecord;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EnvironmentRecordResponse(Long recordId, LocalDate recordDate, BigDecimal uvIndex,
                                        BigDecimal temperature, Integer humidity, Integer fineDust,
                                        DataSourceType sourceType) {
    public static EnvironmentRecordResponse from(EnvironmentRecord record) {
        return new EnvironmentRecordResponse(record.getId(), record.getRecordDate(), record.getUvIndex(),
                record.getTemperature(), record.getHumidity(), record.getFineDust(), record.getSourceType());
    }
}
