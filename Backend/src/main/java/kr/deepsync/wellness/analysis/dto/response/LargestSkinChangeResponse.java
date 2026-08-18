package kr.deepsync.wellness.analysis.dto.response;

import kr.deepsync.wellness.analysis.domain.SkinChangeDirection;
import kr.deepsync.wellness.analysis.domain.TargetSkinMetric;

public record LargestSkinChangeResponse(
        TargetSkinMetric metric,
        int amount,
        SkinChangeDirection direction
) {
}
