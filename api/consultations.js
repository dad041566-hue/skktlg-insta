const M=require('../survey-model.js');
const store=require('../lib/storage.cjs');
const H=require('../lib/http.cjs');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
module.exports=async function(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return H.json(res,405,{ok:false});}
  if(!H.sameOrigin(req))return H.json(res,403,{ok:false,message:'사이트에서 다시 접수해 주세요.'});
  try{
    const input=await H.body(req);
    if(!input||typeof input!=='object'||Array.isArray(input)||!UUID.test(input.requestId||'')||input.website)return H.json(res,400,{ok:false,message:'입력 내용을 확인해 주세요.'});
    const data=M.normalize(input),errors=Object.assign({},...Array.from({length:5},(_,i)=>M.errors(data,i)));
    if(Object.keys(errors).length)return H.json(res,400,{ok:false,message:Object.values(errors)[0],errors});
    const id=input.requestId.toLowerCase(),key=`leads/${id}.json`,digest=H.hash(JSON.stringify(data));
    const sameAnswers=record=>H.hash(JSON.stringify(M.normalize(record)))===digest;
    const existing=await store.read(key);
    if(existing){if(!sameAnswers(existing))return H.json(res,409,{ok:false,message:'이미 접수된 요청입니다. 창을 새로 열어 신청해 주세요.'});return H.json(res,200,{ok:true,receipt:existing.receipt});}
    if(!await H.rateLimit(req,'submit',id)||!await H.rateLimit(req,'phone',id,1,1,data.phone))return H.json(res,429,{ok:false,message:'접수 요청이 많습니다. 잠시 후 다시 시도해 주세요.'});
    const now=new Date(),receiptDay=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).replaceAll('-','');
    const record={...data,id,digest,receipt:`${receiptDay}-${id.slice(0,8).toUpperCase()}`,status:'신규',createdAt:now.toISOString(),updatedAt:now.toISOString(),expiresAt:now.getTime()+90*86400000};
    try{await store.write(key,record);}catch(e){const saved=await store.read(key);if(!saved||!sameAnswers(saved))throw e;return H.json(res,200,{ok:true,receipt:saved.receipt});}
    return H.json(res,201,{ok:true,receipt:record.receipt});
  }catch(e){return H.failure(res,e);}
};
