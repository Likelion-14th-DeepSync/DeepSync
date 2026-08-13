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
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
