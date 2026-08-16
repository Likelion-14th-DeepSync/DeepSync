package kr.deepsync.wellness.experiment.dto.response;

import kr.deepsync.wellness.experiment.domain.CheckSourceType;
import kr.deepsync.wellness.experiment.domain.ExperimentDailyCheck;
import java.time.LocalDate;

public record DailyCheckResponse(Long checkId, LocalDate recordDate, boolean achieved,
                                 String actualValue, CheckSourceType sourceType, String note) {
    public static DailyCheckResponse from(ExperimentDailyCheck check) {
        return new DailyCheckResponse(check.getId(), check.getRecordDate(), check.isAchieved(),
                check.getActualValue(), check.getSourceType(), check.getNote());
    }
}
