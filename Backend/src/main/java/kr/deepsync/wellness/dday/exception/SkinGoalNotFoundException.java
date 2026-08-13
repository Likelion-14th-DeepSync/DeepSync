package kr.deepsync.wellness.dday.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class SkinGoalNotFoundException extends BusinessException {
    public SkinGoalNotFoundException() {
        super(ErrorCode.SKIN_GOAL_NOT_FOUND);
    }
}
