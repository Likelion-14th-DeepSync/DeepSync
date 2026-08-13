package kr.deepsync.wellness.lifestyle.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class LifestyleRecordNotFoundException extends BusinessException {
    public LifestyleRecordNotFoundException() {
        super(ErrorCode.LIFESTYLE_RECORD_NOT_FOUND);
    }
}
