# DeepSync

## 로컬 데이터베이스

백엔드는 MySQL 8.4를 사용하며 Flyway로 스키마 변경을 관리합니다.

```bash
cp .env.example .env
docker compose up -d mysql
cd Backend
./gradlew bootRun
```

기본 접속 주소는 `localhost:3307/deepsync`입니다. 다른 DB를 사용한다면
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수를 지정하세요.

마이그레이션 SQL은 `Backend/src/main/resources/db/migration`에
`V<버전>__<설명>.sql` 형식으로 추가합니다.
