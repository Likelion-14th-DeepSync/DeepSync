package kr.deepsync.wellness.analysis.service;

import kr.deepsync.wellness.analysis.dto.response.AssociatedFactorResponse;
import kr.deepsync.wellness.analysis.dto.response.SkinScoreChange;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DailyInsightMessageFactory {
    public String create(SkinScoreChange previous, List<AssociatedFactorResponse> factors) {
        String changeMessage;
        if (previous == null) {
            changeMessage = "비교할 직전 피부 분석이 없어 오늘 상태를 기준으로 기록합니다.";
        } else if (previous.overallScoreChange() > 0) {
            changeMessage = "오늘 피부 점수는 직전 기록보다 %d점 높습니다."
                    .formatted(previous.overallScoreChange());
        } else if (previous.overallScoreChange() < 0) {
            changeMessage = "오늘 피부 점수는 직전 기록보다 %d점 낮습니다."
                    .formatted(Math.abs(previous.overallScoreChange()));
        } else {
            changeMessage = "오늘 피부 점수는 직전 기록과 같습니다.";
        }
        if (factors.isEmpty()) return changeMessage + " 현재 데이터로는 함께 관찰된 주요 생활·환경 요인이 없습니다.";
        return changeMessage + " " + factors.getFirst().description();
    }
}
