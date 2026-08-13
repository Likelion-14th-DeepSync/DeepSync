package kr.deepsync.wellness.dday.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import kr.deepsync.wellness.member.domain.SkinConcern;

import java.time.LocalDate;

public record CreateSkinGoalRequest(
        @NotBlank @Size(max = 100) String title,
        @NotNull @Future LocalDate targetDate,
        @NotNull SkinConcern targetConcern,
        @Size(max = 500) String targetDescription
) {
}
