import { useEffect, useMemo, useState } from "react";
import { getAnalysisFactors, getAnalysisTimeline } from "../../api/analysis";

const FACTOR_LABELS = {
  SHORT_SLEEP: "짧은 수면",
  LATE_BEDTIME: "늦은 취침",
  LATE_NIGHT_MEAL: "야식 여부",
  LOW_WATER_INTAKE: "수분 섭취",
  HIGH_UV: "UV 지수",
  LOW_HUMIDITY: "낮은 습도",
  HIGH_FINE_DUST: "미세먼지",
  HIGH_TEMPERATURE: "높은 온도",
  LOW_TEMPERATURE: "낮은 온도",
};

const METRIC_LABELS = {
  REDNESS: "붉은기",
  TROUBLE: "트러블",
  DRYNESS: "건조함",
  TONE_UNIFORMITY: "피부톤 균일도",
  OVERALL: "피부 점수",
};

function formatDiff(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (value > 0) {
    return `+${value}점`;
  }

  if (value < 0) {
    return `${value}점`;
  }

  return "0점";
}

function getDiffTrend(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "same";
}

function getConfidenceInfo(level) {
  if (level === "HIGH") {
    return {
      label: "연관성 높음",
      dots: 3,
    };
  }

  if (level === "MEDIUM") {
    return {
      label: "연관성 보통",
      dots: 2,
    };
  }

  return {
    label: "연관성 낮음",
    dots: 1,
  };
}

