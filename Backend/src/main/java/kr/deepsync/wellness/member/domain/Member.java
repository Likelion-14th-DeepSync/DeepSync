package kr.deepsync.wellness.member.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Getter
@Entity
@Table(name = "members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberRole role;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "member_skin_concerns", joinColumns = @JoinColumn(name = "member_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "concern", nullable = false, length = 30)
    private Set<SkinConcern> skinConcerns = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SkinType skinType;

    private Member(String email, String password, String nickname, Set<SkinConcern> skinConcerns, SkinType skinType) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = MemberRole.USER;
        this.skinConcerns = new HashSet<>(skinConcerns);
        this.skinType = skinType;
    }

    public static Member create(String email, String encodedPassword, String nickname, Set<SkinConcern> skinConcerns, SkinType skinType) {
        return new Member(email.toLowerCase(), encodedPassword, nickname, skinConcerns, skinType);
    }

    public void updateProfile(String nickname, Set<SkinConcern> skinConcerns) {
        this.nickname = nickname;
        this.skinConcerns.clear();
        this.skinConcerns.addAll(skinConcerns);
    }
}
