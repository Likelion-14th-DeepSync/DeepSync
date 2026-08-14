package kr.deepsync.wellness.image.service;

import kr.deepsync.wellness.common.exception.BusinessException;
import kr.deepsync.wellness.common.exception.ErrorCode;
import kr.deepsync.wellness.image.domain.ImageQualityStatus;
import kr.deepsync.wellness.image.domain.QualityAnalysis;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
public class BasicImageQualityAnalyzer implements ImageQualityAnalyzer {
    private final int passedScore;
    private final int rejectedScore;

    public BasicImageQualityAnalyzer(@Value("${image-quality.passed-score:75}") int passedScore,
                                     @Value("${image-quality.rejected-score:40}") int rejectedScore) {
        this.passedScore = passedScore;
        this.rejectedScore = rejectedScore;
    }

    @Override
    public QualityAnalysis analyze(Resource resource) {
        try (InputStream input = resource.getInputStream()) {
            BufferedImage image = ImageIO.read(input);
            if (image == null) throw new BusinessException(ErrorCode.IMAGE_QUALITY_ANALYSIS_FAILED);

            int resolution = scoreResolution(image);
            int lighting = scoreLighting(image);
            int uniformity = scoreUniformity(image);
            int sharpness = scoreSharpness(image);
            int overall = (int) Math.round(resolution * .20 + lighting * .30 + uniformity * .20 + sharpness * .30);

            List<String> reasons = new ArrayList<>();
            if (resolution < 60) reasons.add("사진 해상도가 낮습니다.");
            if (lighting < 60) reasons.add("얼굴이 잘 보이도록 밝기를 조절해주세요.");
            if (uniformity < 60) reasons.add("한쪽에 그림자가 생기지 않도록 조명을 고르게 해주세요.");
            if (sharpness < 60) reasons.add("카메라를 고정하고 초점을 맞춰주세요.");

            ImageQualityStatus status = decideStatus(overall, reasons);
            return new QualityAnalysis(resolution, lighting, uniformity, sharpness, overall, status, reasons,
                    "basic-quality-v1");
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.IMAGE_QUALITY_ANALYSIS_FAILED);
        }
    }

    private ImageQualityStatus decideStatus(int overall, List<String> reasons) {
        if (overall >= passedScore && reasons.isEmpty()) return ImageQualityStatus.PASSED;
        if (overall < rejectedScore) return ImageQualityStatus.REJECTED;
        return ImageQualityStatus.RETAKE_RECOMMENDED;
    }

    private int scoreResolution(BufferedImage image) {
        return clamp((int) (Math.min(image.getWidth(), image.getHeight()) / 7.2));
    }

    private int scoreLighting(BufferedImage image) {
        double mean = mean(image, 0, image.getWidth());
        return clamp((int) (100 - Math.abs(mean - 135) * 100 / 135));
    }

    private int scoreUniformity(BufferedImage image) {
        double left = mean(image, 0, image.getWidth() / 2);
        double right = mean(image, image.getWidth() / 2, image.getWidth());
        return clamp((int) (100 - Math.abs(left - right) * 2));
    }

    private int scoreSharpness(BufferedImage image) {
        long sum = 0;
        long count = 0;
        int step = sampleStep(image);
        for (int y = 0; y < image.getHeight(); y += step) {
            for (int x = step; x < image.getWidth(); x += step) {
                sum += Math.abs(gray(image.getRGB(x, y)) - gray(image.getRGB(x - step, y)));
                count++;
            }
        }
        return clamp((int) (sum / Math.max(1, count) * 4));
    }

    private double mean(BufferedImage image, int fromX, int toX) {
        long sum = 0;
        long count = 0;
        int step = sampleStep(image);
        for (int y = 0; y < image.getHeight(); y += step) {
            for (int x = fromX; x < toX; x += step) {
                sum += gray(image.getRGB(x, y));
                count++;
            }
        }
        return (double) sum / Math.max(1, count);
    }

    private int sampleStep(BufferedImage image) {
        return Math.max(1, Math.min(image.getWidth(), image.getHeight()) / 300);
    }

    private int gray(int rgb) {
        return (int) (((rgb >> 16) & 255) * .299 + ((rgb >> 8) & 255) * .587 + (rgb & 255) * .114);
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }
}
