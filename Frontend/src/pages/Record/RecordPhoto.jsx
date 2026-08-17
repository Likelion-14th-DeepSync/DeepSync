import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, ArrowRight } from "lucide-react";

const DAILY_RECORD_STORAGE_KEY = "wellness-daily-records";

function formatDate(dateKey) {
  const [, month, day] = dateKey.split("-").map(Number);

  const date = new Date(`${dateKey}T00:00:00`);

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return `${month}/${day} (${weekdays[date.getDay()]})`;
}

function formatLongDate(dateKey) {
  const [, month, day] = dateKey.split("-").map(Number);

  const date = new Date(`${dateKey}T00:00:00`);

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return `${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

function RecordPhoto() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DAILY_RECORD_STORAGE_KEY);

      const parsed = saved ? JSON.parse(saved) : {};

      const recordArray = Object.entries(parsed)
        .map(([date, record]) => ({
          date,
          ...record,
        }))
        /*
         * 실제 사진을 찍은 기록만 사진 기록에 표시
         */
        .filter((record) => record.photoDataUrl)
        /*
         * 최신 날짜부터
         */
        .sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));

      setRecords(recordArray);
    } catch {
      setRecords([]);
    }
  }, []);

  const latestRecords = records.slice(0, 6);

  /*
   * 사진 비교:
   * 가장 오래된 기록 ↔ 가장 최신 기록
   */
  const comparison = useMemo(() => {
    if (records.length < 2) {
      return null;
    }

    const latest = records[0];

    const oldest = records[records.length - 1];

    return {
      before: oldest,
      after: latest,
    };
  }, [records]);

  const scoreDifference = comparison
    ? (comparison.after.skinScore ?? 0) - (comparison.before.skinScore ?? 0)
    : 0;

  const handleCapture = () => {
    navigate("/ai?mode=capture&from=record");
  };

  const handleChangeDetail = () => {
    navigate("/record?tab=change");
  };

  return (
    <div
      style={{
        padding: "22px 20px 120px",
      }}
    >
      {/* 사진 기록 제목 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: "#111",
          }}
        >
          사진 기록
        </h2>

        {records.length > 6 && (
          <button
            type="button"
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              color: "#6C5CE7",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            전체 보기 ›
          </button>
        )}
      </div>

      {/* 사진이 하나도 없는 경우 */}
      {records.length === 0 ? (
        <section
          style={{
            padding: "38px 20px",
            marginBottom: 18,
            background: "#fff",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              margin: "0 auto 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 15,
              background: "#F0EDFF",
              color: "#6C5CE7",
            }}
          >
            <ImageIcon size={24} strokeWidth={1.8} />
          </div>

          <h3
            style={{
              margin: "0 0 6px",
              fontSize: 15,
              fontWeight: 700,
              color: "#222",
            }}
          >
            아직 피부 사진 기록이 없어요
          </h3>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: 11,
              lineHeight: 1.6,
              color: "#999",
            }}
          >
            피부 사진을 촬영하면 날짜별 피부 변화가
            <br />
            여기에 자동으로 기록돼요.
          </p>

          <button
            type="button"
            onClick={handleCapture}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "11px 18px",
              border: "none",
              borderRadius: 11,
              background: "#6C5CE7",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Camera size={16} />첫 사진 촬영하기
          </button>
        </section>
      ) : (
        <>
          {/* 실제 사진 목록 */}
          <section
            style={{
              padding: 14,
              marginBottom: 16,
              background: "#fff",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {latestRecords.map((record) => (
                <div
                  key={record.date}
                  style={{
                    minWidth: 0,
                  }}
                >
                  <img
                    src={record.photoDataUrl}
                    alt={`${record.date} 피부 기록`}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: 11,
                      background: "#eee",
                    }}
                  />

                  <div
                    style={{
                      marginTop: 6,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#999",
                      }}
                    >
                      {formatDate(record.date)}
                    </div>

                    <strong
                      style={{
                        display: "block",
                        marginTop: 1,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#111",
                      }}
                    >
                      {record.skinScore ?? "-"}점
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* 촬영 안내 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 16,
                padding: "12px",
                borderRadius: 12,
                background: "#F7F6FF",
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontSize: 10,
                  lineHeight: 1.5,
                  color: "#777",
                }}
              >
                피부 사진을 꾸준히 기록하면
                <br />더 정확한 변화 분석이 가능해요.
              </div>

              <button
                type="button"
                onClick={handleCapture}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  padding: "9px 11px",
                  border: "none",
                  borderRadius: 10,
                  background: "#6C5CE7",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Camera size={14} />
                사진 촬영
              </button>
            </div>
          </section>

          {/* 사진 비교 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "22px 0 12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "#111",
              }}
            >
              사진 비교
            </h2>

            {comparison && (
              <button
                type="button"
                onClick={handleChangeDetail}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: "#6C5CE7",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                자세히 보기 ›
              </button>
            )}
          </div>

          {comparison ? (
            <section
              style={{
                padding: "20px 16px",
                marginBottom: 20,
                background: "#fff",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 36px 1fr",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* 이전 */}
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <img
                    src={comparison.before.photoDataUrl}
                    alt="이전 피부"
                    style={{
                      width: 90,
                      height: 90,
                      maxWidth: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />

                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 10,
                      color: "#999",
                    }}
                  >
                    {formatLongDate(comparison.before.date)}
                  </div>

                  <strong
                    style={{
                      fontSize: 13,
                      color: "#111",
                    }}
                  >
                    {comparison.before.skinScore}점
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    color: "#999",
                  }}
                >
                  <ArrowRight size={22} />
                </div>

                {/* 현재 */}
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <img
                    src={comparison.after.photoDataUrl}
                    alt="최근 피부"
                    style={{
                      width: 90,
                      height: 90,
                      maxWidth: "100%",
                      objectFit: "cover",
                      borderRadius: 12,
                    }}
                  />

                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 10,
                      color: "#999",
                    }}
                  >
                    {formatLongDate(comparison.after.date)}
                  </div>

                  <strong
                    style={{
                      fontSize: 13,
                      color: "#6C5CE7",
                    }}
                  >
                    {comparison.after.skinScore}점
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: 15,
                  paddingTop: 13,
                  borderTop: "1px solid #F0F0F0",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#999",
                  }}
                >
                  피부 점수 변화{" "}
                </span>

                <strong
                  style={{
                    fontSize: 12,
                    color: scoreDifference >= 0 ? "#4CAF50" : "#E35D6A",
                  }}
                >
                  {scoreDifference > 0 ? "+" : ""}
                  {scoreDifference}점
                </strong>
              </div>
            </section>
          ) : (
            /* 사진 1장밖에 없을 때 */
            <section
              style={{
                padding: "28px 20px",
                marginBottom: 20,
                background: "#fff",
                borderRadius: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 13,
                  background: "#F0EDFF",
                  color: "#6C5CE7",
                }}
              >
                <ImageIcon size={21} />
              </div>

              <strong
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontSize: 13,
                  color: "#222",
                }}
              >
                비교할 사진이 더 필요해요
              </strong>

              <span
                style={{
                  fontSize: 10,
                  lineHeight: 1.5,
                  color: "#999",
                }}
              >
                피부 사진이 2장 이상 쌓이면
                <br />
                이전 기록과 최근 기록을 비교할 수 있어요.
              </span>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default RecordPhoto;
