package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.FactorType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PersonalFactorAnalysisResponse(
        FactorType factor,
        LocalDate analyzedFrom,
        LocalDate analyzedTo,
        LocalDateTime calculatedAt,
        List<FactorMetricAnalysisResponse> metrics,
        String notice
) {
    public static final String ASSOCIATION_NOTICE =
            "생활·환경 기록과 다음 날 피부 변화 사이의 관찰된 연관성이며 원인을 의미하지 않습니다.";
}
