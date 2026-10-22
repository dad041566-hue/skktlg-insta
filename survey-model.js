(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SurveyModel=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const products=['인터넷·TV','정수기','매장전화','테이블오더','키오스크','포스','CCTV','모텔·호텔 다량 TV'];
  const places=['우리 집','매장·사무실','모텔·호텔'];
  const situations=['신규 설치','기존 상품 변경','추가 설치','상담 후 결정'];
  const carriers=['SK','KT','LG','기타','이용 안 함','모름'];
  const regions=['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'];
  const timings=['가능한 빠르게','이번 달','다음 달 이후','미정'];
  const contactTimes=['시간 상관없음','오전 9~12시','오후 12~6시','오후 6시 이후'];
  const statuses=['신규','연락 완료','상담 완료'];
  const privacyVersion='2026-10-22-v1';
  const clean=(value,max=100)=>typeof value==='string'?value.trim().slice(0,max):'';
  function normalize(data={}){
    const chosen=Array.isArray(data.products)?[...new Set(data.products)].filter(p=>products.includes(p)||p==='아직 잘 모르겠어요'):[];
    const details={},input=data.details&&typeof data.details==='object'?data.details:{};
    if(chosen.includes('인터넷·TV')||chosen.includes('모텔·호텔 다량 TV'))details.carrier=clean(input.carrier);
    if(chosen.includes('테이블오더'))details.tables=clean(input.tables,20);
    if(chosen.includes('모텔·호텔 다량 TV'))details.rooms=clean(input.rooms,20);
    if(chosen.includes('CCTV'))details.cameras=clean(input.cameras);
    if(chosen.includes('포스')||chosen.includes('키오스크'))details.business=clean(input.business,40);
    return {place:clean(data.place),products:chosen,situation:clean(data.situation),details,
      region:clean(data.region),district:clean(data.district,40),timing:clean(data.timing),
      name:clean(data.name,30),phone:clean(data.phone,30).replace(/\D/g,''),contactTime:clean(data.contactTime)||contactTimes[0],
      consent:data.consent===true,privacyVersion:clean(data.privacyVersion)};
  }
  function errors(data,step){
    const d=normalize(data),e={};
    if(step===0&&!places.includes(d.place))e.place='이용하실 장소를 선택해 주세요.';
    if(step===1&&(!d.products.length||(d.products.includes('아직 잘 모르겠어요')&&d.products.length>1)))e.products='필요한 상품을 선택해 주세요.';
    if(step===2){
      if(!situations.includes(d.situation))e.situation='현재 상황을 선택해 주세요.';
      if('carrier' in d.details&&!carriers.includes(d.details.carrier))e.carrier='현재 통신사를 선택해 주세요. 모르면 ‘모름’을 선택하세요.';
      for(const key of ['tables','rooms'])if(d.details[key]&&(!/^\d{1,4}$/.test(d.details[key])||Number(d.details[key])<1))e[key]='1~9999 사이의 수량을 입력하거나 비워두세요.';
      if(d.details.cameras&&!['1~2대','3~4대','5대 이상','상담 후 결정'].includes(d.details.cameras))e.cameras='CCTV 수량을 다시 선택해 주세요.';
    }
    if(step===3){
      if(!regions.includes(d.region))e.region='시·도를 선택해 주세요.';
      if(d.district.length<2||/[<>\r\n]/.test(d.district))e.district='시·군·구를 입력해 주세요. 상세 주소는 필요하지 않아요.';
      if(!timings.includes(d.timing))e.timing='설치 희망 시기를 선택해 주세요.';
    }
    if(step===4){
      if(d.name.length<2||/[<>\r\n]/.test(d.name))e.name='이름을 2자 이상 입력해 주세요.';
      if(!/^01[016789]\d{7,8}$/.test(d.phone))e.phone='휴대폰 번호를 확인해 주세요.';
      if(!contactTimes.includes(d.contactTime))e.contactTime='연락 가능한 시간을 선택해 주세요.';
      if(!d.consent||d.privacyVersion!==privacyVersion)e.consent='상담 접수를 위해 개인정보 수집·이용에 동의해 주세요.';
    }
    return e;
  }
  return {products,places,situations,carriers,regions,timings,contactTimes,statuses,privacyVersion,normalize,errors};
});
