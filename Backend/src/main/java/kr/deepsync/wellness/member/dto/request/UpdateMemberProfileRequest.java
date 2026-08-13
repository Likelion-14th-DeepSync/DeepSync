package kr.deepsync.wellness.member.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import kr.deepsync.wellness.member.domain.SkinConcern;

import java.util.Set;

public record UpdateMemberProfileRequest(
        @NotBlank @Size(max = 50) String nickname,
        @NotEmpty Set<SkinConcern> skinConcerns
) {
}