function RecordChange() {
  const [timeline, setTimeline] = useState(null);
  const [factors, setFactors] = useState([]);
  const [localAnalysis, setLocalAnalysis] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        /*
         * 피부 분석 API가 품질검사 때문에 아직 막혀 있는 동안
         * AI 화면에서 저장한 localStorage 값을 fallback으로 사용
         */
        try {
          const saved = localStorage.getItem("wellness-today-skin-analysis");

          setLocalAnalysis(saved ? JSON.parse(saved) : null);
        } catch (error) {
          console.error("로컬 피부 분석 데이터 읽기 실패:", error);
        }

        const results = await Promise.allSettled([
          getAnalysisTimeline("SEVEN_DAYS"),
          getAnalysisFactors(),
        ]);

        const timelineResult = results[0];
        const factorResult = results[1];

        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value?.data ?? null);
        } else {
          console.error("피부 타임라인 조회 실패:", timelineResult.reason);
        }

        if (factorResult.status === "fulfilled") {
          setFactors(Array.isArray(factorResult.value?.data) ? factorResult.value.data : []);
        } else {
          console.error("개인 분석 요인 조회 실패:", factorResult.reason);
        }

        if (timelineResult.status === "rejected" && factorResult.status === "rejected") {
          setErrorMessage("분석 데이터를 불러오지 못했어요.");
        }
      } catch (error) {
        console.error("변화 화면 조회 실패:", error);

        setErrorMessage("분석 데이터를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const analyses = timeline?.analyses ?? [];

  const firstAnalysis = analyses.length > 0 ? analyses[0] : null;

  const latestAnalysis = analyses.length > 0 ? analyses[analyses.length - 1] : null;

  const currentScore = latestAnalysis?.overallScore ?? localAnalysis?.score ?? null;

  const overallChange =
    firstAnalysis && latestAnalysis
      ? latestAnalysis.overallScore - firstAnalysis.overallScore
      : null;

  const indicators = useMemo(() => {
    if (firstAnalysis && latestAnalysis) {
      return [
        {
          label: "붉은기",
          value: latestAnalysis.rednessScore - firstAnalysis.rednessScore,
        },
        {
          label: "트러블",
          value: latestAnalysis.troubleScore - firstAnalysis.troubleScore,
        },
        {
          label: "건조함",
          value: latestAnalysis.drynessScore - firstAnalysis.drynessScore,
        },
        {
          label: "피부톤 균일도",
          value: latestAnalysis.toneUniformityScore - firstAnalysis.toneUniformityScore,
        },
      ].map((item) => ({
        ...item,
        displayValue: formatDiff(item.value),
        trend: getDiffTrend(item.value),
      }));
    }

    /*
     * 실제 타임라인이 아직 없으면
     * 촬영 후 저장해둔 mock 분석 결과 표시
     */
    if (Array.isArray(localAnalysis?.stats)) {
      return localAnalysis.stats.map((item) => ({
        label: item.label,
        displayValue: item.value,
        trend: item.trend ?? "same",
      }));
    }

    return [];
  }, [firstAnalysis, latestAnalysis, localAnalysis]);

  const correlations = useMemo(() => {
    const items = [];

    factors.forEach((factorItem) => {
      const factorName = FACTOR_LABELS[factorItem.factor] ?? factorItem.factor;

      const metrics = Array.isArray(factorItem.metrics) ? factorItem.metrics : [];

      metrics.forEach((metric) => {
        /*
         * 분석 결과가 없는 metric은 화면에서 제외
         */
        if (!metric.summary) {
          return;
        }

        const metricName = METRIC_LABELS[metric.targetMetric] ?? metric.targetMetric;

        const confidence = getConfidenceInfo(metric.confidenceLevel);

        items.push({
          pair: `${factorName} ↔ ${metricName}`,
          level: confidence.label,
          dots: confidence.dots,
          summary: metric.summary,
          confidenceLevel: metric.confidenceLevel,
        });
      });
    });

    const confidenceScore = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return items
      .sort(
        (a, b) =>
          (confidenceScore[b.confidenceLevel] ?? 0) - (confidenceScore[a.confidenceLevel] ?? 0),
      )
      .slice(0, 5);
  }, [factors]);

  const summary = useMemo(() => {
    /*
     * 실제 개인 분석 summary가 있으면 최우선 사용
     */
    if (correlations.length > 0) {
      return correlations[0].summary;
    }

    /*
     * 타임라인 데이터가 있으면 점수 변화 기반 요약
     */
    if (overallChange !== null) {
      if (overallChange > 0) {
        return `지난 7일 동안 피부 점수가 ${overallChange}점 좋아졌어요. 현재 생활 패턴을 꾸준히 유지해보세요. 😊`;
      }

      if (overallChange < 0) {
        return `지난 7일 동안 피부 점수가 ${Math.abs(
          overallChange,
        )}점 낮아졌어요. 수면과 자외선 노출 기록을 함께 확인해보세요.`;
      }

      return "지난 7일 동안 피부 컨디션이 비교적 안정적으로 유지되고 있어요.";
    }

    /*
     * 현재 촬영한 mock 데이터만 있는 경우
     */
    if (localAnalysis) {
      return "오늘 피부 분석은 완료됐어요. 피부 기록과 생활 기록이 더 쌓이면 7일 변화와 영향 요인을 더 정확하게 분석할 수 있어요.";
    }

    return "피부 분석과 생활 기록을 꾸준히 남기면 나에게 영향을 주는 생활 요인을 분석해드려요.";
  }, [correlations, overallChange, localAnalysis]);

  if (loading) {
    return (
      <div
        style={{
          padding: "45px 20px",
          textAlign: "center",
          fontSize: 13,
          color: "#999",
        }}
      >
        피부 리포트를 준비하고 있어요...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px 20px 30px",
      }}
    >
      {/* 7일 리포트 상단 */}
      <section
        style={{
          padding: 18,
          marginBottom: 20,
          borderRadius: 18,
          background: "#6C5CE7",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 7,
          }}
        >
          7일 피부 리포트
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 5,
          }}
        >
          <strong
            style={{
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            {currentScore ?? "-"}
          </strong>

          <span
            style={{
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            / 100
          </span>
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: 12,
          }}
        >
          {overallChange === null
            ? "현재 피부 분석 결과"
            : overallChange === 0
              ? "7일 전과 동일해요"
              : `7일 전보다 ${formatDiff(overallChange)}`}
        </div>
      </section>

      {errorMessage && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 12,
            background: "#FFF1F3",
            color: "#D85A6A",
            fontSize: 12,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* 주요 지표 변화 */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#111",
          marginBottom: 12,
        }}
      >
        주요 지표 변화
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "4px 16px",
          marginBottom: 20,
        }}
      >
        {indicators.length > 0 ? (
          indicators.map((item, index) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: index !== indicators.length - 1 ? "1px solid #F0F0F0" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#333",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#6C5CE7",
                  }}
                />

                {item.label}
              </div>

              <strong
                style={{
                  fontSize: 13,
                  color:
                    item.trend === "up" ? "#6C5CE7" : item.trend === "down" ? "#4CAF50" : "#999",
                }}
              >
                {item.displayValue}
              </strong>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              fontSize: 12,
              color: "#999",
              lineHeight: 1.6,
            }}
          >
            피부 분석을 2회 이상 하면
            <br />
            지표 변화를 확인할 수 있어요.
          </div>
        )}
      </div>

      {/* 생활 요인 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#111",
          }}
        >
          생활 요인과의 연관성
        </span>

        <span
          style={{
            fontSize: 11,
            color: "#999",
          }}
        >
          최근 7일
        </span>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "4px 16px",
          marginBottom: 20,
        }}
      >
        {correlations.length > 0 ? (
          correlations.map((item, index) => (
            <div
              key={`${item.pair}-${index}`}
              style={{
                padding: "12px 0",
                borderBottom: index !== correlations.length - 1 ? "1px solid #F0F0F0" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#333",
                  }}
                >
                  {item.pair}
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    {item.level}
                  </span>

                  <span
                    style={{
                      fontSize: 9,
                      color: "#6C5CE7",
                    }}
                  >
                    {"●".repeat(item.dots)}
                    {"○".repeat(3 - item.dots)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              fontSize: 12,
              color: "#999",
              lineHeight: 1.6,
            }}
          >
            생활 기록이 더 쌓이면
            <br />
            피부 변화와의 연관성을 보여드려요.
          </div>
        )}
      </div>

      {/* AI 리포트 */}
      <section
        style={{
          padding: 17,
          borderRadius: 16,
          background: "#F0EDFF",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#3B2F8F",
            marginBottom: 7,
          }}
        >
          ✨ AI 리포트
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.65,
            color: "#625B82",
          }}
        >
          {summary}
        </p>

        <p
          style={{
            margin: "10px 0 0",
            fontSize: 10,
            lineHeight: 1.5,
            color: "#999",
          }}
        >
          생활·환경 기록과 피부 변화 사이에서 관찰된 연관성이며, 직접적인 원인을 의미하지 않아요.
        </p>
      </section>
    </div>
  );
}

export default RecordChange;
