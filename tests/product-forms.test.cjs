const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
process.env.LOCAL_DATA_DIR=path.join(process.cwd(),'.local-data',`products-${crypto.randomUUID()}`);
process.env.ADMIN_PASSWORD_HASH=crypto.createHash('sha256').update('product-test-only').digest('hex');
process.env.ADMIN_SESSION_SECRET=crypto.randomBytes(32).toString('hex');
const M=require('../survey-model.js'),store=require('../lib/storage.cjs'),server=require('../server.cjs');
let base,cookie;
const cases=[
  {product:'인터넷·TV',details:{carrier:'SK',internetType:'인터넷 + TV'},expected:['현재 통신사: SK','인터넷·TV 구성: 인터넷 + TV']},
  {product:'정수기',details:{purifierType:'얼음정수기'},expected:['정수기 유형: 얼음정수기']},
  {product:'매장전화',details:{numberPlan:'기존 번호 유지 희망',phoneLines:'2'},expected:['매장 전화번호: 기존 번호 유지 희망','매장전화 회선: 2회선']},
  {product:'테이블오더',details:{tables:'13'},expected:['테이블오더: 13대']},
  {product:'키오스크',details:{business:'음식점',kiosks:'2'},expected:['업종: 음식점','키오스크: 2대']},
  {product:'포스',details:{business:'카페',posUnits:'3'},expected:['업종: 카페','포스: 3대']},
  {product:'CCTV',details:{cameras:'3~4대',cameraLocation:'실내 + 실외'},expected:['CCTV 수량: 3~4대','CCTV 설치 공간: 실내 + 실외']},
  {product:'모텔·호텔 다량 TV',details:{carrier:'KT',guestRooms:'25',rooms:'30'},expected:['현재 통신사: KT','객실: 25실','TV: 30대']}
];
function fixture(index,products,details){return {requestId:crypto.randomUUID(),place:products.includes('모텔·호텔 다량 TV')?'모텔·호텔':'매장·사무실',products,situation:'신규 설치',details,region:'경기',district:'테스트시',timing:'미정',name:'상품별검증',phone:`01000000${String(index).padStart(3,'0')}`,contactTime:'오후 12~6시',consent:true,privacyVersion:M.privacyVersion};}
async function post(endpoint,data){const response=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});return {response,data:await response.json()};}
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;const login=await post('/api/admin',{action:'login',password:'product-test-only'});assert.equal(login.response.status,200);cookie=login.response.headers.get('set-cookie').split(';')[0];});
after(()=>new Promise(resolve=>server.close(resolve)));
for(const [index,entry] of cases.entries())test(`${entry.product}: stores all product answers and returns them to the inbox`,async()=>{
  const input=fixture(index,[entry.product],entry.details),result=await post('/api/consultations',input);assert.equal(result.response.status,201,JSON.stringify(result.data));
  const saved=await store.read(`leads/${input.requestId}.json`);assert.deepEqual(saved.details,entry.details);
  const list=await (await fetch(base+'/api/admin',{headers:{Cookie:cookie}})).json(),record=list.items.find(item=>item.id===input.requestId);
  assert.deepEqual(record.details,entry.details);assert.equal(record.contactTime,'오후 12~6시');
  assert.deepEqual(M.detailEntries(record).map(item=>`${item.label}: ${item.value}`),entry.expected);
});
test('all eight selected together retain answers without duplicate shared questions',async()=>{
  const details=Object.assign({},...cases.map(entry=>entry.details)),input=fixture(8,M.products,details);
  const result=await post('/api/consultations',input);assert.equal(result.response.status,201,JSON.stringify(result.data));
  const saved=await store.read(`leads/${input.requestId}.json`);assert.deepEqual(saved.details,details);
  const keys=M.fieldsFor(M.products).map(field=>field.key);assert.equal(keys.filter(k=>k==='carrier').length,1);assert.equal(keys.filter(k=>k==='business').length,1);
});
test('undecided product needs no unrelated product answers',async()=>{
  const input=fixture(9,['아직 잘 모르겠어요'],{rooms:'30',purifierType:'얼음정수기'});
  const result=await post('/api/consultations',input);assert.equal(result.response.status,201);assert.deepEqual((await store.read(`leads/${input.requestId}.json`)).details,{});
});
test('optional answers may be skipped and removed products cannot leak stale answers',()=>{
  for(const entry of cases){const minimal={products:[entry.product],situation:'상담 후 결정',details:{carrier:'모름'}};assert.deepEqual(M.errors(minimal,2),{});}
  const changed={products:['정수기'],situation:'신규 설치',details:{carrier:'SK',tables:'13',rooms:'30',purifierType:'냉온정수기'}};
  assert.deepEqual(M.normalize(changed).details,{purifierType:'냉온정수기'});
  assert.deepEqual(M.detailEntries({products:['모텔·호텔 다량 TV'],details:{rooms:'30'}}),[{label:'TV',value:'30대'}]);
});
test('rejects invalid quantities, choices and incomplete 010 numbers',()=>{
  for(const key of ['phoneLines','tables','kiosks','posUnits','guestRooms','rooms'])for(const value of ['0','-1','1.5','10000','abc'])assert.ok(M.errors({products:M.products,situation:'신규 설치',details:{carrier:'KT',[key]:value}},2)[key]);
  for(const key of ['purifierType','numberPlan','internetType','cameraLocation'])assert.ok(M.errors({products:M.products,situation:'신규 설치',details:{carrier:'KT',[key]:'invalid'}},2)[key]);
  const input=fixture(20,['정수기'],{});assert.ok(M.errors({...input,phone:'0101234567'},4).phone);assert.ok(M.errors({...input,phone:'abc01012345678'},4).phone);assert.deepEqual(M.errors({...input,phone:'010-1234-5678'},4),{});
});
test('retries of older forms remain idempotent after optional fields are added',async()=>{
  const input=fixture(30,['인터넷·TV','테이블오더'],{carrier:'KT'}),key=`leads/${input.requestId}.json`;
  const older={...M.normalize(input),details:{carrier:'KT',tables:''},id:input.requestId,receipt:'LEGACY-TEST',digest:'previous-schema-digest',status:'신규',createdAt:new Date().toISOString(),expiresAt:Date.now()+86400000};
  await store.write(key,older);
  try{const result=await post('/api/consultations',input);assert.equal(result.response.status,200);assert.equal(result.data.receipt,'LEGACY-TEST');}finally{await store.remove(key);}
});
