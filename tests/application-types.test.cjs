const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const path=require('node:path');
process.env.LOCAL_DATA_DIR=path.join(process.cwd(),'.local-data',`types-${crypto.randomUUID()}`);
process.env.ADMIN_PASSWORD_HASH=crypto.createHash('sha256').update('types-test-only').digest('hex');
process.env.ADMIN_SESSION_SECRET=crypto.randomBytes(32).toString('hex');
const M=require('../survey-model.js'),store=require('../lib/storage.cjs'),server=require('../server.cjs');
let base,cookie;
const fixture=(applicationType)=>({requestId:crypto.randomUUID(),applicationType,place:'매장·사무실',products:M.products,situation:applicationType==='신규 설치'?'신규 설치':'기존 상품 변경',details:applicationType==='신규 설치'?{preferredCarrier:'비교 후 결정',tables:'13',numberPlan:'새 번호 신청'}:{carrier:'KT',currentProvider:'코웨이 정수기',contractState:'3개월 이내 만료',currentMonthlyFee:'33000',numberPlan:'기존 번호 유지 희망',tables:'13'},region:'서울',district:'테스트구',timing:'미정',name:'유형검증',phone:applicationType==='신규 설치'?'01000000201':'01000000202',contactTime:'시간 상관없음',consent:true,privacyVersion:M.privacyVersion});
async function post(endpoint,data){const response=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});return {response,data:await response.json()};}
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;const login=await post('/api/admin',{action:'login',password:'types-test-only'});cookie=login.response.headers.get('set-cookie').split(';')[0];});
after(()=>new Promise(resolve=>server.close(resolve)));
for(const applicationType of M.applicationTypes){
  test(`${applicationType}: all eight products show and validate the correct questions`,()=>{
    for(const product of M.products){
      const input={...fixture(applicationType),products:[product]},keys=M.fieldsFor(input.products,applicationType).map(f=>f.key);
      assert.deepEqual(Object.assign({},...Array.from({length:5},(_,step)=>M.errors(input,step))),{},product);
      assert.equal(keys.includes('contractState'),applicationType==='기존 이용 고객');
      if(['인터넷·TV','모텔·호텔 다량 TV'].includes(product)){
        assert.equal(keys.includes('carrier'),applicationType==='기존 이용 고객');
        assert.equal(keys.includes('preferredCarrier'),applicationType==='신규 설치');
      }
      assert.equal(new Set(keys).size,keys.length);
    }
  });
  test(`${applicationType}: saved type and answers round-trip through admin and retry`,async()=>{
    const input=fixture(applicationType),result=await post('/api/consultations',input);
    assert.equal(result.response.status,201,JSON.stringify(result.data));
    const saved=await store.read(`leads/${input.requestId}.json`);
    assert.equal(saved.applicationType,applicationType);assert.deepEqual(saved.details,input.details);
    const inbox=await (await fetch(base+'/api/admin',{headers:{Cookie:cookie}})).json();
    assert.equal(inbox.items.find(item=>item.id===input.requestId).applicationType,applicationType);
    const repeated=await post('/api/consultations',input);assert.equal(repeated.response.status,200);assert.equal(repeated.data.receipt,result.data.receipt);
  });
}
test('changing application type drops old contract answers and incompatible number preferences',()=>{
  const existing=fixture('기존 이용 고객'),newForm=M.normalize({...existing,applicationType:'신규 설치'});
  assert.equal(newForm.situation,'신규 설치');
  for(const key of ['carrier','contractState','currentMonthlyFee','currentProvider'])assert.equal(newForm.details[key],undefined);
  assert.ok(M.errors(newForm,2).numberPlan);
  const switched=M.normalize({...fixture('신규 설치'),applicationType:'기존 이용 고객',situation:''});
  assert.equal(switched.details.preferredCarrier,undefined);assert.ok(M.errors(switched,2).carrier);assert.ok(M.errors(switched,2).situation);
});
test('both types allow undecided products and optional answers without irrelevant questions',()=>{
  for(const applicationType of M.applicationTypes){
    const input={...fixture(applicationType),products:['아직 잘 모르겠어요'],details:{}};
    assert.deepEqual(M.errors(input,2),{});assert.deepEqual(M.normalize(input).details,{});
    assert.equal(M.fieldsFor(input.products,applicationType).length,applicationType==='신규 설치'?0:3);
  }
});
test('invalid types, purpose and existing customer values are rejected',async()=>{
  for(const applicationType of ['',null,'invalid']){
    const result=await post('/api/consultations',{...fixture('신규 설치'),applicationType});
    assert.equal(result.response.status,400);assert.ok(result.data.errors.applicationType);
  }
  const input=fixture('기존 이용 고객');
  assert.ok(M.errors({...input,situation:'신규 설치'},2).situation);
  for(const value of ['-1','1.5','33,000','1000000000','abc'])assert.ok(M.errors({...input,details:{...input.details,currentMonthlyFee:value}},2).currentMonthlyFee);
  assert.ok(M.errors({...input,details:{...input.details,contractState:'invalid'}},2).contractState);
  assert.ok(M.errors({...input,details:{...input.details,currentProvider:'x'.repeat(81)}},2).currentProvider);
});
test('legacy application answers remain intact without guessing a customer type',()=>{
  const {applicationType,...legacy}=fixture('기존 이용 고객');legacy.details={carrier:'KT',tables:'13',rooms:'30'};
  const normalized=M.normalize(legacy);assert.equal('applicationType' in normalized,false);assert.deepEqual(normalized.details,legacy.details);
  assert.deepEqual(M.errors(normalized,2),{});assert.ok(M.detailEntries(normalized).some(entry=>entry.label==='TV'&&entry.value==='30대'));
});
