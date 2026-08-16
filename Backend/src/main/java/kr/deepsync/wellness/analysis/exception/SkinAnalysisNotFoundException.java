package kr.deepsync.wellness.analysis.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class SkinAnalysisNotFoundException extends BusinessException {
    public SkinAnalysisNotFoundException() {
        super(ErrorCode.SKIN_ANALYSIS_NOT_FOUND);
    }
}
