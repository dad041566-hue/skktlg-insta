# SK · KT · LG 통합 상담

처음 승인한 화이트·레드 모바일 샘플 구성: 제품 모음 메인 이미지 → 프로모션 혜택 → 2열 상품 카드 → 하단 고정 상담 버튼.

## 실행

`node server.cjs` 실행 후 http://localhost:4173 접속. 별도 빌드나 패키지 설치가 필요하지 않습니다.

## 현재 구성

- 상품 8종 복수 선택과 전화 상담 대화상자
- 전화번호: 010-6866-7176
- 오픈채팅: config.js의 kakaoUrl에 실제 https://open.kakao.com/o/... 주소 입력 시 표시
- 참고 이미지 내용: 최대 430만원 상당 혜택, 테이블오더 13대 기준, 초기 도입비 0원, 월 이용료 안내
- 개인정보 입력 폼이나 신청 저장 기능 없음. 고객이 전화/카카오톡으로 직접 상담하는 구조

이전 식당 배너, 공간별 필터, 절차·FAQ·별도 신청 폼, 반복된 스타일 덮어쓰기를 화면과 코드에서 제거했습니다.

## 배포 파일

index.html, style.css, app.js, config.js, assets/hero.png, assets/PretendardVariable.woff2, assets/FONT-LICENSE.txt.

assets의 restaurant.png와 site-*.png는 과거 시안/검토용이며 현재 사이트에서 사용하지 않습니다.

hero.png는 내장 image_gen으로 제작한 무브랜드 제품 연출 이미지입니다. 카드 이미지는 같은 원본을 SVG viewBox로 표시합니다. Pretendard 라이선스는 assets/FONT-LICENSE.txt에 있습니다.
