package kr.deepsync.wellness.environment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import kr.deepsync.wellness.common.domain.BaseTimeEntity;
import kr.deepsync.wellness.common.domain.DataSourceType;
import kr.deepsync.wellness.member.domain.Member;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "environment_records", uniqueConstraints =
        @UniqueConstraint(name = "uk_environment_records_member_date", columnNames = {"member_id", "record_date"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EnvironmentRecord extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private LocalDate recordDate;

    @Column(precision = 4, scale = 1)
    private BigDecimal uvIndex;

    @Column(precision = 4, scale = 1)
    private BigDecimal temperature;

    private Integer humidity;
    private Integer fineDust;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DataSourceType sourceType;

    private EnvironmentRecord(Member member, LocalDate recordDate, BigDecimal uvIndex,
                              BigDecimal temperature, Integer humidity, Integer fineDust,
                              DataSourceType sourceType) {
        this.member = member;
        update(recordDate, uvIndex, temperature, humidity, fineDust, sourceType);
    }

    public static EnvironmentRecord create(Member member, LocalDate recordDate, BigDecimal uvIndex,
                                           BigDecimal temperature, Integer humidity, Integer fineDust,
                                           DataSourceType sourceType) {
        return new EnvironmentRecord(member, recordDate, uvIndex, temperature, humidity, fineDust, sourceType);
    }

    public void update(LocalDate recordDate, BigDecimal uvIndex, BigDecimal temperature,
                       Integer humidity, Integer fineDust, DataSourceType sourceType) {
        this.recordDate = recordDate;
        this.uvIndex = uvIndex;
        this.temperature = temperature;
        this.humidity = humidity;
        this.fineDust = fineDust;
        this.sourceType = sourceType;
    }
}
