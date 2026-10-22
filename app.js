const config=window.SITE_CONFIG||{};
const M=window.SurveyModel;
const views=['0 185 650 500','650 230 245 360','1190 660 335 230','830 440 300 265','1260 60 260 630','1010 300 280 300','1055 670 150 165','0 185 650 500'];
const selected=new Set();
const grid=document.querySelector('#product-grid'),dialog=document.querySelector('#consult');
const content=document.querySelector('#survey-content'),form=document.querySelector('#survey-form');
const next=document.querySelector('#survey-next'),back=document.querySelector('#survey-back'),error=document.querySelector('#survey-error');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let step=0,busy=false,complete=false,receipt='',returnFocus=null;
let answers=freshAnswers();
function freshAnswers(){return {applicationType:'',place:'',products:[],situation:'',details:{},region:'',district:'',timing:'',name:'',phone:'',contactTime:M.contactTimes[0],consent:false,privacyVersion:M.privacyVersion,website:'',requestId:crypto.randomUUID()};}
function syncSelection(){
  document.querySelectorAll('.product').forEach((button,i)=>{const active=selected.has(M.products[i]);button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));button.querySelector('.arrow').textContent=active?'✓':'›';});
  document.querySelector('#selection-count').textContent=selected.size||'';
  document.querySelector('#selection-status').textContent=selected.size?`${selected.size}개 상품 선택 · 설문에 그대로 반영돼요.`:'여러 상품을 함께 선택할 수 있어요.';
}
M.products.forEach((name,i)=>{
  const button=document.createElement('button');button.type='button';button.className='product';button.setAttribute('aria-label',`${name} 선택`);button.setAttribute('aria-pressed','false');
  button.innerHTML=`<span class="product-image" aria-hidden="true"><svg viewBox="${views[i]}"><image href="assets/hero.png" width="1536" height="1024"/></svg></span><strong>${name==='모텔·호텔 다량 TV'?'모텔·호텔<br>다량 TV':name}</strong><span class="arrow" aria-hidden="true">›</span>`;
  button.addEventListener('click',()=>{selected.has(name)?selected.delete(name):selected.add(name);syncSelection();});grid.append(button);
});
const menu=document.querySelector('.menu-button'),navigation=document.querySelector('#navigation');
function closeMenu(){navigation.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','메뉴 열기');}
menu.addEventListener('click',()=>{navigation.hidden=!navigation.hidden;menu.setAttribute('aria-expanded',String(!navigation.hidden));menu.setAttribute('aria-label',navigation.hidden?'메뉴 열기':'메뉴 닫기');});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
document.querySelectorAll('[data-phone]').forEach(link=>{link.href='tel:'+(config.phone||'01068667176').replace(/[^+\d]/g,'');});
function choices(name,values,{multiple=false,compact=false,descriptions=[]}={}){
  const current=name.startsWith('details.')?answers.details[name.slice(8)]:answers[name];
  return `<div class="choices ${compact?'compact':''}">${values.map((value,i)=>{
    const checked=multiple?current.includes(value):current===value;
    return `<label class="choice ${checked?'is-selected':''}"><input type="${multiple?'checkbox':'radio'}" name="${name}" value="${escapeHTML(value)}" ${checked?'checked':''}><span class="choice-copy"><span>${escapeHTML(value)}</span>${descriptions[i]?`<small>${descriptions[i]}</small>`:''}</span><span class="choice-mark" aria-hidden="true">${multiple?'✓':''}</span></label>`;
  }).join('')}</div>`;
}
function selectField(name,label,values,placeholder='선택해 주세요'){
  return `<label class="field"><span>${label}</span><select name="${name}"><option value="">${placeholder}</option>${values.map(v=>`<option ${answers[name]===v?'selected':''}>${escapeHTML(v)}</option>`).join('')}</select></label>`;
}
function inputField(name,label,placeholder,{optional=false,numeric=false,maxLength=numeric?4:40}={}){
  const value=name.startsWith('details.')?answers.details[name.slice(8)]:answers[name];
  return `<label class="field"><span>${label}${optional?' <em>선택</em>':''}</span><input name="${name}" value="${escapeHTML(value)}" placeholder="${placeholder}" ${numeric?'inputmode="numeric"':''} maxlength="${maxLength}"></label>`;
}
function heading(title,description){return `<h2 id="consult-heading" tabindex="-1">${title}</h2><p class="survey-description">${description}</p>`;}
function summary(){
  const d=M.normalize(answers),details=M.detailEntries(d).map(entry=>`${entry.label} ${entry.value}`);
  const row=(label,value,index)=>`<div><dt>${label}</dt><dd>${escapeHTML(value)}</dd><button type="button" data-edit="${index}" aria-label="${label} 수정">수정</button></div>`;
  return `<div class="answer-summary"><p>선택하신 상담 내용</p><dl>${row('신청 유형',d.applicationType,0)}${row('이용 장소',d.place,0)}${row('필요 상품',d.products.join(' · '),1)}${row('상담 내용',[d.situation,...details].join(' · '),2)}${row('지역 · 시기',`${d.region} ${d.district} · ${d.timing}`,3)}</dl></div>`;
}
function render(){
  error.textContent='';back.hidden=step===0||complete;next.disabled=busy;back.disabled=busy;
  document.querySelector('#survey-progress').innerHTML=complete?'':`<div class="progress-label"><span>${['신청 유형과 장소','필요 상품','상품별 상담 내용','지역과 시기','연락처 및 접수'][step]}</span><span><b>${step+1}</b> / 5</span></div><div class="progress-track" role="progressbar" aria-label="설문 진행" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${step+1}"><span style="width:${(step+1)*20}%"></span></div>`;
  next.innerHTML=complete?'닫기':step===4?'맞춤 상담 접수하기':'다음 <span aria-hidden="true">→</span>';
  if(complete){content.innerHTML=`<div class="success-view"><span class="success-check" aria-hidden="true">✓</span>${heading('상담이 접수됐어요.','선택하신 상품과 설치 조건을 확인한 뒤,<br>남겨주신 번호로 연락드리겠습니다.')}<div class="receipt">접수번호 <strong>${escapeHTML(receipt)}</strong></div><p class="success-note">사은품과 적용 혜택은<br>상담 시 가입 조건에 맞춰 안내해 드려요.</p></div>`;}
  else if(step===0){content.innerHTML=heading('어떤 신청을 원하시나요?','신규·기존 고객에 맞춰 필요한 내용만 여쭤볼게요.')+choices('applicationType',M.applicationTypes,{descriptions:['새로 가입하거나 처음 설치하고 싶어요','사용 중인 상품을 변경·추가하거나 혜택을 확인하고 싶어요']})+`<fieldset id="place-question" ${answers.applicationType?'':'hidden'}><legend>어디에서 이용하시나요?</legend>${choices('place',M.places,{compact:true})}</fieldset><p class="survey-tip">신청 유형을 선택한 뒤 필요한 상품을 알려주세요.<br>여러 상품도 한 번에 상담받을 수 있어요.</p>`;}
  else if(step===1){content.innerHTML=heading('어떤 상품이 필요하세요?','여러 개를 함께 선택하셔도 괜찮아요.')+choices('products',[...M.products,'아직 잘 모르겠어요'],{multiple:true,compact:true});}
  else if(step===2){
    const existing=answers.applicationType==='기존 이용 고객';
    const fields=M.fieldsFor(answers.products,answers.applicationType),detail=fields.map(field=>field.type==='choice'
      ?`<fieldset><legend>${field.label}${field.required?'':' <em>선택</em>'}</legend>${choices('details.'+field.key,field.options,{compact:true})}</fieldset>`
      :inputField('details.'+field.key,field.label,field.placeholder,{optional:!field.required,numeric:['number','amount'].includes(field.type),maxLength:field.type==='amount'?9:field.type==='number'?4:field.maxLength||40})).join('');
    content.innerHTML=`<p class="application-label">${escapeHTML(answers.applicationType)}</p>`+heading(existing?'어떤 상담이 필요하세요?':'새로 설치할 상품을 알려주세요.',existing?'사용 중인 상품의 변경·추가 또는 혜택을 확인해 드려요.':'원하는 구성과 수량에 맞춰 설치 조건을 안내해 드려요.')+(existing?`<fieldset class="consult-purpose"><legend>상담 목적</legend>${choices('situation',M.existingSituations,{compact:true})}</fieldset>`:'')+`<div class="detail-fields">${detail}</div>`+(fields.length?`<p class="survey-tip">‘선택’ 항목은 비워두셔도 접수할 수 있어요.<br>${existing?'약정과 이용료는 주로 상담할 상품 기준으로 알려주세요.':'정해지지 않은 내용은 상담하면서 결정하세요.'}</p>`:'<p class="survey-tip">상품이 정해지지 않아도 괜찮아요.<br>다음 단계에서 설치 지역과 희망 시기를 알려주세요.</p>');
  }else if(step===3){
    const existing=answers.applicationType==='기존 이용 고객';
    content.innerHTML=heading(existing?'이용 지역과 시기를 알려주세요.':'어디에, 언제 필요하세요?',existing?'지역과 상담·변경 희망 시기를 확인할게요.':'설치 가능 여부와 일정을 확인하는 데 사용해요.')+`<div class="region-fields">${selectField('region','시·도',M.regions,'시·도 선택')}${inputField('district','시·군·구','예: 강남구, 수원시')}</div><p class="field-help">상세 주소는 입력하지 않으셔도 돼요.</p><fieldset><legend>${existing?'상담·변경 희망 시기':'설치 희망 시기'}</legend>${choices('timing',M.timings,{compact:true})}</fieldset>`;
  }else{
    content.innerHTML=heading('어디로 연락드릴까요?','마지막 단계예요. 선택 내용을 확인하고 접수해 주세요.')+summary()+`<label class="field"><span>이름</span><input name="name" value="${escapeHTML(answers.name)}" autocomplete="name" maxlength="30" placeholder="이름을 입력해 주세요"></label><label class="field"><span>휴대폰 번호</span><input name="phone" type="tel" value="${escapeHTML(answers.phone)}" autocomplete="tel" inputmode="tel" maxlength="15" placeholder="010-0000-0000"></label>`+selectField('contactTime','연락 가능한 시간',M.contactTimes)+`<p class="field-help">희망 시간은 상담 일정에 따라 조율될 수 있어요.</p><div class="form-trap" aria-hidden="true"><label>웹사이트<input name="website" tabindex="-1" autocomplete="off" value=""></label></div><div class="consent-box"><label><input type="checkbox" name="consent" ${answers.consent?'checked':''}><span><b>[필수]</b> 개인정보 수집·이용에 동의합니다.</span></label><details><summary>수집·이용 내용 보기</summary><p>수집·이용 주체: ${escapeHTML(config.privacyOperator)} (${escapeHTML(config.phone)})<br>목적: 요청하신 상품의 상담 연락, 견적 및 설치 조건·혜택 안내<br>항목: 이름, 휴대폰 번호, 연락 희망 시간, 이용 장소, 선택 상품, 설치 지역·시기 및 입력한 상품 정보<br>보유 기간: 접수일로부터 ${config.retentionDays}일 후 삭제<br>동의를 거부하실 수 있으며, 거부 시 온라인 상담 접수가 어렵습니다.</p></details></div><p class="survey-disclaimer">설문 접수만으로 가입이나 사은품 지급이 확정되지 않아요.<br>선택하신 조건에 맞는 혜택을 상담 시 안내해 드립니다.</p>`;
  }
  content.scrollTop=0;requestAnimationFrame(()=>content.querySelector('h2')?.focus({preventScroll:true}));
}
function openSurvey(event){event.preventDefault();closeMenu();returnFocus=event.currentTarget;if(complete){complete=false;answers=freshAnswers();step=0;}answers.products=[...selected];if(!answers.products.length&&answers.unknown)answers.products=['아직 잘 모르겠어요'];answers.details=M.normalize(answers).details;dialog.showModal();document.body.classList.add('survey-open');render();}
document.querySelectorAll('[data-consult]').forEach(link=>link.addEventListener('click',openSurvey));
document.querySelector('.close-dialog').addEventListener('click',()=>{if(!busy)dialog.close();});
dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
dialog.addEventListener('close',()=>{document.body.classList.remove('survey-open');returnFocus?.focus({preventScroll:true});});
function capture(event){
  const el=event.target;if(!el.name)return;
  if(el.name==='products'){
    const values=new Set(answers.products);
    if(el.checked){if(el.value==='아직 잘 모르겠어요')values.clear();else values.delete('아직 잘 모르겠어요');values.add(el.value);}else values.delete(el.value);
    answers.products=[...values];answers.unknown=values.has('아직 잘 모르겠어요');selected.clear();answers.products.filter(p=>M.products.includes(p)).forEach(p=>selected.add(p));syncSelection();
    answers.details=M.normalize(answers).details;
    content.querySelectorAll('[name="products"]').forEach(input=>input.checked=values.has(input.value));
  }else if(el.name==='applicationType'){
    if(answers.applicationType!==el.value){
      answers.applicationType=el.value;answers.situation=el.value==='신규 설치'?'신규 설치':'';answers.details=M.normalize(answers).details;
      for(const field of M.fieldsFor(answers.products,answers.applicationType))if(field.type==='choice'&&answers.details[field.key]&&!field.options.includes(answers.details[field.key]))delete answers.details[field.key];
    }
    content.querySelector('#place-question').hidden=false;
  }else if(el.name.startsWith('details.'))answers.details[el.name.slice(8)]=el.value;
  else answers[el.name]=el.type==='checkbox'?el.checked:el.value;
  content.querySelectorAll('.choice').forEach(label=>label.classList.toggle('is-selected',label.querySelector('input').checked));
  el.removeAttribute('aria-invalid');error.textContent='';
}
form.addEventListener('input',capture);form.addEventListener('change',capture);
content.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]');if(edit&&!busy){step=Number(edit.dataset.edit);render();}});
back.addEventListener('click',()=>{if(!busy&&step>0){step--;render();}});
function showError(message){error.textContent=message;}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;if(complete){dialog.close();return;}
  const errors=M.errors(answers,step);
  if(Object.keys(errors).length){
    showError(Object.values(errors)[0]);
    const key=Object.keys(errors)[0],field=content.querySelector(`[name="${key}"]`)||content.querySelector(`[name="details.${key}"]`);
    field?.setAttribute('aria-invalid','true');field?.focus();return;
  }
  if(step<4){step++;render();return;}
  for(let i=0;i<4;i++)if(Object.keys(M.errors(answers,i)).length){step=i;render();showError('선택 내용을 다시 확인해 주세요.');return;}
  busy=true;content.inert=true;next.disabled=true;back.disabled=true;document.querySelector('.close-dialog').disabled=true;next.textContent='접수하고 있어요…';form.setAttribute('aria-busy','true');
  try{
    const response=await fetch(config.endpoint||'/api/consultations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...M.normalize(answers),requestId:answers.requestId,website:answers.website}),signal:AbortSignal.timeout(25000)});
    const result=await response.json();
    if(!response.ok||!result.ok)throw new Error(result.message||'접수하지 못했어요. 잠시 후 다시 시도해 주세요.');
    receipt=result.receipt;complete=true;selected.clear();syncSelection();answers=freshAnswers();
  }catch(err){showError(err.name==='TimeoutError'?'응답이 늦어지고 있어요. 다시 누르면 중복 없이 접수 여부를 확인합니다.':err instanceof TypeError?'인터넷 연결을 확인한 뒤 다시 접수해 주세요.':err.message);}
  finally{busy=false;content.inert=false;next.disabled=false;back.disabled=false;document.querySelector('.close-dialog').disabled=false;form.removeAttribute('aria-busy');if(complete)render();else next.textContent='맞춤 상담 접수하기';}
});
syncSelection();
// Instagram links may open the questionnaire directly.
if(location.hash==='#consult')openSurvey({preventDefault(){},currentTarget:document.querySelector('.consult-button')});
