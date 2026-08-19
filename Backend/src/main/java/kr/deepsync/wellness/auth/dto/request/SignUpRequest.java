package kr.deepsync.wellness.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import kr.deepsync.wellness.member.domain.SkinConcern;
import kr.deepsync.wellness.member.domain.SkinType;

import java.util.Set;

public record SignUpRequest(
        @NotBlank @Email String email,
        @NotBlank
        @Size(min = 8, max = 64)
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$")
        String password,
        @NotBlank @Size(max = 50) String nickname,
        @NotEmpty Set<SkinConcern> skinConcerns,
        SkinType skinType
) {
}
