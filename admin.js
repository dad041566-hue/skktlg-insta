const login=document.querySelector('#login-form'),inbox=document.querySelector('#inbox'),message=document.querySelector('#admin-message'),leads=document.querySelector('#leads');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let page=0;
async function request(data){const response=await fetch('/api/admin'+(data?'':`?page=${page}`),data?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}:{cache:'no-store'});const result=await response.json();if(!response.ok){if(response.status===401)showLogin();throw new Error(result.message||'요청을 처리하지 못했습니다.');}return result;}
function showLogin(){login.hidden=false;inbox.hidden=true;leads.replaceChildren();document.querySelector('#logout').hidden=true;}
function row(label,value){return `<dt>${label}</dt><dd>${esc(value||'미입력')}</dd>`;}
async function load(){
  message.textContent='';
  try{
    const result=await request();login.hidden=true;inbox.hidden=false;document.querySelector('#logout').hidden=false;
    document.querySelector('#total').textContent=`전체 ${result.total}건`;document.querySelector('#page-label').textContent=`${page+1}페이지`;
    document.querySelector('#prev').disabled=page===0;document.querySelector('#more').disabled=!result.hasMore;
    leads.innerHTML=result.items.length?result.items.map(item=>{
      const phone=item.phone.replace(/^(\d{3})(\d{3,4})(\d{4})$/,'$1-$2-$3');
      const details=window.SurveyModel.detailEntries(item).map(entry=>`${entry.label}: ${entry.value}`).join(' / ');
      return `<article class="lead" data-id="${esc(item.id)}"><div class="lead-top"><div><h2>${esc(item.name)}</h2><a class="lead-phone" href="tel:${esc(item.phone)}">${esc(phone)}</a></div><span class="status">${esc(item.status)}</span></div><dl>${row('신청 유형',item.applicationType||'이전 양식')}${row('이용 장소',item.place)}${row('필요 상품',item.products.join(' · '))}${row('상담 목적',item.situation)}${row('추가 정보',details)}${row('지역',item.region+' '+item.district)}${row('희망 시기',item.timing)}${row('연락 시간',item.contactTime)}</dl><div class="lead-controls"><select aria-label="${esc(item.name)} 상담 상태">${['신규','연락 완료','상담 완료'].map(s=>`<option ${s===item.status?'selected':''}>${s}</option>`).join('')}</select><button data-action="status">상태 저장</button><button class="delete" data-action="delete">접수 삭제</button></div><p class="lead-meta">${esc(item.receipt)} · ${esc(new Date(item.createdAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}))} 접수</p></article>`;
    }).join(''):'<p class="empty">아직 접수된 상담이 없습니다.</p>';
  }catch(e){if(e.message!=='로그인이 필요합니다.')message.textContent=e.message;}
}
login.addEventListener('submit',async event=>{event.preventDefault();const button=login.querySelector('button');button.disabled=true;message.textContent='';try{await request({action:'login',password:document.querySelector('#password').value});document.querySelector('#password').value='';page=0;await load();}catch(e){message.textContent=e.message;}finally{button.disabled=false;}});
document.querySelector('#logout').addEventListener('click',async()=>{try{await request({action:'logout'});showLogin();}catch(e){message.textContent=e.message;}});
document.querySelector('#refresh').addEventListener('click',load);
document.querySelector('#prev').addEventListener('click',()=>{page--;load();});document.querySelector('#more').addEventListener('click',()=>{page++;load();});
leads.addEventListener('click',async event=>{const button=event.target.closest('[data-action]');if(!button)return;const card=button.closest('.lead');if(button.dataset.action==='delete'&&!confirm('이 접수 정보를 삭제할까요? 삭제 후에는 복구할 수 없습니다.'))return;button.disabled=true;try{await request({action:button.dataset.action,id:card.dataset.id,status:card.querySelector('select').value});await load();}catch(e){message.textContent=e.message;button.disabled=false;}});
load();
