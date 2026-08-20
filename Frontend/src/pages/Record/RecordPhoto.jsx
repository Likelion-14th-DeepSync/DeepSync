import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, ArrowRight } from "lucide-react";
import { getSkinImages } from "../../api/skinImages";

function formatDate(dateKey) {
  if (!dateKey) return "-";

  const [, month, day] = dateKey.split("-").map(Number);
  const date = new Date(`${dateKey}T00:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return `${month}/${day} (${weekdays[date.getDay()]})`;
}

function formatLongDate(dateKey) {
  if (!dateKey) return "-";

  const [, month, day] = dateKey.split("-").map(Number);
  const date = new Date(`${dateKey}T00:00:00`);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  return `${month}월 ${day}일 (${weekdays[date.getDay()]})`;
}

function RecordPhoto() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchSkinImages = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await getSkinImages();

        console.log("피부 사진 조회 성공:", response);

        const images = Array.isArray(response?.data) ? response.data : [];

        const recordArray = images
          .map((image) => ({
            id: image.imageId,
            date: image.capturedAt ? image.capturedAt.split("T")[0] : null,
            photoDataUrl: image.imageUrl,
            skinScore: null,
            direction: image.direction,
            makeupApplied: image.makeupApplied,
            contentType: image.contentType,
            fileSize: image.fileSize,
            qualityStatus: image.qualityStatus,
            createdAt: image.createdAt,
          }))
          .filter((record) => record.id && record.date && record.photoDataUrl)
          .sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));

        setRecords(recordArray);
      } catch (error) {
        console.error("피부 사진 조회 실패:", error);

        const message =
          error.response?.data?.error?.message ??
          error.message ??
          "피부 사진 기록을 불러오지 못했습니다.";

        setErrorMessage(message);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkinImages();
  }, []);

  const latestRecords = records.slice(0, 6);

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

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        padding: "22px 20px 120px",
      }}
    >
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

      {isLoading ? (
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

          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#999",
            }}
          >
            피부 사진 기록을 불러오는 중이에요...
          </p>
        </section>
      ) : errorMessage ? (
        <section
          style={{
            padding: "34px 20px",
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
              fontSize: 14,
              fontWeight: 700,
              color: "#222",
            }}
          >
            사진 기록을 불러오지 못했어요
          </h3>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: 10,
              lineHeight: 1.5,
              color: "#999",
            }}
          >
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 10,
              background: "#6C5CE7",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 불러오기
          </button>
        </section>
      ) : records.length === 0 ? (
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
                  key={record.id}
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
                      {record.skinScore != null ? `${record.skinScore}점` : "분석 전"}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

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
                    {comparison.before.skinScore != null
                      ? `${comparison.before.skinScore}점`
                      : "분석 전"}
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
                    {comparison.after.skinScore != null
                      ? `${comparison.after.skinScore}점`
                      : "분석 전"}
                  </strong>
                </div>
              </div>

              {comparison.before.skinScore != null && comparison.after.skinScore != null && (
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
              )}
            </section>
          ) : (
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
