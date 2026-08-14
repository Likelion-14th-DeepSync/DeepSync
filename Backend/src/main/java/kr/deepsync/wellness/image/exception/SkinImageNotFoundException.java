package kr.deepsync.wellness.image.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class SkinImageNotFoundException extends BusinessException {
    public SkinImageNotFoundException() {
        super(ErrorCode.SKIN_IMAGE_NOT_FOUND);
    }
}
