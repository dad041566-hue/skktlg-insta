# SK · KT · LG 통합 상담

- 공개 사이트: https://skktlg-insta.vercel.app
- GitHub: https://github.com/dad041566-hue/skktlg-insta
- Vercel 프로젝트: skktlg-insta (main 브랜치 연결)

main에 push하면 Vercel에서 `node build.cjs`를 실행하고 dist/를 자동 배포합니다.

화이트·레드 모바일 샘플 구성: 통신사 표시 → 패키지 이미지와 프로모션 혜택 → 2열 상품 카드 → 하단 고정 상담 버튼. 중복된 기존 메인 소개·제품 이미지·상담 버튼은 제거했습니다.

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

index.html, style.css, app.js, config.js, assets/hero.png, assets/package-promotion.png, assets/PretendardVariable.woff2, assets/FONT-LICENSE.txt.

assets의 restaurant.png와 site-*.png는 과거 시안/검토용이며 현재 사이트에서 사용하지 않습니다.

hero.png는 내장 image_gen으로 제작한 무브랜드 제품 연출 이미지입니다. 카드 이미지는 같은 원본을 SVG viewBox로 표시합니다. Pretendard 라이선스는 assets/FONT-LICENSE.txt에 있습니다.

## 패키지 전용 이미지

assets/package-promotion.png는 내장 image_gen으로 새로 제작했습니다. 기존 선물상자 확대 이미지를 대체하여 패키지 전체 구성을 보여줍니다. 설명·금액·조건은 이미지에 넣지 않고 HTML로 표시합니다.

제작 프롬프트: 밝은 흰색·연분홍 스튜디오, 낮은 흰색 단 위에 TV와 공유기·스마트 포스·음식 메뉴가 보이는 테이블오더·흰 정수기·돔 CCTV를 모아 배치하고 빨간 리본 선물상자를 보조 요소로 사용한 사실적인 가로 3:2 제품 광고 사진. 제품 전체를 선명하게, 로고·글자·가격·사람·키오스크 없이 제작.
