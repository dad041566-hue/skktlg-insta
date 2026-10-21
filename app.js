const config = window.SITE_CONFIG || {};
const products = [
  {name:'인터넷·TV',view:'0 185 650 500'},
  {name:'정수기',view:'650 230 245 360'},
  {name:'매장전화',view:'1190 660 335 230'},
  {name:'테이블오더',view:'830 440 300 265'},
  {name:'키오스크',view:'1260 60 260 630'},
  {name:'포스',view:'1010 300 280 300'},
  {name:'CCTV',view:'1055 670 150 165'},
  {name:'모텔·호텔 다량 TV',view:'0 185 650 500'},
];
const selected = new Set();
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#consult');
const status = document.querySelector('#selection-status');
function syncSelection(){
  document.querySelectorAll('.product').forEach((button,index)=>{
    const active=selected.has(products[index].name);
    button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
    button.querySelector('.arrow').textContent=active?'✓':'›';
  });
  document.querySelector('#selection-count').textContent=selected.size||'';
  status.textContent=selected.size?`${selected.size}개 상품 선택 · 함께 상담받으세요.`:'필요한 상품을 선택하고 상담받으세요.';
  document.querySelector('#consult-selection').textContent=selected.size?`${[...selected].join(' · ')} 상담을 원한다고 말씀해 주세요.`:'필요한 상품과 사은품 혜택을 안내해 드립니다.';
}
products.forEach(product=>{
  const button=document.createElement('button');button.type='button';button.className='product';button.setAttribute('aria-label',`${product.name} 선택`);button.setAttribute('aria-pressed','false');
  button.innerHTML=`<span class="product-image" aria-hidden="true"><svg viewBox="${product.view}"><image href="assets/hero.png" width="1536" height="1024"/></svg></span><strong>${product.name==='모텔·호텔 다량 TV'?'모텔·호텔<br>다량 TV':product.name}</strong><span class="arrow" aria-hidden="true">›</span>`;
  button.addEventListener('click',()=>{selected.has(product.name)?selected.delete(product.name):selected.add(product.name);syncSelection();});grid.append(button);
});
const menu=document.querySelector('.menu-button');
const navigation=document.querySelector('#navigation');
function closeMenu(){navigation.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','메뉴 열기');}
menu.addEventListener('click',()=>{navigation.hidden=!navigation.hidden;menu.setAttribute('aria-expanded',String(!navigation.hidden));menu.setAttribute('aria-label',navigation.hidden?'메뉴 열기':'메뉴 닫기');});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
document.querySelectorAll('[data-consult]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();closeMenu();dialog.showModal();}));
document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
const phone=config.phone||'010-6866-7176';
document.querySelectorAll('[data-phone]').forEach(link=>{link.href='tel:'+phone.replace(/[^+\d]/g,'');link.setAttribute('aria-label','전화 상담 '+phone);});
try{const url=new URL(config.kakaoUrl);if(url.protocol==='https:'&&url.hostname==='open.kakao.com'&&url.pathname.startsWith('/o/')){const link=document.querySelector('#kakao-link');link.href=url.href;link.hidden=false;}}catch{}
syncSelection();
