const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
process.env.LOCAL_DATA_DIR=path.join(process.cwd(),'.local-data',`test-${crypto.randomUUID()}`);
process.env.ADMIN_PASSWORD_HASH=crypto.createHash('sha256').update('test-password-only').digest('hex');
process.env.ADMIN_SESSION_SECRET=crypto.randomBytes(32).toString('hex');
process.env.CRON_SECRET=crypto.randomBytes(32).toString('hex');
const server=require('../server.cjs'),store=require('../lib/storage.cjs'),M=require('../survey-model.js');
let base,cookie;
const fixture=()=>({requestId:crypto.randomUUID(),place:'매장·사무실',products:['인터넷·TV','테이블오더'],situation:'신규 설치',details:{carrier:'이용 안 함',tables:'13'},region:'서울',district:'테스트구',timing:'미정',name:'접수테스트',phone:'01000000000',contactTime:'시간 상관없음',consent:true,privacyVersion:M.privacyVersion});
async function post(url,data,options={}){const response=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json',Origin:options.origin||base,...(options.cookie?{Cookie:options.cookie}:{})},body:JSON.stringify(data)});return {status:response.status,data:await response.json(),headers:response.headers};}
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('rejects missing consent, invalid phone, honeypot and other origins',async()=>{
  for(const patch of [{consent:false},{phone:'1234'},{website:'spam'},{details:{carrier:'KT',tables:'10000'}}])assert.equal((await post('/api/consultations',{...fixture(),...patch})).status,400);
  assert.equal((await post('/api/consultations',fixture(),{origin:'https://unrelated.example'})).status,403);
  assert.equal((await store.list('leads/')).length,0);
});
test('saves one record for concurrent retries and preserves all fields',async()=>{
  const input=fixture();const results=await Promise.all([post('/api/consultations',input),post('/api/consultations',input)]);
  results.forEach(r=>assert.ok([200,201].includes(r.status)));
  assert.equal(results[0].data.receipt,results[1].data.receipt);
  const items=await store.list('leads/');assert.equal(items.length,1);
  const saved=await store.read(items[0].pathname);assert.equal(saved.details.tables,'13');assert.equal(saved.status,'신규');assert.equal(saved.phone,input.phone);
  assert.equal((await post('/api/consultations',{...input,name:'다른이름'})).status,409);
  assert.equal((await post('/api/consultations',fixture())).status,429);
});
test('requires admin authentication and allows only known statuses',async()=>{
  assert.equal((await fetch(base+'/api/admin')).status,401);
  assert.equal((await post('/api/admin',{action:'login',password:'wrong'})).status,401);
  const auth=await post('/api/admin',{action:'login',password:'test-password-only'});assert.equal(auth.status,200);cookie=auth.headers.get('set-cookie').split(';')[0];
  const response=await fetch(base+'/api/admin',{headers:{Cookie:cookie}}),data=await response.json();assert.equal(data.items.length,1);assert.equal(data.items[0].digest,undefined);
  const id=data.items[0].id;
  assert.equal((await post('/api/admin',{action:'status',id,status:'상담 완료'},{cookie})).status,200);
  assert.equal((await store.read(`leads/${id}.json`)).status,'상담 완료');
  assert.equal((await post('/api/admin',{action:'status',id,status:'임의상태'},{cookie})).status,400);
  assert.equal((await post('/api/admin',{action:'status',id,status:'신규'},{cookie,origin:'https://unrelated.example'})).status,403);
});
test('cleanup deletes expired entries and refuses unauthenticated calls',async()=>{
  await store.write('leads/expired.json',{expiresAt:1});
  assert.equal((await fetch(base+'/api/cleanup')).status,401);
  assert.equal((await fetch(base+'/api/cleanup',{headers:{Authorization:`Bearer ${process.env.CRON_SECRET}`}})).status,200);
  assert.equal(await store.read('leads/expired.json'),null);assert.equal((await store.list('leads/')).length,1);
});
test('drops irrelevant product details and validates conditional questions',()=>{
  const input={...fixture(),products:['정수기']};assert.deepEqual(M.normalize(input).details,{});assert.deepEqual(M.errors(input,2),{});
  assert.ok(M.errors({...fixture(),details:{}},2).carrier);
  assert.ok(M.errors({...fixture(),products:['정수기','아직 잘 모르겠어요']},1).products);
});
