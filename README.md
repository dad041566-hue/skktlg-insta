# SK · KT · LG 통합 상담

- 사이트: https://skktlg-insta.vercel.app
- 설문 바로가기: https://skktlg-insta.vercel.app/#consult
- 관리자 접수함: https://skktlg-insta.vercel.app/admin.html
- GitHub: https://github.com/dad041566-hue/skktlg-insta

## 설문 접수

기존 화이트·레드 디자인과 상품 이미지를 유지합니다. 하단 버튼과 패키지 버튼은 5단계 설문을 엽니다.

1. 이용 장소: 우리 집 / 매장·사무실 / 모텔·호텔
2. 필요한 상품: 8종 복수 선택 또는 아직 잘 모르겠어요
3. 설치 상황과 선택 상품별 추가 질문: 통신사, 테이블오더·TV 수량, CCTV 수량, 업종
4. 시·도, 시·군·구, 설치 희망 시기
5. 선택 내용 요약·수정, 이름, 휴대폰 번호, 연락 희망 시간, 개인정보 수집·이용 동의

홈에서 선택한 상품과 이전 단계의 답변이 이어집니다. 연락처는 브라우저 저장소에 보관하지 않습니다. 실제 서버 저장이 성공해야 접수번호와 완료 화면이 표시됩니다. 동일 요청의 재시도는 중복 저장하지 않습니다.

## 저장 및 관리

Vercel Functions와 서울(icn1)의 비공개 Vercel Blob 저장소를 사용합니다. 서버에서 입력값, 동의 버전, 요청 출처를 검사하고 IP·전화번호 기반 접수 빈도를 제한합니다. 저장소 인증 값은 서버 환경 변수에서만 읽습니다.

관리자 화면에서 접수 내용을 확인하고 신규 / 연락 완료 / 상담 완료 상태를 저장하거나 접수를 삭제할 수 있습니다. 로그인은 HttpOnly·SameSite=Strict 쿠키를 사용하며 운영 배포에는 Secure 속성이 적용됩니다. 비밀번호는 서버에 SHA-256 해시로 저장됩니다. 초기 비밀번호는 임의 생성한 긴 문자열이며 `private/admin-access.txt`에서 확인합니다. 이 파일은 Git과 배포에 포함되지 않습니다.

접수 데이터는 90일 보관 후 매일 정기 작업으로 삭제합니다. 정리 작업은 한국 시간 오전 4시경 실행됩니다. Vercel Cron 호출은 CRON_SECRET으로 인증합니다. 고객에게 별도 문자·이메일을 자동 발송하는 기능은 없습니다.

운영 환경 변수: BLOB_READ_WRITE_TOKEN (또는 Vercel Blob OIDC 연결), ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET, CRON_SECRET.

## 개발과 검사

- 설치: `npm ci`
- 빌드: `npm run build`
- 검사: `npm test`
- 로컬 실행: `npm run dev`
- 로컬 파일 저장으로 검사하려면 LOCAL_DATA_DIR 환경 변수에 `.local-data/preview`와 같은 비공개 폴더를 지정합니다. 운영 배포에서는 이 방식을 사용할 수 없습니다.
- 로컬 관리자 검사에는 `.env.admin.local`의 환경 변수를 로드합니다.

공개 파일은 build.cjs의 명시적 허용 목록만 dist에 복사됩니다. api와 lib는 서버에서 사용합니다. private, output, .local-data, .env 파일은 배포에서 제외됩니다.

검사 범위: 개인정보 동의·전화번호·조건부 입력 검증, 중복 및 동시 접수, 관리자 인증과 상태 변경, 다른 출처의 요청 거부, 만료 데이터 삭제. 브라우저에서 전체 접수 흐름, 관리자 조회, 390px·320px 화면 정렬을 확인했습니다.

## 기존 상품 안내

최대 430만원 상당 혜택은 테이블오더 13대 기준 신청 시 조건을 유지합니다. 설문 제출만으로 가입이나 사은품 지급이 확정되지 않으며, 조건에 맞는 혜택은 상담 시 안내합니다. 문의 번호는 010-6866-7176입니다.

상품 이미지는 기존 image_gen 연출 이미지이며 Pretendard 라이선스는 assets/FONT-LICENSE.txt에 있습니다.

저장소 참고: https://vercel.com/docs/vercel-blob/private-storage
