// 실제 운영 정보와 접수 API를 연결하면 신청 기능이 활성화됩니다.
window.SITE_CONFIG = {
  businessName: '',
  businessInfo: '',
  phone: '010-6866-7176',
  kakaoUrl: '', // 사용할 카카오톡 오픈채팅 링크 (https://open.kakao.com/o/...)
  endpoint: '', // HTTPS POST JSON API. 성공 시 { "ok": true } 응답 필요
  privacyText: '', // 실제 개인정보처리자, 수집 항목, 목적, 보유 기간, 동의 거부 안내
};
