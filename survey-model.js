(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SurveyModel=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const products=['인터넷·TV','정수기','매장전화','테이블오더','키오스크','포스','CCTV','모텔·호텔 다량 TV'];
  const places=['우리 집','매장·사무실','모텔·호텔'];
  const applicationTypes=['신규 설치','기존 이용 고객'];
  const existingSituations=['기존 상품 변경','추가 설치','재약정·혜택 확인','이전 설치','상담 후 결정'];
  const situations=['신규 설치','기존 상품 변경','추가 설치','상담 후 결정'];
  const carriers=['SK','KT','LG','기타','이용 안 함','모름'];
  const regions=['서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주'];
  const timings=['가능한 빠르게','이번 달','다음 달 이후','미정'];
  const contactTimes=['시간 상관없음','오전 9~12시','오후 12~6시','오후 6시 이후'];
  const statuses=['신규','연락 완료','상담 완료'];
  const privacyVersion='2026-10-22-v1';
  // One field definition is shared by the questionnaire, API and admin inbox.
  const detailFields=[
    {key:'preferredCarrier',label:'희망하는 인터넷·TV 통신사',summaryLabel:'희망 통신사',products:['인터넷·TV','모텔·호텔 다량 TV'],applicationTypes:['신규 설치'],type:'choice',options:['SK','KT','LG','비교 후 결정']},
    {key:'carrier',label:'현재 이용 중인 인터넷·TV 통신사',summaryLabel:'현재 통신사',products:['인터넷·TV','모텔·호텔 다량 TV'],applicationTypes:['기존 이용 고객','legacy'],type:'choice',options:carriers,required:true},
    {key:'currentProvider',label:'현재 이용 중인 업체·상품',summaryLabel:'이용 업체·상품',products:['정수기','매장전화','테이블오더','키오스크','포스','CCTV','아직 잘 모르겠어요'],applicationTypes:['기존 이용 고객'],type:'text',maxLength:80,placeholder:'예: 코웨이 정수기, KT 매장전화'},
    {key:'contractState',label:'주 상담 상품의 약정 상태',summaryLabel:'약정 상태(주 상품)',applicationTypes:['기존 이용 고객'],type:'choice',options:['약정 만료','3개월 이내 만료','약정 남아 있음','약정 없음','모름']},
    {key:'currentMonthlyFee',label:'주 상담 상품의 월 이용료 (원)',summaryLabel:'월 이용료(주 상품)',applicationTypes:['기존 이용 고객'],type:'amount',unit:'원',placeholder:'예: 33000'},
    {key:'internetType',label:'필요한 인터넷·TV 구성',summaryLabel:'인터넷·TV 구성',products:['인터넷·TV'],type:'choice',options:['인터넷만','인터넷 + TV','TV 추가','상담 후 결정']},
    {key:'purifierType',label:'희망하는 정수기 유형',summaryLabel:'정수기 유형',products:['정수기'],type:'choice',options:['냉온정수기','얼음정수기','정수 전용','상담 후 결정']},
    {key:'numberPlan',label:'매장 전화번호는 어떻게 준비할까요?',summaryLabel:'매장 전화번호',products:['매장전화'],type:'choice',options:['새 번호 신청','기존 번호 유지 희망','상담 후 결정']},
    {key:'phoneLines',label:'필요한 매장전화 회선 수',summaryLabel:'매장전화 회선',products:['매장전화'],type:'number',unit:'회선',placeholder:'예: 1'},
    {key:'tables',label:'필요한 테이블오더 수량',summaryLabel:'테이블오더',products:['테이블오더'],type:'number',unit:'대',placeholder:'예: 13'},
    {key:'business',label:'매장 업종',summaryLabel:'업종',products:['포스','키오스크'],type:'text',placeholder:'예: 음식점, 카페, 소매점'},
    {key:'kiosks',label:'필요한 키오스크 수량',summaryLabel:'키오스크',products:['키오스크'],type:'number',unit:'대',placeholder:'예: 1'},
    {key:'posUnits',label:'필요한 포스 수량',summaryLabel:'포스',products:['포스'],type:'number',unit:'대',placeholder:'예: 1'},
    {key:'cameras',label:'필요한 CCTV 수량',summaryLabel:'CCTV 수량',products:['CCTV'],type:'choice',options:['1~2대','3~4대','5대 이상','상담 후 결정']},
    {key:'cameraLocation',label:'CCTV 설치 공간',summaryLabel:'CCTV 설치 공간',products:['CCTV'],type:'choice',options:['실내','실외','실내 + 실외','상담 후 결정']},
    {key:'guestRooms',label:'모텔·호텔 객실 수',summaryLabel:'객실',products:['모텔·호텔 다량 TV'],type:'number',unit:'실',placeholder:'예: 30'},
    // Keep the existing rooms key as TV quantity for older saved applications.
    {key:'rooms',label:'필요한 TV 수량',summaryLabel:'TV',products:['모텔·호텔 다량 TV'],type:'number',unit:'대',placeholder:'예: 30'}
  ];
  // Missing type means a form opened before the two application types were added.
  const fieldsFor=(chosen,applicationType)=>detailFields.filter(field=>(!field.products||field.products.some(product=>chosen.includes(product)))&&(!field.applicationTypes||field.applicationTypes.includes(applicationType===undefined?'legacy':applicationType))).map(field=>{
    if(applicationType==='신규 설치'&&field.key==='numberPlan')return {...field,options:['새 번호 신청','상담 후 결정']};
    if(applicationType==='신규 설치'&&field.key==='internetType')return {...field,options:['인터넷만','인터넷 + TV','TV만','상담 후 결정']};
    return field;
  });
  function detailEntries(data){
    const values=data.details||{};
    return fieldsFor(data.products||[],data.applicationType).filter(field=>values[field.key]).map(field=>({label:field.summaryLabel,value:String(values[field.key])+(field.unit||'')}));
  }
  const clean=(value,max=100)=>typeof value==='string'?value.trim().slice(0,max):'';
  function normalize(data={}){
    const chosen=Array.isArray(data.products)?[...new Set(data.products)].filter(p=>products.includes(p)||p==='아직 잘 모르겠어요'):[];
    const applicationType=data.applicationType===undefined?undefined:clean(data.applicationType);
    const details={},input=data.details&&typeof data.details==='object'?data.details:{};
    for(const field of fieldsFor(chosen,applicationType)){
      const value=clean(input[field.key],field.type==='number'?20:100);
      if(value||field.required)details[field.key]=value;
    }
    return {...(applicationType===undefined?{}:{applicationType}),place:clean(data.place),products:chosen,situation:applicationType==='신규 설치'?'신규 설치':clean(data.situation),details,
      region:clean(data.region),district:clean(data.district,40),timing:clean(data.timing),
      name:clean(data.name,30),phone:clean(data.phone,30).replace(/[\s()-]/g,''),contactTime:clean(data.contactTime)||contactTimes[0],
      consent:data.consent===true,privacyVersion:clean(data.privacyVersion)};
  }
  function errors(data,step){
    const d=normalize(data),e={};
    if(step===0){
      if(d.applicationType!==undefined&&!applicationTypes.includes(d.applicationType))e.applicationType='신규 설치 또는 기존 이용 고객을 선택해 주세요.';
      if(!places.includes(d.place))e.place='이용하실 장소를 선택해 주세요.';
    }
    if(step===1&&(!d.products.length||(d.products.includes('아직 잘 모르겠어요')&&d.products.length>1)))e.products='필요한 상품을 선택해 주세요.';
    if(step===2){
      if(!(d.applicationType==='기존 이용 고객'?existingSituations:situations).includes(d.situation))e.situation='상담 목적을 선택해 주세요.';
      for(const field of fieldsFor(d.products,d.applicationType)){
        const value=d.details[field.key];
        if(!value){if(field.required)e[field.key]='현재 통신사를 선택해 주세요. 모르면 ‘모름’을 선택하세요.';continue;}
        if(field.type==='choice'&&!field.options.includes(value))e[field.key]=`${field.label} 항목을 다시 선택해 주세요.`;
        if(field.type==='number'&&(!/^\d{1,4}$/.test(value)||Number(value)<1))e[field.key]='1~9999 사이의 수량을 입력하거나 비워두세요.';
        if(field.type==='amount'&&!/^\d{1,9}$/.test(value))e[field.key]='월 이용료를 숫자로 입력하거나 비워두세요.';
        if(field.type==='text'&&(value.length>(field.maxLength||40)||/[<>\r\n]/.test(value)))e[field.key]=`${field.summaryLabel} 항목을 ${field.maxLength||40}자 이내로 입력해 주세요.`;
      }
    }
    if(step===3){
      if(!regions.includes(d.region))e.region='시·도를 선택해 주세요.';
      if(d.district.length<2||/[<>\r\n]/.test(d.district))e.district='시·군·구를 입력해 주세요. 상세 주소는 필요하지 않아요.';
      if(!timings.includes(d.timing))e.timing='희망 시기를 선택해 주세요.';
    }
    if(step===4){
      if(d.name.length<2||/[<>\r\n]/.test(d.name))e.name='이름을 2자 이상 입력해 주세요.';
      if(!/^(?:010\d{8}|01[16789]\d{7,8})$/.test(d.phone))e.phone='휴대폰 번호를 확인해 주세요.';
      if(!contactTimes.includes(d.contactTime))e.contactTime='연락 가능한 시간을 선택해 주세요.';
      if(!d.consent||d.privacyVersion!==privacyVersion)e.consent='상담 접수를 위해 개인정보 수집·이용에 동의해 주세요.';
    }
    return e;
  }
  return {products,places,applicationTypes,existingSituations,situations,carriers,regions,timings,contactTimes,statuses,privacyVersion,detailFields,fieldsFor,detailEntries,normalize,errors};
});
