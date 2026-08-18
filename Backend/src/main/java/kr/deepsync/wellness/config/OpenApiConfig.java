package kr.deepsync.wellness.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.utils.SpringDocUtils;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";

    static {
        SpringDocUtils.getConfig().addAnnotationsToIgnore(AuthenticationPrincipal.class);
    }

    @Bean
    public OpenAPI deepSyncOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("DeepSync API")
                        .description("피부 상태와 생활·환경 기록을 연결하는 DeepSync 웰니스 서비스 API입니다. "
                                + "로그인 후 발급받은 accessToken을 Authorize에 입력해 인증 API를 테스트하세요.")
                        .version("v1")
                        .license(new License().name("Private Project")))
                .components(new Components().addSecuritySchemes(
                        BEARER_AUTH,
                        new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("로그인 응답의 accessToken만 입력하세요. Bearer 접두사는 자동으로 추가됩니다.")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
                .tags(List.of(
                        new Tag().name("인증").description("회원가입과 JWT 로그인"),
                        new Tag().name("회원").description("내 프로필 조회 및 수정"),
                        new Tag().name("피부 목표").description("Skin D-Day 목표 관리"),
                        new Tag().name("생활 기록").description("수면, 수분 섭취, 야식 등 생활 데이터"),
                        new Tag().name("환경 기록").description("UV, 온도, 습도, 미세먼지 등 환경 데이터"),
                        new Tag().name("피부 사진").description("피부 사진 업로드, 조회 및 촬영 품질 검사"),
                        new Tag().name("피부 분석").description("피부 분석 결과, 기준선, 비교 및 타임라인"),
                        new Tag().name("개인 분석").description("개인별 영향 요인, 오늘의 변화 설명 및 분석 신뢰도"),
                        new Tag().name("생활 실험").description("7일·30일·90일 생활 실험과 결과"),
                        new Tag().name("D-Day 대시보드").description("목표, 실험, 위험 요인을 종합한 대시보드"),
                        new Tag().name("리포트").description("주간·월간 피부 및 생활 리포트"),
                        new Tag().name("리마인더").description("기록·촬영 알림 설정과 오늘 상태")
                ));
    }

    @Bean
    public OperationCustomizer categorizeOperations() {
        return (operation, handlerMethod) -> {
            String packageName = handlerMethod.getBeanType().getPackageName();
            operation.setTags(List.of(resolveTag(packageName, handlerMethod.getBeanType().getSimpleName())));
            if (packageName.contains(".auth.")) {
                operation.setSecurity(List.of());
            }
            return operation;
        };
    }

    private String resolveTag(String packageName, String fallback) {
        if (packageName.contains(".auth.")) return "인증";
        if (packageName.contains(".member.")) return "회원";
        if (packageName.contains(".dday.")) return "피부 목표";
        if (packageName.contains(".lifestyle.")) return "생활 기록";
        if (packageName.contains(".environment.")) return "환경 기록";
        if (packageName.contains(".image.")) return "피부 사진";
        if (packageName.contains(".experiment.")) return "생활 실험";
        if (packageName.contains(".dashboard.")) return "D-Day 대시보드";
        if (packageName.contains(".report.")) return "리포트";
        if (packageName.contains(".reminder.")) return "리마인더";
        if (packageName.contains(".analysis.")) return "개인 분석";
        if (packageName.contains(".skin.")) return "피부 분석";
        return fallback;
    }
}
