package kr.deepsync.wellness.auth.api;

import jakarta.validation.Valid;
import kr.deepsync.wellness.auth.dto.request.LoginRequest;
import kr.deepsync.wellness.auth.dto.request.SignUpRequest;
import kr.deepsync.wellness.auth.dto.response.LoginResponse;
import kr.deepsync.wellness.auth.dto.response.SignUpResponse;
import kr.deepsync.wellness.auth.service.AuthService;
import kr.deepsync.wellness.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthApi {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignUpResponse>> signUp(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(authService.signUp(request)));
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }
}
