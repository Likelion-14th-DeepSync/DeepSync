package kr.deepsync.wellness.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "요청 값이 올바르지 않습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "DUPLICATE_EMAIL", "이미 사용 중인 이메일입니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "인증이 필요합니다."),
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "회원을 찾을 수 없습니다."),
    SKIN_GOAL_NOT_FOUND(HttpStatus.NOT_FOUND, "SKIN_GOAL_NOT_FOUND", "피부 목표를 찾을 수 없습니다."),
    ACTIVE_SKIN_GOAL_EXISTS(HttpStatus.CONFLICT, "ACTIVE_SKIN_GOAL_EXISTS", "이미 진행 중인 피부 목표가 있습니다."),
    INVALID_GOAL_DATE(HttpStatus.BAD_REQUEST, "INVALID_GOAL_DATE", "목표 날짜는 오늘 이후여야 합니다."),
    UNREGISTERED_SKIN_CONCERN(HttpStatus.BAD_REQUEST, "UNREGISTERED_SKIN_CONCERN", "프로필에 등록된 피부 고민만 목표로 선택할 수 있습니다."),
    SKIN_GOAL_NOT_ACTIVE(HttpStatus.CONFLICT, "SKIN_GOAL_NOT_ACTIVE", "진행 중인 피부 목표만 변경할 수 있습니다."),
    LIFESTYLE_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "LIFESTYLE_RECORD_NOT_FOUND", "생활 기록을 찾을 수 없습니다."),
    ENVIRONMENT_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "ENVIRONMENT_RECORD_NOT_FOUND", "환경 기록을 찾을 수 없습니다."),
    DUPLICATE_LIFESTYLE_RECORD(HttpStatus.CONFLICT, "DUPLICATE_LIFESTYLE_RECORD", "해당 날짜의 생활 기록이 이미 있습니다."),
    DUPLICATE_ENVIRONMENT_RECORD(HttpStatus.CONFLICT, "DUPLICATE_ENVIRONMENT_RECORD", "해당 날짜의 환경 기록이 이미 있습니다."),
    FUTURE_RECORD_DATE(HttpStatus.BAD_REQUEST, "FUTURE_RECORD_DATE", "미래 날짜의 기록은 작성할 수 없습니다."),
    INVALID_DATE_RANGE(HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE", "조회 시작일은 종료일보다 늦을 수 없습니다."),
    SKIN_IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "SKIN_IMAGE_NOT_FOUND", "피부 사진을 찾을 수 없습니다."),
    EMPTY_IMAGE_FILE(HttpStatus.BAD_REQUEST, "EMPTY_IMAGE_FILE", "이미지 파일이 비어 있습니다."),
    UNSUPPORTED_IMAGE_FORMAT(HttpStatus.BAD_REQUEST, "UNSUPPORTED_IMAGE_FORMAT", "JPEG 또는 PNG 이미지만 업로드할 수 있습니다."),
    IMAGE_FILE_TOO_LARGE(HttpStatus.CONTENT_TOO_LARGE, "IMAGE_FILE_TOO_LARGE", "이미지 파일은 10MB 이하만 업로드할 수 있습니다."),
    FUTURE_CAPTURED_AT(HttpStatus.BAD_REQUEST, "FUTURE_CAPTURED_AT", "미래 시각의 피부 사진은 등록할 수 없습니다."),
    IMAGE_STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "IMAGE_STORAGE_ERROR", "이미지 파일을 저장하거나 불러오지 못했습니다."),
    IMAGE_QUALITY_NOT_FOUND(HttpStatus.NOT_FOUND, "IMAGE_QUALITY_NOT_FOUND", "사진 품질 검사 결과를 찾을 수 없습니다."),
    IMAGE_QUALITY_ANALYSIS_FAILED(HttpStatus.UNPROCESSABLE_CONTENT, "IMAGE_QUALITY_ANALYSIS_FAILED", "사진 품질을 분석할 수 없습니다."),
    SKIN_ANALYSIS_NOT_FOUND(HttpStatus.NOT_FOUND, "SKIN_ANALYSIS_NOT_FOUND", "피부 분석 결과를 찾을 수 없습니다."),
    IMAGE_QUALITY_CHECK_REQUIRED(HttpStatus.CONFLICT, "IMAGE_QUALITY_CHECK_REQUIRED", "피부 분석 전에 사진 품질 검사가 필요합니다."),
    IMAGE_QUALITY_NOT_ACCEPTED(HttpStatus.UNPROCESSABLE_CONTENT, "IMAGE_QUALITY_NOT_ACCEPTED", "품질 검사를 통과한 사진만 피부 분석을 요청할 수 있습니다."),
    SKIN_ANALYSIS_IN_PROGRESS(HttpStatus.CONFLICT, "SKIN_ANALYSIS_IN_PROGRESS", "이미 피부 분석이 진행 중입니다."),
    SKIN_ANALYSIS_ALREADY_COMPLETED(HttpStatus.CONFLICT, "SKIN_ANALYSIS_ALREADY_COMPLETED", "이미 완료된 피부 분석입니다."),
    SKIN_ANALYSIS_NOT_PENDING(HttpStatus.CONFLICT, "SKIN_ANALYSIS_NOT_PENDING", "대기 중인 피부 분석만 처리를 시작할 수 있습니다."),
    SKIN_ANALYSIS_NOT_PROCESSING(HttpStatus.CONFLICT, "SKIN_ANALYSIS_NOT_PROCESSING", "처리 중인 피부 분석만 완료하거나 실패 처리할 수 있습니다."),
    SKIN_ANALYSIS_NOT_COMPLETED(HttpStatus.CONFLICT, "SKIN_ANALYSIS_NOT_COMPLETED", "완료된 피부 분석만 비교하거나 기준으로 설정할 수 있습니다."),
    SKIN_ANALYSIS_BASELINE_NOT_FOUND(HttpStatus.NOT_FOUND, "SKIN_ANALYSIS_BASELINE_NOT_FOUND", "피부 분석 기준일을 찾을 수 없습니다."),
    EXPERIMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "EXPERIMENT_NOT_FOUND", "생활 실험을 찾을 수 없습니다."),
    OPEN_EXPERIMENT_EXISTS(HttpStatus.CONFLICT, "OPEN_EXPERIMENT_EXISTS", "이미 예정되었거나 진행 중인 생활 실험이 있습니다."),
    INVALID_EXPERIMENT_START_DATE(HttpStatus.BAD_REQUEST, "INVALID_EXPERIMENT_START_DATE", "실험 시작일은 오늘 또는 이후여야 합니다."),
    EXPERIMENT_NOT_EDITABLE(HttpStatus.CONFLICT, "EXPERIMENT_NOT_EDITABLE", "진행 가능한 실험만 변경할 수 있습니다."),
    EXPERIMENT_DATE_OUT_OF_RANGE(HttpStatus.BAD_REQUEST, "EXPERIMENT_DATE_OUT_OF_RANGE", "실험 기간에 포함된 날짜만 기록할 수 있습니다."),
    FUTURE_EXPERIMENT_CHECK(HttpStatus.BAD_REQUEST, "FUTURE_EXPERIMENT_CHECK", "미래 날짜의 실천 여부는 기록할 수 없습니다."),
    MANUAL_CHECK_REQUIRED(HttpStatus.BAD_REQUEST, "MANUAL_CHECK_REQUIRED", "이 실험은 생활 기록으로 자동 판정할 수 없습니다."),
    MANUAL_CHECK_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "MANUAL_CHECK_NOT_ALLOWED", "이 실험은 생활 기록을 통해 자동으로 판정됩니다."),
    EXPERIMENT_NOT_FINISHED(HttpStatus.CONFLICT, "EXPERIMENT_NOT_FINISHED", "실험 종료일이 지나야 완료할 수 있습니다."),
    EXPERIMENT_RESULT_NOT_FOUND(HttpStatus.NOT_FOUND, "EXPERIMENT_RESULT_NOT_FOUND", "생활 실험 결과를 찾을 수 없습니다."),
    EXPERIMENT_RESULT_EXISTS(HttpStatus.CONFLICT, "EXPERIMENT_RESULT_EXISTS", "이미 생성된 생활 실험 결과가 있습니다."),
    EXPERIMENT_RESULT_REQUIRES_COMPLETION(HttpStatus.CONFLICT, "EXPERIMENT_RESULT_REQUIRES_COMPLETION", "완료된 생활 실험만 결과를 계산할 수 있습니다."),
    EXPERIMENT_ANALYSIS_DATA_INSUFFICIENT(HttpStatus.UNPROCESSABLE_CONTENT, "EXPERIMENT_ANALYSIS_DATA_INSUFFICIENT", "실험 전후 피부 분석 데이터가 각각 한 개 이상 필요합니다."),
    INVALID_FACTOR_ANALYSIS_PERIOD(HttpStatus.BAD_REQUEST, "INVALID_FACTOR_ANALYSIS_PERIOD", "영향 요인 분석 기간은 7일 이상 365일 이하여야 합니다."),
    FACTOR_ANALYSIS_NOT_FOUND(HttpStatus.NOT_FOUND, "FACTOR_ANALYSIS_NOT_FOUND", "개인별 영향 요인 분석 결과를 찾을 수 없습니다."),
    INVALID_CONFIDENCE_ANALYSIS_PERIOD(HttpStatus.BAD_REQUEST, "INVALID_CONFIDENCE_ANALYSIS_PERIOD", "종합 신뢰도 분석 기간은 7일 이상 90일 이하여야 합니다."),
    ANALYSIS_CONFIDENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "ANALYSIS_CONFIDENCE_NOT_FOUND", "종합 분석 신뢰도 결과를 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
