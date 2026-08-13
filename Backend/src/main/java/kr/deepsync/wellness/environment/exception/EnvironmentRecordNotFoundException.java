package kr.deepsync.wellness.environment.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class EnvironmentRecordNotFoundException extends BusinessException {
    public EnvironmentRecordNotFoundException() {
        super(ErrorCode.ENVIRONMENT_RECORD_NOT_FOUND);
    }
}
