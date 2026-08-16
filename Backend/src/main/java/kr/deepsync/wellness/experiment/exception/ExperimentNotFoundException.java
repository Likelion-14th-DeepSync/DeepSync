package kr.deepsync.wellness.experiment.exception;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;

public class ExperimentNotFoundException extends BusinessException {
    public ExperimentNotFoundException() {
        super(ErrorCode.EXPERIMENT_NOT_FOUND);
    }
}
