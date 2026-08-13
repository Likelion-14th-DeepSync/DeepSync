package kr.deepsync.wellness.auth.service;

import kr.deepsync.wellness.auth.dto.request.LoginRequest;
import kr.deepsync.wellness.auth.dto.request.SignUpRequest;
import kr.deepsync.wellness.auth.dto.response.LoginResponse;
import kr.deepsync.wellness.auth.dto.response.SignUpResponse;
import kr.deepsync.wellness.auth.exception.InvalidCredentialsException;
import kr.deepsync.wellness.member.domain.Member;
import kr.deepsync.wellness.member.exception.DuplicateEmailException;
import kr.deepsync.wellness.member.repository.MemberRepository;
import kr.deepsync.wellness.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {
        String email = normalizeEmail(request.email());
        if (memberRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }

        Member member = Member.create(
                email,
                passwordEncoder.encode(request.password()),
                request.nickname(),
                request.skinConcerns()
        );
        return SignUpResponse.from(memberRepository.save(member));
    }

    public LoginResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), member.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtTokenProvider.createAccessToken(member.getId(), member.getRole());
        return LoginResponse.bearer(token, jwtTokenProvider.getAccessTokenExpirationSeconds());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
