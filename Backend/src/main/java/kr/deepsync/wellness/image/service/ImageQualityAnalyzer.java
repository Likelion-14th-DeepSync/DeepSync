package kr.deepsync.wellness.image.service;

import kr.deepsync.wellness.image.domain.QualityAnalysis;
import org.springframework.core.io.Resource;

public interface ImageQualityAnalyzer {
    QualityAnalysis analyze(Resource image);
}
