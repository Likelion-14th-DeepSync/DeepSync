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
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
